import type { PrismaClient } from "@prisma/client";
import { ingestContact } from "./contacts";
import { notifyUser } from "./notifications";
import { emitToAdmins, emitToUser } from "./realtime";
import { extensionFor, putObject, storageConfigured } from "./storage";
import { SERVICE_WINDOW_MS } from "./whatsapp";

export type WazzupMessage = {
  messageId?: string;
  channelId?: string;
  chatType?: string;
  chatId?: string;
  dateTime?: string;
  type?: string;
  status?: string;
  text?: string;
  contentUri?: string;
  authorName?: string;
  isEcho?: boolean;
  isDeleted?: boolean;
  contact?: { name?: string };
};

export type WazzupStatus = {
  messageId?: string;
  status?: string;
  timestamp?: string;
};

export type WazzupPayload = {
  test?: boolean;
  messages?: WazzupMessage[];
  statuses?: WazzupStatus[];
};

export function isWazzupPayload(payload: unknown): payload is WazzupPayload {
  if (!payload || typeof payload !== "object") return false;
  const body = payload as WazzupPayload;
  if (body.test === true) return true;
  return Array.isArray(body.messages) || Array.isArray(body.statuses);
}

function mapType(type?: string) {
  const t = (type || "text").toUpperCase();
  if (t === "WAPI_TEMPLATE") return "TEMPLATE" as const;
  if (t === "GEO") return "LOCATION" as const;
  if (t === "VCARD") return "CONTACT" as const;
  const allowed = ["TEXT", "IMAGE", "DOCUMENT", "AUDIO", "VOICE", "VIDEO", "LOCATION", "CONTACT", "TEMPLATE"];
  return allowed.includes(t) ? (t as "TEXT") : "TEXT";
}

function mapStatus(status?: string) {
  if (status === "delivered") return "DELIVERED" as const;
  if (status === "read") return "READ" as const;
  if (status === "error") return "FAILED" as const;
  if (status === "sent") return "SENT" as const;
  return "SENT" as const;
}

export async function handleWazzupInbound(db: PrismaClient, payload: unknown) {
  const body = payload as WazzupPayload;
  if (body.test) return [{ type: "test" }];
  const results: Array<Record<string, unknown>> = [];

  for (const status of body.statuses || []) {
    if (!status.messageId) continue;
    const existing = await db.message.findUnique({ where: { externalMessageId: status.messageId } });
    if (!existing) continue;
    const mapped = mapStatus(status.status);
    await db.message.update({
      where: { id: existing.id },
      data: {
        status: mapped,
        deliveredAt: mapped === "DELIVERED" ? new Date() : existing.deliveredAt,
        readAt: mapped === "READ" ? new Date() : existing.readAt,
        errorMessage: status.status === "error" ? "WAZZUP_ERROR" : existing.errorMessage,
      },
    });
    results.push({ type: "status", id: status.messageId, status: mapped });
  }

  for (const msg of body.messages || []) {
    if (!msg.messageId || !msg.chatId) continue;
    if (msg.chatType && msg.chatType !== "whatsapp") {
      results.push({ type: "ignored_chat", chatType: msg.chatType });
      continue;
    }
    if (msg.isDeleted) continue;
    const already = await db.message.findUnique({ where: { externalMessageId: msg.messageId } });
    if (already) {
      results.push({ type: "duplicate_message", id: msg.messageId });
      continue;
    }
    const inbound = msg.status === "inbound" && !msg.isEcho;
    const names = (msg.contact?.name || "").split(" ").filter(Boolean);
    const ingest = await ingestContact(db, {
      phone: msg.chatId,
      firstName: names[0] || "WhatsApp",
      lastName: names.slice(1).join(" "),
      source: "WHATSAPP",
    });
    const receivedAt = msg.dateTime ? new Date(msg.dateTime) : new Date();
    const windowExpiresAt = new Date(receivedAt.getTime() + SERVICE_WINDOW_MS);
    const preview = msg.text || (msg.contentUri ? "Вложение" : "WhatsApp");
    const conversation = await db.conversation.upsert({
      where: { contactId_channel: { contactId: ingest.contactId, channel: "whatsapp" } },
      create: {
        contactId: ingest.contactId,
        managerId: ingest.managerId,
        channel: "whatsapp",
        lastMessage: preview,
        lastMessageAt: receivedAt,
        lastCustomerMessageAt: inbound ? receivedAt : undefined,
        serviceWindowExpiresAt: inbound ? windowExpiresAt : undefined,
        unreadCount: inbound ? 1 : 0,
      },
      update: {
        lastMessage: preview,
        lastMessageAt: receivedAt,
        lastCustomerMessageAt: inbound ? receivedAt : undefined,
        serviceWindowExpiresAt: inbound ? windowExpiresAt : undefined,
        unreadCount: inbound ? { increment: 1 } : undefined,
        managerId: ingest.managerId ?? undefined,
      },
    });
    const saved = await db.message.create({
      data: {
        externalMessageId: msg.messageId,
        conversationId: conversation.id,
        contactId: ingest.contactId,
        managerId: ingest.managerId,
        direction: inbound ? "INBOUND" : "OUTBOUND",
        type: mapType(msg.type),
        text: msg.text || "",
        mediaUrl: msg.contentUri,
        status: inbound ? "DELIVERED" : mapStatus(msg.status),
        sentAt: receivedAt,
        rawPayload: msg as object,
      },
    });
    await storeWazzupMedia(db, saved.id, msg.contentUri, msg.type);
    if (inbound) {
      await db.activity.create({
        data: {
          contactId: ingest.contactId,
          managerId: ingest.managerId,
          type: "WHATSAPP_IN",
          title: "Клиент написал в WhatsApp (Wazzup)",
          payload: { messageId: saved.id },
        },
      });
      if (ingest.managerId) {
        await notifyUser(db, {
          userId: ingest.managerId,
          type: ingest.createdContact ? "NEW_LEAD" : "NEW_WHATSAPP",
          title: ingest.createdContact ? "Новый лид из WhatsApp" : "Новое сообщение WhatsApp",
          body: preview,
          data: { contactId: ingest.contactId, conversationId: conversation.id },
        });
        emitToUser(ingest.managerId, "whatsapp:message", {
          conversationId: conversation.id,
          contactId: ingest.contactId,
          messageId: saved.id,
        });
        if (ingest.createdContact) emitToUser(ingest.managerId, "lead:new", { contactId: ingest.contactId });
      }
      emitToAdmins("whatsapp:message", { conversationId: conversation.id });
      if (ingest.createdContact) emitToAdmins("lead:new", { contactId: ingest.contactId });
    }
    results.push({ type: inbound ? "message" : "echo", ingest, messageId: saved.id });
  }
  return results;
}

async function storeWazzupMedia(db: PrismaClient, messageId: string, contentUri?: string, type?: string) {
  if (!contentUri || !storageConfigured()) return;
  try {
    const res = await fetch(contentUri);
    if (!res.ok) return;
    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "application/octet-stream";
    const key = `wazzup/${messageId}.${extensionFor(mime)}`;
    await putObject(key, buffer, mime);
    await db.message.update({
      where: { id: messageId },
      data: { mediaUrl: key, mediaMimeType: mime, mediaSize: buffer.length, type: mapType(type) },
    });
  } catch (err) {
    console.error("wazzup_media_store_failed", (err as Error).message);
  }
}

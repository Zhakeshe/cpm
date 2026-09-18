import crypto from "crypto";
import type { PrismaClient } from "@prisma/client";
import { ingestContact } from "./contacts";
import { notifyUser } from "./notifications";
import { emitToUser, emitToAdmins } from "./realtime";

type WhatsAppMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: { id?: string; caption?: string };
  document?: { id?: string; filename?: string; caption?: string };
  audio?: { id?: string };
  voice?: { id?: string };
  video?: { id?: string; caption?: string };
  location?: { latitude?: number; longitude?: number };
  contacts?: Array<{ name?: { formatted_name?: string } }>;
};

type Status = {
  id?: string;
  status?: string;
  timestamp?: string;
};

export function verifyWhatsAppSignature(rawBody: string, header: string | null, appSecret: string) {
  if (!appSecret) return false;
  if (!header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const received = header.slice("sha256=".length);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

function mapType(type?: string) {
  const t = (type || "text").toUpperCase();
  const allowed = ["TEXT", "IMAGE", "DOCUMENT", "AUDIO", "VOICE", "VIDEO", "LOCATION", "CONTACT"];
  return allowed.includes(t) ? (t as "TEXT") : "TEXT";
}

function extractText(msg: WhatsAppMessage) {
  if (msg.text?.body) return msg.text.body;
  if (msg.image?.caption) return msg.image.caption;
  if (msg.document?.caption || msg.document?.filename) return msg.document.caption || msg.document.filename;
  if (msg.video?.caption) return msg.video.caption;
  if (msg.location) return `${msg.location.latitude},${msg.location.longitude}`;
  if (msg.contacts?.[0]?.name?.formatted_name) return msg.contacts[0].name!.formatted_name;
  return msg.type || "message";
}

export async function handleWhatsAppInbound(db: PrismaClient, payload: unknown) {
  const body = payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: WhatsAppMessage[];
          statuses?: Status[];
          contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        };
      }>;
    }>;
  };

  const results: Array<Record<string, unknown>> = [];
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const status of value.statuses || []) {
        if (!status.id) continue;
        const mapped =
          status.status === "delivered"
            ? "DELIVERED"
            : status.status === "read"
              ? "READ"
              : status.status === "failed"
                ? "FAILED"
                : "SENT";
        const existing = await db.message.findUnique({ where: { externalMessageId: status.id } });
        if (!existing) continue;
        await db.message.update({
          where: { id: existing.id },
          data: {
            status: mapped,
            deliveredAt: mapped === "DELIVERED" ? new Date() : existing.deliveredAt,
            readAt: mapped === "READ" ? new Date() : existing.readAt,
          },
        });
        results.push({ type: "status", id: status.id, status: mapped });
      }

      const profileName = value.contacts?.[0]?.profile?.name;
      for (const msg of value.messages || []) {
        if (!msg.id || !msg.from) continue;
        const already = await db.message.findUnique({ where: { externalMessageId: msg.id } });
        if (already) {
          results.push({ type: "duplicate_message", id: msg.id });
          continue;
        }
        const names = (profileName || "").split(" ");
        const ingest = await ingestContact(db, {
          phone: msg.from,
          firstName: names[0] || "WhatsApp",
          lastName: names.slice(1).join(" "),
          source: "WHATSAPP",
        });
        const conversation = await db.conversation.upsert({
          where: { contactId_channel: { contactId: ingest.contactId, channel: "whatsapp" } },
          create: {
            contactId: ingest.contactId,
            managerId: ingest.managerId,
            channel: "whatsapp",
            lastMessage: extractText(msg),
            lastMessageAt: new Date(),
            unreadCount: 1,
          },
          update: {
            lastMessage: extractText(msg),
            lastMessageAt: new Date(),
            unreadCount: { increment: 1 },
            managerId: ingest.managerId ?? undefined,
          },
        });
        const saved = await db.message.create({
          data: {
            externalMessageId: msg.id,
            conversationId: conversation.id,
            contactId: ingest.contactId,
            managerId: ingest.managerId,
            direction: "INBOUND",
            type: mapType(msg.type),
            text: extractText(msg),
            mediaId: msg.image?.id || msg.document?.id || msg.audio?.id || msg.voice?.id || msg.video?.id,
            locationLat: msg.location?.latitude,
            locationLng: msg.location?.longitude,
            status: "DELIVERED",
            sentAt: msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date(),
            rawPayload: msg as object,
          },
        });
        await db.activity.create({
          data: {
            contactId: ingest.contactId,
            managerId: ingest.managerId,
            type: "WHATSAPP_IN",
            title: "Клиент написал в WhatsApp",
            payload: { messageId: saved.id },
          },
        });
        if (ingest.managerId) {
          await notifyUser(db, {
            userId: ingest.managerId,
            type: ingest.createdContact ? "NEW_LEAD" : "NEW_WHATSAPP",
            title: ingest.createdContact ? "Новый лид из WhatsApp" : "Новое сообщение WhatsApp",
            body: extractText(msg) || "",
            data: { contactId: ingest.contactId, conversationId: conversation.id },
          });
          emitToUser(ingest.managerId, "whatsapp:message", {
            conversationId: conversation.id,
            contactId: ingest.contactId,
            messageId: saved.id,
          });
        }
        emitToAdmins("whatsapp:message", { conversationId: conversation.id });
        results.push({ type: "message", ingest, messageId: saved.id });
      }
    }
  }
  return results;
}

export async function sendWhatsAppText(params: {
  to: string;
  text: string;
  templateName?: string;
  templateLang?: string;
}) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";
  if (!token || !phoneId) {
    return { mocked: true, id: `local-${crypto.randomUUID()}` };
  }
  const body = params.templateName
    ? {
        messaging_product: "whatsapp",
        to: params.to,
        type: "template",
        template: { name: params.templateName, language: { code: params.templateLang || "ru" } },
      }
    : {
        messaging_product: "whatsapp",
        to: params.to,
        type: "text",
        text: { body: params.text },
      };
  const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error: ${err}`);
  }
  const json = (await res.json()) as { messages?: Array<{ id: string }> };
  return { mocked: false, id: json.messages?.[0]?.id || crypto.randomUUID() };
}

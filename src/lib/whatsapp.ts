/** PARKED Meta Cloud API. Do not delete — restore with WHATSAPP_TRANSPORT=meta. */
import crypto from "crypto";
import type { PrismaClient } from "@prisma/client";
import { ingestContact } from "./contacts";
import { attachTrackingAndGreet, inboundSourceFromText } from "./inbound-tracking";
import { notifyUser } from "./notifications";
import { emitToUser, emitToAdmins } from "./realtime";
import { extensionFor, putObject, storageConfigured } from "./storage";

/** Meta allows free-form replies only within 24h of the customer's last message. */
export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isServiceWindowOpen(expiresAt: Date | null | undefined) {
  return Boolean(expiresAt && expiresAt.getTime() > Date.now());
}

function graphUrl(path: string) {
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";
  return `https://graph.facebook.com/${version}/${path}`;
}

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
  if (msg.type === "audio" || msg.type === "voice") return "";
  if (msg.location) return `${msg.location.latitude},${msg.location.longitude}`;
  if (msg.contacts?.[0]?.name?.formatted_name) return msg.contacts[0].name!.formatted_name;
  return msg.type || "message";
}

export async function handleWhatsAppInbound(db: PrismaClient, payload: unknown) {
  const body = payload as {
    object?: string;
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: WhatsAppMessage[];
          statuses?: Status[];
          contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
          metadata?: { phone_number_id?: string; display_phone_number?: string };
        };
      }>;
    }>;
  };

  if (body.object && body.object !== "whatsapp_business_account") {
    return [{ type: "ignored_object", object: body.object }];
  }

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
        const inboundText = extractText(msg);
        const tracked = await inboundSourceFromText(db, inboundText);
        const ingest = await ingestContact(db, {
          phone: msg.from,
          firstName: names[0] || "WhatsApp",
          lastName: names.slice(1).join(" "),
          source: tracked.source,
          campaign: tracked.campaign,
        });
        const receivedAt = msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date();
        const windowExpiresAt = new Date(receivedAt.getTime() + SERVICE_WINDOW_MS);
        const conversation = await db.conversation.upsert({
          where: { contactId_channel: { contactId: ingest.contactId, channel: "whatsapp" } },
          create: {
            contactId: ingest.contactId,
            managerId: ingest.managerId,
            channel: "whatsapp",
            lastMessage: extractText(msg),
            lastMessageAt: receivedAt,
            lastCustomerMessageAt: receivedAt,
            serviceWindowExpiresAt: windowExpiresAt,
            unreadCount: 1,
          },
          update: {
            lastMessage: extractText(msg),
            lastMessageAt: receivedAt,
            lastCustomerMessageAt: receivedAt,
            serviceWindowExpiresAt: windowExpiresAt,
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
            sentAt: receivedAt,
            rawPayload: msg as object,
          },
        });
        await storeInboundMedia(db, saved.id, saved.mediaId, msg.document?.filename);
        await attachTrackingAndGreet(db, {
          text: inboundText,
          contactId: ingest.contactId,
          managerId: ingest.managerId,
          inbound: true,
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
          if (ingest.createdContact) {
            emitToUser(ingest.managerId, "lead:new", { contactId: ingest.contactId });
          }
        }
        emitToAdmins("whatsapp:message", { conversationId: conversation.id });
        if (ingest.createdContact) {
          emitToAdmins("lead:new", { contactId: ingest.contactId });
        }
        results.push({ type: "message", ingest, messageId: saved.id });
      }
    }
  }
  return results;
}

/**
 * Media lives behind Meta's CDN with a short-lived URL, so it is copied into our
 * own object storage while the access token is still valid.
 */
export async function storeInboundMedia(
  db: PrismaClient,
  messageId: string,
  mediaId: string | null,
  fileName?: string,
) {
  if (!mediaId) return;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token || !storageConfigured()) return;
  try {
    const metaRes = await fetch(graphUrl(mediaId), { headers: { Authorization: `Bearer ${token}` } });
    if (!metaRes.ok) throw new Error(`media lookup failed: ${metaRes.status}`);
    const meta = (await metaRes.json()) as { url?: string; mime_type?: string; file_size?: number };
    if (!meta.url) throw new Error("media url missing");
    const fileRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
    if (!fileRes.ok) throw new Error(`media download failed: ${fileRes.status}`);
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    const key = `whatsapp/${messageId}.${extensionFor(meta.mime_type)}`;
    await putObject(key, buffer, meta.mime_type);
    await db.message.update({
      where: { id: messageId },
      data: {
        mediaUrl: key,
        mediaMimeType: meta.mime_type,
        mediaFileName: fileName,
        mediaSize: meta.file_size ?? buffer.length,
      },
    });
  } catch (err) {
    console.error("whatsapp_media_store_failed", (err as Error).message);
  }
}

export class WhatsAppApiError extends Error {
  status = 400;
  constructor(
    public code: string,
    public metaCode?: number,
  ) {
    super(code);
  }
}

async function postMessage(body: Record<string, unknown>) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    return { mocked: true, id: `local-${crypto.randomUUID()}` };
  }
  const res = await fetch(graphUrl(`${phoneId}/messages`), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  if (!res.ok) {
    const raw = await res.text();
    let metaCode: number | undefined;
    try {
      metaCode = (JSON.parse(raw) as { error?: { code?: number } }).error?.code;
    } catch {
      /* keep a generic code if Meta returned non-JSON */
    }
    console.error("whatsapp_send_failed", { status: res.status, metaCode });
    if (metaCode === 131030) throw new WhatsAppApiError("RECIPIENT_NOT_ALLOWED", metaCode);
    if (metaCode === 131047) throw new WhatsAppApiError("SERVICE_WINDOW_CLOSED", metaCode);
    if (metaCode === 131026) throw new WhatsAppApiError("RECIPIENT_UNDELIVERABLE", metaCode);
    throw new WhatsAppApiError("WHATSAPP_SEND_FAILED", metaCode);
  }
  const json = (await res.json()) as { messages?: Array<{ id: string }> };
  return { mocked: false, id: json.messages?.[0]?.id || crypto.randomUUID() };
}

export async function sendWhatsAppText(params: { to: string; text: string }) {
  return postMessage({ to: params.to, type: "text", text: { body: params.text } });
}

export async function sendWhatsAppTemplate(params: {
  to: string;
  metaName: string;
  language: string;
  parameters?: string[];
}) {
  return postMessage({
    to: params.to,
    type: "template",
    template: {
      name: params.metaName,
      language: { code: params.language },
      ...(params.parameters?.length
        ? {
            components: [
              {
                type: "body",
                parameters: params.parameters.map((text) => ({ type: "text", text })),
              },
            ],
          }
        : {}),
    },
  });
}

export async function uploadMediaToMeta(file: { buffer: Buffer; mime: string; name: string }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { mocked: true, id: `local-media-${crypto.randomUUID()}` };
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", file.mime);
  form.append("file", new Blob([new Uint8Array(file.buffer)], { type: file.mime }), file.name);
  const res = await fetch(graphUrl(`${phoneId}/media`), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`WhatsApp media upload error: ${await res.text()}`);
  const json = (await res.json()) as { id: string };
  return { mocked: false, id: json.id };
}

export type OutboundMediaType = "IMAGE" | "DOCUMENT" | "AUDIO" | "VIDEO" | "VOICE";

export function whatsappMediaGraphBody(params: {
  to: string;
  type: OutboundMediaType;
  mediaId: string;
  caption?: string;
  fileName?: string;
  voiceNote?: boolean;
}) {
  const asVoice = params.voiceNote || params.type === "VOICE";
  const graphType = asVoice || params.type === "AUDIO" ? "audio" : params.type.toLowerCase();
  const payload: Record<string, unknown> = { id: params.mediaId };
  if (params.caption && (params.type === "IMAGE" || params.type === "VIDEO" || params.type === "DOCUMENT")) {
    payload.caption = params.caption;
  }
  if (params.type === "DOCUMENT" && params.fileName) payload.filename = params.fileName;
  if (asVoice) payload.voice = true;
  return { to: params.to, type: graphType, [graphType]: payload };
}

export async function sendWhatsAppMedia(params: {
  to: string;
  type: OutboundMediaType;
  mediaId: string;
  caption?: string;
  fileName?: string;
  voiceNote?: boolean;
}) {
  return postMessage(whatsappMediaGraphBody(params));
}

/** PARKED Meta hub.verify + HMAC. Webhook URL stays /api/webhooks/whatsapp. Do not delete. */
import { verifyWhatsAppSignature } from "./whatsapp";

/** Meta App Secret: new name plus the existing WABA env so current deploys keep working. */
export function metaAppSecret() {
  return process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET || "";
}

export function whatsAppVerifyToken() {
  return process.env.WHATSAPP_VERIFY_TOKEN || "";
}

/**
 * HMAC-SHA256 over the raw request body. Pass the body string as received —
 * do not JSON.stringify a parsed object and sign that.
 */
export function verifyMetaSignature(rawBody: string, signature: string | null, appSecret = metaAppSecret()) {
  if (!appSecret) return false;
  return verifyWhatsAppSignature(rawBody, signature, appSecret);
}

export function verifyWhatsAppHub(params: {
  mode: string | null;
  token: string | null;
  challenge: string | null;
}) {
  const expected = whatsAppVerifyToken();
  if (params.mode === "subscribe" && expected && params.token === expected && params.challenge != null) {
    return { ok: true as const, challenge: params.challenge };
  }
  return { ok: false as const };
}

export type InboundWhatsAppText = {
  externalMessageId: string;
  from: string;
  waId: string;
  customerName: string;
  type: string;
  text: string | null;
  timestamp: string;
  phoneNumberId: string;
};

type MetaValue = {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: Array<{
    id?: string;
    from?: string;
    timestamp?: string;
    type?: string;
    text?: { body?: string };
  }>;
  statuses?: Array<{ id?: string; status?: string; timestamp?: string }>;
};

export type MetaWhatsAppPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{ field?: string; value?: MetaValue }>;
  }>;
};

export function extractInboundMessages(payload: MetaWhatsAppPayload): InboundWhatsAppText[] {
  const out: InboundWhatsAppText[] = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id || "";
      const contact = value.contacts?.[0];
      for (const message of value.messages || []) {
        if (!message.id || !message.from) continue;
        out.push({
          externalMessageId: message.id,
          from: message.from,
          waId: contact?.wa_id || message.from,
          customerName: contact?.profile?.name || "",
          type: message.type || "unknown",
          text: message.type === "text" ? message.text?.body || null : message.text?.body || null,
          timestamp: message.timestamp || "",
          phoneNumberId,
        });
      }
    }
  }
  return out;
}

export function summarizeWhatsAppPayload(payload: MetaWhatsAppPayload) {
  let messages = 0;
  let statuses = 0;
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      messages += change.value?.messages?.length || 0;
      statuses += change.value?.statuses?.length || 0;
    }
  }
  return { object: payload.object || "unknown", entries: payload.entry?.length || 0, messages, statuses };
}

/** Never print tokens or app secrets. Full payload only in non-production. */
export function logWhatsAppWebhook(payload: MetaWhatsAppPayload) {
  const summary = summarizeWhatsAppPayload(payload);
  if (process.env.NODE_ENV !== "production") {
    console.log("WhatsApp webhook:", JSON.stringify(payload, null, 2));
    return;
  }
  console.log("whatsapp_webhook_received", summary);
}

import crypto from "crypto";
import type { TelephonyWebhook } from "./telephony";

export const ZADARMA_DEFAULTS = {
  wsUrl: "wss://pbx.zadarma.com:8089/ws",
  domain: "pbx.zadarma.com",
};

export function zadarmaCredentials() {
  const userKey = process.env.ZADARMA_USER_KEY || "";
  const secret = process.env.ZADARMA_SECRET || "";
  return { userKey, secret, configured: Boolean(userKey && secret) };
}

/** PHP hash_hmac without raw output is hex, then base64 — that is what Zadarma documents. */
export function zadarmaHmacBase64(data: string, secret: string) {
  const hex = crypto.createHmac("sha1", secret).update(data).digest("hex");
  return Buffer.from(hex, "utf8").toString("base64");
}

export function phpHttpBuildQuery(params: Record<string, string>) {
  return Object.keys(params)
    .sort()
    .map((key) => `${enc(key)}=${enc(params[key])}`)
    .join("&");
}

function enc(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

export function zadarmaNotifySignatureData(body: Record<string, string>) {
  const event = body.event || "";
  if (event === "NOTIFY_OUT_START" || event === "NOTIFY_OUT_END") {
    return `${body.internal || ""}${body.destination || ""}${body.call_start || ""}`;
  }
  if (event === "NOTIFY_ANSWER") {
    return `${body.caller_id || ""}${body.destination || ""}${body.call_start || ""}`;
  }
  if (event === "NOTIFY_RECORD") {
    return `${body.pbx_call_id || ""}${body.call_id_with_rec || ""}`;
  }
  return `${body.caller_id || ""}${body.called_did || ""}${body.call_start || ""}`;
}

export function verifyZadarmaSignature(body: Record<string, string>, header: string | null, secret: string) {
  if (!secret) return true;
  if (!header) return false;
  const expected = zadarmaHmacBase64(zadarmaNotifySignatureData(body), secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function isZadarmaNotify(body: Record<string, unknown>) {
  return typeof body.event === "string" && String(body.event).startsWith("NOTIFY_");
}

function field(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return value == null ? "" : String(value);
}

function dispositionStatus(disposition?: string): TelephonyWebhook["status"] {
  if (disposition === "answered") return "ANSWERED";
  if (disposition === "busy") return "BUSY";
  if (disposition === "no answer") return "NO_ANSWER";
  if (disposition === "cancel") return "MISSED";
  if (disposition === "failed" || disposition?.includes("limit") || disposition?.includes("money")) return "FAILED";
  return "FAILED";
}

export function mapZadarmaNotify(body: Record<string, unknown>): TelephonyWebhook | null {
  const event = field(body, "event");
  const callId = field(body, "pbx_call_id");
  if (!callId || event === "NOTIFY_IVR") return null;

  if (event === "NOTIFY_START" || event === "NOTIFY_INTERNAL") {
    return {
      event: "call.started",
      callId,
      direction: "INBOUND",
      from: field(body, "caller_id"),
      to: field(body, "called_did"),
      corporateNumber: field(body, "called_did"),
      managerExtension: field(body, "internal") || undefined,
      status: "RINGING",
      startedAt: field(body, "call_start") || undefined,
    };
  }

  if (event === "NOTIFY_OUT_START") {
    return {
      event: "call.started",
      callId,
      direction: "OUTBOUND",
      from: field(body, "internal") || field(body, "caller_id"),
      to: field(body, "destination"),
      managerExtension: field(body, "internal") || undefined,
      status: "RINGING",
      startedAt: field(body, "call_start") || undefined,
    };
  }

  if (event === "NOTIFY_ANSWER") {
    return {
      event: "call.answered",
      callId,
      direction: field(body, "internal") && field(body, "destination") ? "OUTBOUND" : "INBOUND",
      from: field(body, "caller_id"),
      to: field(body, "destination"),
      managerExtension: field(body, "internal") || undefined,
      status: "ANSWERED",
      startedAt: field(body, "call_start") || undefined,
      answeredAt: new Date().toISOString(),
    };
  }

  if (event === "NOTIFY_END" || event === "NOTIFY_OUT_END") {
    const outbound = event === "NOTIFY_OUT_END";
    const rec = field(body, "call_id_with_rec");
    return {
      event: "call.ended",
      callId,
      direction: outbound ? "OUTBOUND" : "INBOUND",
      from: outbound ? field(body, "internal") || field(body, "caller_id") : field(body, "caller_id"),
      to: outbound ? field(body, "destination") : field(body, "called_did"),
      corporateNumber: outbound ? undefined : field(body, "called_did"),
      managerExtension: field(body, "last_internal") || field(body, "internal") || undefined,
      status: dispositionStatus(field(body, "disposition")),
      startedAt: field(body, "call_start") || undefined,
      endedAt: new Date().toISOString(),
      duration: Number(field(body, "duration") || 0),
      recordingUrl: field(body, "is_recorded") === "1" && rec ? `zadarma:${rec}` : undefined,
    };
  }

  if (event === "NOTIFY_RECORD") {
    const rec = field(body, "call_id_with_rec");
    return {
      event: "call.recording",
      callId,
      direction: "INBOUND",
      from: "",
      to: "",
      recordingUrl: rec ? `zadarma:${rec}` : undefined,
    };
  }

  return null;
}

export async function zadarmaApiGet(path: string, params: Record<string, string>) {
  const { userKey, secret, configured } = zadarmaCredentials();
  if (!configured) throw new Error("ZADARMA_NOT_CONFIGURED");
  const query = phpHttpBuildQuery(params);
  const method = path.startsWith("/") ? path : `/${path}`;
  const sign = zadarmaHmacBase64(`${method}${query}${crypto.createHash("md5").update(query).digest("hex")}`, secret);
  const url = `https://api.zadarma.com${method}${query ? `?${query}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `${userKey}:${sign}` },
  });
  const json = (await res.json().catch(() => ({}))) as { status?: string; message?: string; time?: number };
  if (!res.ok || json.status === "error") {
    throw new Error(json.message || `ZADARMA_${res.status}`);
  }
  return json;
}

export async function zadarmaCallback(params: { fromExtension: string; toNumber: string }) {
  const to = params.toNumber.replace(/\D/g, "");
  const from = params.fromExtension.replace(/\D/g, "") || params.fromExtension;
  const json = await zadarmaApiGet("/v1/request/callback/", { from, to, sip: from });
  return {
    mocked: false,
    callId: `zadarma-${from}-${to}-${json.time || Date.now()}`,
  };
}

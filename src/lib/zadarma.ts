import crypto from "crypto";
import type { TelephonyWebhook } from "./telephony";
import { normalizePhone } from "./phone";
import { sipLoginSchema } from "./sip-config";

export const ZADARMA_DEFAULTS = {
  wsUrl: "",
  domain: "sip.zadarma.com",
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
  return encodeURIComponent(value).replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`).replace(/%20/g, "+");
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
  if (!secret) return false;
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
      providerInternal: field(body, "internal") || undefined,
      status: "RINGING",
      startedAt: field(body, "call_start") || undefined,
    };
  }

  if (event === "NOTIFY_OUT_START") {
    return {
      event: "call.started",
      callId,
      direction: "OUTBOUND",
      from: field(body, "caller_id") || process.env.SIP_CORPORATE_NUMBER || "",
      to: field(body, "destination"),
      providerInternal: field(body, "internal") || undefined,
      status: "RINGING",
      startedAt: field(body, "call_start") || undefined,
    };
  }

  if (event === "NOTIFY_ANSWER") {
    return {
      event: "call.answered",
      callId,
      // NOTIFY_ANSWER does not encode direction; use the persisted provider call.
      direction: undefined,
      from: field(body, "caller_id"),
      to: field(body, "destination"),
      providerInternal: field(body, "internal") || undefined,
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
      from: outbound ? field(body, "caller_id") || process.env.SIP_CORPORATE_NUMBER || "" : field(body, "caller_id"),
      to: outbound ? field(body, "destination") : field(body, "called_did"),
      corporateNumber: outbound ? undefined : field(body, "called_did"),
      providerInternal: field(body, "last_internal") || field(body, "internal") || undefined,
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
      direction: undefined,
      from: "",
      to: "",
      recordingUrl: rec ? `zadarma:${rec}` : undefined,
    };
  }

  return null;
}

export class ZadarmaError extends Error {
  constructor(public code: string, public status = 502) { super(code); }
}

export function zadarmaApiSignature(path: string, params: Record<string, string>, secret: string) {
  const query = phpHttpBuildQuery(params);
  return zadarmaHmacBase64(`${path}${query}${crypto.createHash("md5").update(query).digest("hex")}`, secret);
}

export async function zadarmaApiGet(path: string, params: Record<string, string>) {
  const { userKey, secret, configured } = zadarmaCredentials();
  if (!configured) throw new ZadarmaError("ZADARMA_NOT_CONFIGURED", 503);
  const query = phpHttpBuildQuery(params);
  const method = path.startsWith("/") ? path : `/${path}`;
  const sign = zadarmaApiSignature(method, params, secret);
  let res: Response;
  try {
    res = await fetch(`https://api.zadarma.com${method}${query ? `?${query}` : ""}`, {
      headers: { Authorization: `${userKey}:${sign}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    console.error("[ZADARMA] callback rejected", { message: "Provider unavailable or request timed out" });
    // Do not retry: a timeout can happen after the provider accepts a callback.
    throw new ZadarmaError("ZADARMA_API_ERROR");
  }
  const json = (await res.json().catch(() => null)) as { status?: string; message?: string; time?: number } | null;
  if (!res.ok || json?.status !== "success") {
    // Provider messages are untrusted and may echo submitted fields.
    const message = (typeof json?.message === "string" ? json.message : "Invalid provider response")
      .split(secret).join("[redacted]").split(userKey).join("[redacted]").split(sign).join("[redacted]")
      .replace(/\d{6,}/g, "[number]").replace(/[\r\n]/g, " ").slice(0, 250);
    console.error("[ZADARMA] callback rejected", { httpStatus: res.status, message });
    throw new ZadarmaError("ZADARMA_API_ERROR");
  }
  return json;
}

export function zadarmaDestination(input: string) {
  if (!/^\+?[\d\s().-]+$/.test(input.trim())) throw new ZadarmaError("INVALID_DESTINATION", 400);
  const destination = input.trim().startsWith("+") ? input.replace(/\D/g, "") : normalizePhone(input);
  if (!/^[1-9]\d{7,14}$/.test(destination)) throw new ZadarmaError("INVALID_DESTINATION", 400);
  return destination;
}

export function zadarmaCallbackParameters(params: { callbackEndpoint: string; toNumber: string }) {
  if (!sipLoginSchema.safeParse(params.callbackEndpoint).success) throw new ZadarmaError("SIP_ACCOUNT_NOT_CONFIGURED", 503);
  const to = zadarmaDestination(params.toNumber);
  const corporate = normalizePhone(process.env.SIP_CORPORATE_NUMBER);
  if (!/^[1-9]\d{7,14}$/.test(corporate)) throw new ZadarmaError("ZADARMA_NOT_CONFIGURED", 503);
  if (to === corporate || to === params.callbackEndpoint) throw new ZadarmaError("INVALID_DESTINATION", 400);
  // CallerID is configured on the provider SIP/PBX account, not a callback parameter.
  return { from: params.callbackEndpoint, to, sip: params.callbackEndpoint };
}

export async function zadarmaCallback(params: { managerId: string; sipAccount: string; callbackEndpoint: string; toNumber: string }) {
  const request = zadarmaCallbackParameters(params);
  console.info("[ZADARMA] callback requested", {
    managerId: params.managerId, destination: `${request.to.slice(0, 2)}***${request.to.slice(-2)}`, sipAccount: params.sipAccount,
  });
  await zadarmaApiGet("/v1/request/callback/", request);
  console.info("[ZADARMA] callback accepted", { managerId: params.managerId });
  // The documented response has no call ID. Only webhooks create Call records.
  return { accepted: true, direction: "OUTBOUND" as const };
}

/** Transport retry identity; START and INTERNAL are distinct provider events. */
export function zadarmaWebhookEventId(body: Record<string, string>) {
  return `${body.pbx_call_id}:${body.event}:${body.internal || ""}:${body.call_id_with_rec || ""}`;
}

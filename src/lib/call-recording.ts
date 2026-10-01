import { zadarmaApiGet, ZadarmaError } from "./zadarma";

export async function resolveRecordingUrl(reference: string) {
  if (!reference.startsWith("zadarma:")) {
    const url = new URL(reference);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("INVALID_RECORDING_URL");
    return { url: url.toString(), provider: false };
  }
  const callId = reference.slice("zadarma:".length);
  if (!callId || callId.length > 256) throw new Error("INVALID_RECORDING_ID");
  const result = await zadarmaApiGet("/v1/pbx/record/request/", { call_id: callId, lifetime: "180" });
  if (!result.link) throw new ZadarmaError("RECORDING_NOT_READY", 503);
  const url = new URL(result.link);
  if (url.origin !== "https://api.zadarma.com" || !url.pathname.startsWith("/v1/pbx/record/download/")) {
    throw new ZadarmaError("INVALID_RECORDING_URL");
  }
  return { url: url.toString(), provider: true };
}

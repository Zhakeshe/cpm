export const ZADARMA_WEBRTC_CALLBACK = "zdrmApi.zadarmaCallbackCall";

/** The official client receives a datacenter hostname and temporary credentials, on WSS port 4443. */
export function parseZadarmaWebrtcData(text: string) {
  const raw = text.trim();
  const json = raw.startsWith(ZADARMA_WEBRTC_CALLBACK + "(") ? raw.slice(ZADARMA_WEBRTC_CALLBACK.length + 1).replace(/\);?\s*$/, "") : raw;
  const data = JSON.parse(json) as { domain?: unknown; username?: unknown; pass?: unknown };
  if (typeof data.domain !== "string" || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:zadarma\.com|sipdc\.net)$/i.test(data.domain)
    || typeof data.username !== "string" || !/^[a-z0-9_-]+$/i.test(data.username)
    || typeof data.pass !== "string" || !data.pass) throw new Error("INVALID_WEBRTC_RESPONSE");
  return { wsUrl: `wss://${data.domain}:4443`, uri: `sip:${data.username}@${data.domain}`, password: data.pass };
}


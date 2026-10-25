import { zadarmaWebrtcKey } from "./zadarma";

const CALLBACK = "zdrmApi.zadarmaCallbackCall";

/** The official client receives a datacenter hostname and temporary credentials, on WSS port 4443. */
export function parseZadarmaWebrtcData(text: string) {
  const raw = text.trim();
  const json = raw.startsWith(CALLBACK + "(") ? raw.slice(CALLBACK.length + 1).replace(/\);?\s*$/, "") : raw;
  const data = JSON.parse(json) as { domain?: unknown; username?: unknown; pass?: unknown };
  if (typeof data.domain !== "string" || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:zadarma\.com|sipdc\.net)$/i.test(data.domain)
    || typeof data.username !== "string" || !/^[a-z0-9_-]+$/i.test(data.username)
    || typeof data.pass !== "string" || !data.pass) throw new Error("INVALID_WEBRTC_RESPONSE");
  return { wsUrl: `wss://${data.domain}:4443`, uri: `sip:${data.username}@${data.domain}`, password: data.pass };
}

export async function zadarmaWebrtcCredentials(sip: string, origin: string) {
  try {
    const key = await zadarmaWebrtcKey(sip);
    const params = new URLSearchParams({ jsonpCallback: CALLBACK, key, integrationType: "site", sipId: sip });
    const response = await fetch(`https://api.zadarma.com/sys/webrtc/get_webphone_data.php?${params}`, {
      headers: { Origin: new URL(origin).origin, Referer: new URL("/", origin).href },
      signal: AbortSignal.timeout(10_000), cache: "no-store",
    });
    if (!response.ok) throw new Error("WEBRTC_RESPONSE_FAILED");
    return parseZadarmaWebrtcData(await response.text());
  } catch {
    // Never bubble up URLs containing the temporary key or provider credential responses.
    throw Object.assign(new Error("ZADARMA_WEBRTC_UNAVAILABLE"), { status: 503 });
  }
}

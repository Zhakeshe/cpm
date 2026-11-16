import { zadarmaWebrtcKey } from "./zadarma";

import { ZADARMA_WEBRTC_CALLBACK as CALLBACK, parseZadarmaWebrtcData } from "./zadarma-webrtc-data";
export { parseZadarmaWebrtcData } from "./zadarma-webrtc-data";

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

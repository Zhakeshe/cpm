import { ZADARMA_WEBRTC_CALLBACK, parseZadarmaWebrtcData } from "./zadarma-webrtc-data";

export const SIP_CLIENT_VERSION = "browser-auth-v1";
export type ZadarmaBrowserBootstrap = { provider: "zadarma"; key: string; sip: string };

/** Fetch credentials from the same browser/network that opens the provider WebSocket. */
export async function browserSipRegistration(config: ZadarmaBrowserBootstrap, signal: AbortSignal) {
  const request = new AbortController();
  const cancel = () => request.abort();
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) request.abort();
  const timeout = setTimeout(cancel, 15_000);
  try {
    const params = new URLSearchParams({ jsonpCallback: ZADARMA_WEBRTC_CALLBACK, key: config.key, integrationType: "site", sipId: config.sip });
    const response = await fetch(`https://api.zadarma.com/sys/webrtc/get_webphone_data.php?${params}`, {
      mode: "cors", credentials: "omit", cache: "no-store", signal: request.signal,
    });
    if (!response.ok) throw new Error("PROVIDER_UNAVAILABLE");
    return parseZadarmaWebrtcData(await response.text());
  } catch {
    // URL parameters and provider response bodies contain credentials; never surface them.
    throw new Error("CONNECTION_FAILED");
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", cancel);
  }
}

import { afterEach, describe, expect, it, vi } from "vitest";
import { browserSipRegistration } from "../src/lib/sip-browser";
afterEach(() => vi.unstubAllGlobals());
describe("browser-side Zadarma handshake", () => {
  it("obtains provider credentials in the browser with CORS and a cancellable request", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('zdrmApi.zadarmaCallbackCall({"domain":"pbxfr1.zadarma.com","username":"test-101","pass":"test-only"});'));
    vi.stubGlobal("fetch", fetcher);
    const signal = new AbortController().signal;
    expect(await browserSipRegistration({ provider: "zadarma", key: "test-key", sip: "test-101" }, signal)).toEqual({ wsUrl: "wss://pbxfr1.zadarma.com:4443", uri: "sip:test-101@pbxfr1.zadarma.com", password: "test-only" });
    const [url, options] = fetcher.mock.calls[0];
    expect(new URL(url).searchParams.get("sipId")).toBe("test-101");
    expect(options).toMatchObject({ mode: "cors", credentials: "omit", cache: "no-store" });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
  it("does not expose a credential URL on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("failed URL with test-key")));
    await expect(browserSipRegistration({ provider: "zadarma", key: "test-key", sip: "test-101" }, new AbortController().signal)).rejects.toThrow("CONNECTION_FAILED");
  });
});

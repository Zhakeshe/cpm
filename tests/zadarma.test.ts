import { afterEach, describe, expect, it, vi } from "vitest";
import {
  mapZadarmaNotify,
  normalizeZadarmaDialNumber,
  phpHttpBuildQuery,
  resolveZadarmaCallbackSip,
  verifyZadarmaSignature,
  zadarmaHmacBase64,
  zadarmaNotifySignatureData,
  zadarmaWebrtcKey,
} from "../src/lib/zadarma";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("zadarma notify mapping", () => {
  it("maps inbound start and answered hangup", () => {
    const start = mapZadarmaNotify({
      event: "NOTIFY_START",
      pbx_call_id: "in-1",
      caller_id: "77015551122",
      called_did: "77270000000",
      call_start: "2026-09-22 12:00:00",
    });
    expect(start?.event).toBe("call.started");
    expect(start?.direction).toBe("INBOUND");
    expect(start?.from).toBe("77015551122");

    const internal = mapZadarmaNotify({
      event: "NOTIFY_INTERNAL",
      pbx_call_id: "in-1",
      caller_id: "77015551122",
      called_did: "77270000000",
      internal: "101",
      call_start: "2026-09-22 12:00:00",
    });
    expect(internal?.managerExtension).toBe("101");

    const end = mapZadarmaNotify({
      event: "NOTIFY_END",
      pbx_call_id: "in-1",
      caller_id: "77015551122",
      called_did: "77270000000",
      disposition: "answered",
      duration: "42",
      is_recorded: "1",
      call_id_with_rec: "rec-9",
      last_internal: "101",
    });
    expect(end?.event).toBe("call.ended");
    expect(end?.status).toBe("ANSWERED");
    expect(end?.duration).toBe(42);
    expect(end?.recordingUrl).toBe("zadarma:rec-9");
  });

  it("maps outbound start and missed inbound", () => {
    const out = mapZadarmaNotify({
      event: "NOTIFY_OUT_START",
      pbx_call_id: "out-2",
      destination: "77019990000",
      internal: "102",
      call_start: "2026-09-22 12:01:00",
    });
    expect(out?.direction).toBe("OUTBOUND");
    expect(out?.to).toBe("77019990000");
    expect(out?.managerExtension).toBe("102");

    const missed = mapZadarmaNotify({
      event: "NOTIFY_END",
      pbx_call_id: "in-3",
      caller_id: "7701",
      called_did: "7727",
      disposition: "cancel",
    });
    expect(missed?.status).toBe("MISSED");
    expect(mapZadarmaNotify({ event: "NOTIFY_IVR", pbx_call_id: "x" })).toBeNull();
  });

  it("verifies Signature the same way as the PHP docs", () => {
    const body = {
      event: "NOTIFY_START",
      caller_id: "7701",
      called_did: "7727",
      call_start: "2026-01-01 00:00:00",
    };
    const secret = "test-secret";
    const header = zadarmaHmacBase64(zadarmaNotifySignatureData(body), secret);
    expect(verifyZadarmaSignature(body, header, secret)).toBe(true);
    expect(verifyZadarmaSignature(body, "nope", secret)).toBe(false);
    expect(phpHttpBuildQuery({ to: "7701", from: "101" })).toBe("from=101&to=7701");
  });

  it("uses an internal extension for PBX callback and a full standalone login", () => {
    expect(resolveZadarmaCallbackSip("101", "593615-101")).toBe("101");
    expect(resolveZadarmaCallbackSip("101", "158925")).toBe("158925");
    expect(resolveZadarmaCallbackSip("104", null)).toBe("104");
  });

  it("dials Kazakhstan +7 lead numbers through the 8 prefix", () => {
    expect(normalizeZadarmaDialNumber("+7 701 234 56 78")).toBe("87012345678");
    expect(normalizeZadarmaDialNumber("8 (701) 234-56-78")).toBe("87012345678");
    expect(normalizeZadarmaDialNumber("12345")).toBe("12345");
  });

  it("requests a short-lived WebRTC key for the full SIP login", async () => {
    vi.stubEnv("ZADARMA_USER_KEY", "test-user-key");
    vi.stubEnv("ZADARMA_SECRET", "test-secret");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ status: "success", key: "temporary-webrtc-key" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));

    await expect(zadarmaWebrtcKey("593615-100")).resolves.toBe("temporary-webrtc-key");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/v1/webrtc/get_key/?sip=593615-100");
  });
});

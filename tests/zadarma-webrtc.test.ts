import { describe, expect, it, vi } from "vitest";
vi.mock("../src/lib/zadarma", () => ({ zadarmaWebrtcKey: async () => "test-temporary-key" }));
import { parseZadarmaWebrtcData, zadarmaWebrtcCredentials } from "../src/lib/zadarma-webrtc";
describe("Zadarma WebRTC datacenter discovery", () => {
  it("uses the provider-selected datacenter and WSS port", () => {
    expect(parseZadarmaWebrtcData('zdrmApi.zadarmaCallbackCall({"domain":"pbxfr1.zadarma.com","username":"test-101","pass":"test-only"});'))
      .toEqual({ wsUrl: "wss://pbxfr1.zadarma.com:4443", uri: "sip:test-101@pbxfr1.zadarma.com", password: "test-only" });
  });
  it("rejects error responses, untrusted hosts, missing passwords and SIP header injection", () => {
    for (const data of [{error:true}, {domain:"internal.invalid",username:"test",pass:"test"}, {domain:"pbxfr1.zadarma.com",username:"test"}, {domain:"pbxfr1.zadarma.com",username:"test\r\nHeader:evil",pass:"test"}]) {
      expect(() => parseZadarmaWebrtcData(JSON.stringify(data))).toThrow();
    }
  });
  it("hides credential URLs and provider errors from callers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("URL with test-temporary-key")));
    await expect(zadarmaWebrtcCredentials("test-101", "https://crm.example.com")).rejects.toMatchObject({ message: "ZADARMA_WEBRTC_UNAVAILABLE", status: 503 });
    vi.unstubAllGlobals();
  });
});

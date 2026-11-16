import { expect, it } from "vitest";
import { sipFailureReason } from "../src/lib/sip-diagnostics";
it("separates browser permission failures from network audio failures", () => {
  expect(sipFailureReason("NotAllowedError")).toBe("MICROPHONE_DENIED");
  expect(sipFailureReason("RTP Timeout")).toBe("ICE_FAILED");
  expect(sipFailureReason("unknown provider data")).toBe("CALL_FAILED");
});

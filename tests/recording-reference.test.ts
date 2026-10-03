import { expect, it } from "vitest";
import { recordingReference } from "../src/lib/recording-reference";
it("finds a recording stored only in the Recording relation", () => {
  expect(recordingReference({ recordingUrl: null, recordings: [{ url: "zadarma:record-id" }] })).toBe("zadarma:record-id");
});
it("retains the Call URL and skips empty Recording rows", () => {
  expect(recordingReference({ recordingUrl: "zadarma:call-record", recordings: [{ url: "other" }] })).toBe("zadarma:call-record");
  expect(recordingReference({ recordings: [{ url: "" }, { url: "zadarma:second" }] })).toBe("zadarma:second");
  expect(recordingReference({})).toBeNull();
});

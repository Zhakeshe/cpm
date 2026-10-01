import { afterEach, beforeEach, expect, it, vi } from "vitest";
const api = vi.hoisted(() => vi.fn());
vi.mock("../src/lib/zadarma", () => ({ zadarmaApiGet: api, ZadarmaError: class extends Error { constructor(public code: string, public status = 502) { super(code); } } }));
import { resolveRecordingUrl } from "../src/lib/call-recording";
beforeEach(() => vi.clearAllMocks()); afterEach(() => vi.restoreAllMocks());
it("resolves recording ID using documented API and shortest link lifetime", async () => {
  api.mockResolvedValue({ link: "https://api.zadarma.com/v1/pbx/record/download/test/record.mp3" });
  expect(await resolveRecordingUrl("zadarma:rec-1")).toEqual({ url: "https://api.zadarma.com/v1/pbx/record/download/test/record.mp3", provider: true });
  expect(api).toHaveBeenCalledWith("/v1/pbx/record/request/", { call_id: "rec-1", lifetime: "180" });
});
it("rejects untrusted provider download destinations", async () => {
  api.mockResolvedValue({ link: "http://127.0.0.1/private" });
  await expect(resolveRecordingUrl("zadarma:rec-1")).rejects.toThrow("INVALID_RECORDING_URL");
});
it("offers retry while provider recording is not ready", async () => {
  api.mockResolvedValue({ status: "success" });
  await expect(resolveRecordingUrl("zadarma:rec-1")).rejects.toThrow("RECORDING_NOT_READY");
});
it("preserves legacy web recordings and rejects script protocols", async () => {
  expect(await resolveRecordingUrl("https://storage.example.test/record.mp3")).toEqual({ url: "https://storage.example.test/record.mp3", provider: false });
  await expect(resolveRecordingUrl("javascript:alert(1)")).rejects.toThrow();
});

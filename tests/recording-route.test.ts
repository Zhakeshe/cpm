import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), call: vi.fn(), resolve: vi.fn() }));
vi.mock("@/lib/api", () => ({ requireUser: mocks.auth, jsonError: (error: { message: string; status: number }) => Response.json({ error: error.message }, { status: error.status }) }));
vi.mock("@/lib/db", () => ({ prisma: { call: { findUnique: mocks.call } } }));
vi.mock("@/lib/call-recording", () => ({ resolveRecordingUrl: mocks.resolve }));
import { GET } from "../src/app/api/calls/[id]/recording/route";
const ctx = { params: Promise.resolve({ id: "call-1" }) };
beforeEach(() => {
  vi.clearAllMocks(); mocks.auth.mockResolvedValue({ id: "u1", role: "MANAGER" });
  mocks.call.mockResolvedValue({ managerId: "u1", recordingUrl: "zadarma:rec-1", recordings: [] });
  mocks.resolve.mockResolvedValue({ url: "https://api.zadarma.com/v1/pbx/record/download/test/audio.mp3", provider: true });
});
afterEach(() => vi.unstubAllGlobals());
it("does not fetch another manager's recording", async () => {
  mocks.call.mockResolvedValue({ managerId: "u2", recordingUrl: "zadarma:rec-2", recordings: [] });
  const response = await GET(new NextRequest("http://localhost/api/calls/call-1/recording"), ctx);
  expect(response.status).toBe(403); expect(mocks.resolve).not.toHaveBeenCalled();
});
it("streams audio with Range and no-store, without disclosing provider link", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("audio", { status: 206, headers: { "content-type": "audio/mpeg", "content-range": "bytes 0-4/10" } }));
  vi.stubGlobal("fetch", fetchMock);
  const response = await GET(new NextRequest("http://localhost/api/calls/call-1/recording", { headers: { Range: "bytes=0-4" } }), ctx);
  expect(response.status).toBe(206); expect(await response.text()).toBe("audio");
  expect(response.headers.get("cache-control")).toContain("no-store"); expect(response.headers.get("location")).toBeNull();
  expect(fetchMock.mock.calls[0][1].headers).toEqual({ Range: "bytes=0-4" });
});
it("preserves admin-only downloads", async () => {
  const response = await GET(new NextRequest("http://localhost/api/calls/call-1/recording?download=1"), ctx);
  expect(response.status).toBe(403); expect(mocks.resolve).not.toHaveBeenCalled();
});

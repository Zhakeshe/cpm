import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), contact: vi.fn(), manager: vi.fn(), originate: vi.fn(), calls: vi.fn() }));
vi.mock("@/lib/api", () => ({ requireUser: mocks.auth, jsonError: (e: Error) => Response.json({ error: e.message }, { status: 401 }) }));
vi.mock("@/lib/db", () => ({ prisma: { call: { findMany: mocks.calls }, contact: { findUnique: mocks.contact }, user: { findUnique: mocks.manager } } }));
vi.mock("@/lib/telephony", () => ({ originateCall: mocks.originate }));
import { GET, POST } from "../src/app/api/calls/route";
import { ZadarmaError } from "../src/lib/zadarma";
const request = () => new NextRequest("http://localhost/api/calls", { method: "POST", body: JSON.stringify({ contactId: "c1", managerId: "other-user" }) });
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("SIP_ACCOUNTS_JSON", "{}");
  mocks.auth.mockResolvedValue({ id: "u1", role: "MANAGER" });
  mocks.contact.mockResolvedValue({ id: "c1", managerId: "u1", phoneNormalized: "77762010702" });
  mocks.manager.mockResolvedValue({ isActive: true, sipExtension: "101", sipUsername: "158925" });
  mocks.originate.mockResolvedValue({ accepted: true, direction: "OUTBOUND" });
});
afterEach(() => vi.unstubAllEnvs());
it("authenticates the current manager, submits real login, accepts without synthesizing Call", async () => {
  const response = await POST(request());
  expect(response.status).toBe(202);
  expect(await response.json()).toEqual({ accepted: true, direction: "OUTBOUND" });
  expect(mocks.originate).toHaveBeenCalledWith({ managerId: "u1", sipAccount: "158925", callbackEndpoint: "158925", toNumber: "77762010702" });
  // No prisma.call or event handler is provided: synthesizing a local Call would fail this test.
});
it("rejects unauthenticated requests", async () => {
  mocks.auth.mockRejectedValue(new Error("UNAUTHORIZED"));
  expect((await POST(request())).status).toBe(401); expect(mocks.originate).not.toHaveBeenCalled();
});
it("does not borrow another user's extension or use default 101", async () => {
  mocks.manager.mockResolvedValue({ isActive: true, sipExtension: "101", sipUsername: null });
  const response = await POST(request());
  expect(response.status).toBe(503); expect(await response.json()).toEqual({ error: "SIP_ACCOUNT_NOT_CONFIGURED" });
  expect(mocks.originate).not.toHaveBeenCalled();
});
it("returns a real provider failure without success", async () => {
  mocks.originate.mockRejectedValue(new ZadarmaError("ZADARMA_API_ERROR"));
  const response = await POST(request());
  expect(response.status).toBe(502); expect(await response.json()).toEqual({ error: "ZADARMA_API_ERROR" });
});
it("prevents managers from calling contacts they cannot access", async () => {
  mocks.contact.mockResolvedValue({ managerId: "other", phoneNormalized: "77762010702" });
  expect((await POST(request())).status).toBe(403); expect(mocks.originate).not.toHaveBeenCalled();
});

it("a manager cannot select another manager's call history", async () => {
  mocks.calls.mockResolvedValue([]);
  const response = await GET(new NextRequest("http://localhost/api/calls?manager=other-user"));
  expect(response.status).toBe(200);
  expect(mocks.calls).toHaveBeenCalledWith(expect.objectContaining({ where: { managerId: "u1" }, include: expect.objectContaining({ recordings: true }) }));
});
it("a supervisor can explicitly filter call history by manager", async () => {
  mocks.auth.mockResolvedValue({ id: "supervisor", role: "SUPERVISOR" });
  mocks.calls.mockResolvedValue([]);
  expect((await GET(new NextRequest("http://localhost/api/calls?manager=u2"))).status).toBe(200);
  expect(mocks.calls).toHaveBeenCalledWith(expect.objectContaining({ where: { managerId: "u2" } }));
});

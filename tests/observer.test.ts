import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { canSeeAllRecords, canReassignManager, canManageSettings, observerCanRequest, scopeManagerId } from "../src/lib/rbac";

const state = vi.hoisted(() => ({
  tokenRole: "OBSERVER", liveRole: "OBSERVER", invalidToken: false,
  update: vi.fn(), ingest: vi.fn(),
}));
vi.mock("jose", () => ({ jwtVerify: async () => {
  if (state.invalidToken) throw new Error("expired");
  return { payload: { id: "viewer", role: state.tokenRole } };
} }));
vi.mock("../src/lib/auth", () => ({ getSession: async () => ({ id: "viewer", role: state.tokenRole, email: "observer@test.invalid", name: "Observer" }) }));
vi.mock("../src/lib/db", () => ({ prisma: {
  user: { findUnique: async () => ({ isActive: true, email: "observer@test.invalid", name: "Observer", role: state.liveRole }) },
  conversation: { findUnique: async () => ({ id: "thread", managerId: "viewer", unreadCount: 3 }), update: state.update },
} }));
vi.mock("../src/lib/rate-limit", () => ({ rateLimit: async () => ({ ok: true }) }));
vi.mock("../src/lib/contacts", () => ({ ingestContact: state.ingest, reassignContact: vi.fn() }));
import { middleware } from "../src/middleware";
import { requireWritableUser } from "../src/lib/api";
import { GET as thread } from "../src/app/api/messages/[id]/route";
import { POST as createContact } from "../src/app/api/contacts/route";

beforeEach(() => { state.tokenRole = "OBSERVER"; state.liveRole = "OBSERVER"; state.invalidToken = false; vi.clearAllMocks(); });
const request = (path: string, method = "GET") => new NextRequest("https://crm.test" + path, { method, headers: { cookie: "crm_session=synthetic" } });

describe("observer access", () => {
  it("can see all business records without acquiring management permissions", () => {
    expect(canSeeAllRecords("OBSERVER")).toBe(true);
    expect(scopeManagerId("OBSERVER", "viewer")).toBeUndefined();
    expect(canReassignManager("OBSERVER")).toBe(false);
    expect(canManageSettings("OBSERVER")).toBe(false);
  });
  it.each(["POST", "PUT", "PATCH", "DELETE"])("blocks %s writes before a route can run", async method => {
    const response = await middleware(request("/api/contacts", method));
    expect(response.status).toBe(403); expect(await response.json()).toEqual({ error: "READ_ONLY" });
  });
  it.each(["/api/sip/credentials?browser=1", "/api/sip/webrtc-key", "/api/export/leads", "/api/settings"])("does not grant observer operational credentials or exports: %s", async path => {
    expect((await middleware(request(path))).status).toBe(403);
  });
  it("preserves reading, search and logout", async () => {
    expect((await middleware(request("/api/contacts?q=test"))).headers.get("x-middleware-next")).toBe("1");
    expect((await middleware(request("/api/auth/logout", "POST"))).headers.get("x-middleware-next")).toBe("1");
    expect(observerCanRequest("POST", "/api/public/leads")).toBe(false);
  });
  it("keeps password login reachable when an earlier session cookie has expired", async () => {
    state.invalidToken = true;
    expect((await middleware(request("/api/auth/login", "POST"))).headers.get("x-middleware-next")).toBe("1");
  });
  it("uses the live role even when the cookie still claims MANAGER", async () => {
    state.tokenRole = "MANAGER";
    await expect(requireWritableUser()).rejects.toMatchObject({ status: 403, message: "READ_ONLY" });
    const response = await createContact(request("/api/contacts", "POST"));
    expect(response.status).toBe(403); expect(state.ingest).not.toHaveBeenCalled();
  });
  it("does not mark conversations read while an observer browses them", async () => {
    const response = await thread(request("/api/messages/thread"), { params: Promise.resolve({ id: "thread" }) });
    expect(response.status).toBe(200); expect((await response.json()).unreadCount).toBe(3);
    expect(state.update).not.toHaveBeenCalled();
  });
  it("preserves manager writes and normal unread clearing", async () => {
    state.tokenRole = "MANAGER"; state.liveRole = "MANAGER";
    expect((await requireWritableUser()).role).toBe("MANAGER");
    expect((await thread(request("/api/messages/thread"), { params: Promise.resolve({ id: "thread" }) })).status).toBe(200);
    expect(state.update).toHaveBeenCalledWith({ where: { id: "thread" }, data: { unreadCount: 0 } });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ actor: { id: "admin", role: "ADMIN" }, findMany: vi.fn(async (_args: any) => []), findUnique: vi.fn(async () => ({ role: "MANAGER" })), update: vi.fn(async () => ({ id: "manager" })), audit: vi.fn(async () => ({})) }));
vi.mock("../src/lib/api", () => ({ requireUser: async () => mocks.actor, requireAdmin: async () => mocks.actor, jsonError: (e: Error) => new Response(JSON.stringify({ error: e.message }), { status: 500 }) }));
vi.mock("../src/lib/db", () => ({ prisma: { $transaction: async (fn: any) => fn({ user: { update: mocks.update }, auditLog: { create: mocks.audit } }), user: { findMany: mocks.findMany, findUnique: mocks.findUnique, update: mocks.update }, auditLog: { create: mocks.audit } } }));
import { GET, PATCH } from "../src/app/api/users/route";
function patch(data: object) { return PATCH(new NextRequest("http://localhost/api/users", { method: "PATCH", body: JSON.stringify({ id: "manager", ...data }) })); }
beforeEach(() => { vi.clearAllMocks(); mocks.actor.role = "ADMIN"; });
describe("manager recovery", () => {
  it("allows only administrators to include inactive accounts", async () => {
    await GET(new NextRequest("http://localhost/api/users?includeInactive=1"));
    expect(mocks.findMany.mock.calls[0][0].where).toEqual({});
    mocks.actor.role = "SUPERVISOR"; mocks.findMany.mockClear();
    await GET(new NextRequest("http://localhost/api/users?includeInactive=1"));
    expect(mocks.findMany.mock.calls[0][0].where).toEqual({ isActive: true });
  });
  it("requires an explicit acknowledgement before disabling access", async () => {
    expect((await patch({ isActive: false })).status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("disables access without changing leads or history", async () => {
    expect((await patch({ isActive: false, confirmDisable: true })).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "manager" }, data: { isActive: false, acceptsNewLeads: false, isOnline: false } });
  });
  it("restores access and assignments without marking an offline person online", async () => {
    expect((await patch({ isActive: true })).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "manager" }, data: { isActive: true, acceptsNewLeads: true, isOnline: false } });
  });
});

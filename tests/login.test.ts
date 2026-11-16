import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn(), audit: vi.fn(), verify: vi.fn(), session: vi.fn(), limit: vi.fn(), totp: vi.fn() }));
vi.mock("../src/lib/db", () => ({ prisma: { user: { findUnique: mocks.findUnique, update: mocks.update }, auditLog: { create: mocks.audit } } }));
vi.mock("../src/lib/auth", () => ({ setSessionCookie: mocks.session, verifyPassword: mocks.verify }));
vi.mock("../src/lib/totp", () => ({ verifyTotp: mocks.totp }));
vi.mock("../src/lib/rate-limit", () => ({
  clientIp: () => "127.0.0.1", rateLimit: mocks.limit,
  tooManyRequests: (seconds: number) => Response.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "Retry-After": String(seconds) } }),
}));
import { POST } from "../src/app/api/auth/login/route";

const request = (body: unknown) => new NextRequest("https://crm.test/api/auth/login", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
const user = { id: "admin", email: "admin@crm.local", name: "Admin", role: "ADMIN", isActive: true, passwordHash: "test-hash", totpEnabled: false };
beforeEach(() => {
  vi.clearAllMocks(); mocks.findUnique.mockResolvedValue(user); mocks.verify.mockResolvedValue(true);
  mocks.limit.mockResolvedValue({ ok: true, retryAfter: 0 }); mocks.session.mockResolvedValue(undefined);
  mocks.update.mockResolvedValue(user); mocks.audit.mockResolvedValue({});
});

describe("password login", () => {
  it("normalizes pasted email but preserves intentional password spaces", async () => {
    const result = await POST(request({ email: "  ADMIN@CRM.LOCAL  ", password: " password with spaces " }));
    expect(result.status).toBe(200);
    expect(mocks.findUnique).toHaveBeenCalledWith({ where: { email: "admin@crm.local" } });
    expect(mocks.verify).toHaveBeenCalledWith(" password with spaces ", "test-hash");
    expect(mocks.limit).toHaveBeenCalledWith("login:email:admin@crm.local", 10, 900);
    expect(mocks.session).toHaveBeenCalledOnce();
  });
  it("keeps a rate-limit response distinct from a wrong password", async () => {
    mocks.limit.mockResolvedValue({ ok: false, retryAfter: 123 });
    const result = await POST(request({ email: user.email, password: "test" }));
    expect(result.status).toBe(429); expect(result.headers.get("Retry-After")).toBe("123");
    expect(await result.json()).toEqual({ error: "RATE_LIMIT" }); expect(mocks.verify).not.toHaveBeenCalled();
  });
  it("rejects the actual wrong password without creating a session", async () => {
    mocks.verify.mockResolvedValue(false);
    const result = await POST(request({ email: user.email, password: "wrong" }));
    expect(result.status).toBe(401); expect(await result.json()).toEqual({ error: "INVALID_CREDENTIALS" }); expect(mocks.session).not.toHaveBeenCalled();
  });
  it("keeps disabled accounts disabled", async () => {
    mocks.findUnique.mockResolvedValue({ ...user, isActive: false });
    const result = await POST(request({ email: user.email, password: "test" }));
    expect(result.status).toBe(403); expect(mocks.session).not.toHaveBeenCalled();
  });
  it("rejects an empty pasted email with a JSON validation error", async () => {
    const result = await POST(request({ email: "   ", password: "test" }));
    expect(result.status).toBe(400); expect(await result.json()).toEqual({ error: "INVALID_INPUT" }); expect(mocks.limit).not.toHaveBeenCalled();
  });
  it("does not turn a database outage into an invalid-password response", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.findUnique.mockRejectedValueOnce(new Error("database unavailable"));
    const result = await POST(request({ email: user.email, password: "private-input" }));
    expect(result.status).toBe(500); expect(await result.json()).toEqual({ error: "SERVER_ERROR" });
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-input"); log.mockRestore();
  });
});

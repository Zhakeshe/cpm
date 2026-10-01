import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), integration: vi.fn() }));
vi.mock("@/lib/api", () => ({ requireUser: mocks.auth, jsonError: (e: Error) => Response.json({ error: e.message }, { status: 401 }) }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: mocks.user }, integration: { findUnique: mocks.integration } } }));
import { GET } from "../src/app/api/sip/credentials/route";
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("SIP_ACCOUNTS_JSON", '{"101":{"username":"158925","password":"current-only"},"102":{"username":"200223","password":"other-secret"}}');
  vi.stubEnv("SIP_WS_URL", "wss://example.test/ws"); vi.stubEnv("SIP_DOMAIN", "sip.zadarma.com");
  mocks.auth.mockResolvedValue({ id: "u1", name: "Current user" });
  mocks.user.mockResolvedValue({ sipExtension: "101", sipUsername: "158925" });
  mocks.integration.mockResolvedValue(null);
});
afterEach(() => vi.unstubAllEnvs());
it("returns only current user's credentials with no-store", async () => {
  const response = await GET(); const body = await response.json();
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(body.password).toBe("current-only"); expect(JSON.stringify(body)).not.toContain("other-secret");
  expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "u1" } }));
});
it("requires authentication even for disabled/error responses", async () => {
  mocks.auth.mockRejectedValue(new Error("UNAUTHORIZED"));
  const response = await GET(); expect(response.status).toBe(401); expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(mocks.user).not.toHaveBeenCalled();
});
it("does not expose legacy credentials stored in integration settings", async () => {
  vi.stubEnv("SIP_ACCOUNTS_JSON", "{}");
  mocks.integration.mockResolvedValue({ config: { extensions: { "101": { username: "158925", password: "db-secret" } } } });
  const response = await GET(); expect((await response.json()).enabled).toBe(false);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});

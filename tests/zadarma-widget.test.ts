import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), api: vi.fn() }));
vi.mock("@/lib/api", () => ({ requireUser: mocks.auth, jsonError: (e: Error & { status?: number }) => Response.json({ error: e.message }, { status: e.status || 500 }) }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: mocks.user } } }));
vi.mock("@/lib/zadarma", async (original) => ({ ...await original<object>(), zadarmaApiGet: mocks.api }));
import { GET } from "../src/app/api/sip/widget/route";
import { zadarmaWidgetDocument } from "../src/lib/zadarma-widget";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SIP_BROWSER_MODE", "zadarma-widget");
  vi.stubEnv("SIP_ACCOUNTS_JSON", '{"103":{"username":"158925"},"101":{"username":"200223"}}');
  mocks.auth.mockResolvedValue({ id: "ulmeken" });
  mocks.user.mockResolvedValue({ sipExtension: "103", sipUsername: "158925" });
  mocks.api.mockResolvedValue({ status: "success", key: "temporary-widget-key" });
});
afterEach(() => vi.unstubAllEnvs());
it("issues the key for the authenticated user's real SIP account only", async () => {
  const response = await GET(); const html = await response.text();
  expect(response.status).toBe(200);
  expect(mocks.user).toHaveBeenCalledWith({ where: { id: "ulmeken" }, select: { sipExtension: true, sipUsername: true } });
  expect(mocks.api).toHaveBeenCalledWith("/v1/webrtc/get_key/", { sip: "158925" });
  expect(html).toContain('"temporary-widget-key", "158925"');
  expect(html).not.toContain("200223");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
});
it("requires authentication before contacting Zadarma", async () => {
  mocks.auth.mockRejectedValue(Object.assign(new Error("UNAUTHORIZED"), { status: 401 }));
  const response = await GET(); expect(response.status).toBe(401);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(mocks.api).not.toHaveBeenCalled();
});
it("fails closed for an unassigned manager", async () => {
  mocks.user.mockResolvedValue({ sipExtension: "100", sipUsername: null });
  expect((await GET()).status).toBe(503); expect(mocks.api).not.toHaveBeenCalled();
});
it("does not issue keys when the widget mode is disabled", async () => {
  vi.stubEnv("SIP_BROWSER_MODE", "jssip");
  expect((await GET()).status).toBe(503); expect(mocks.api).not.toHaveBeenCalled();
});
it("does not return successful phone HTML on provider failure or missing key", async () => {
  mocks.api.mockRejectedValueOnce(Object.assign(new Error("ZADARMA_API_ERROR"), { status: 502 }));
  expect((await GET()).status).toBe(502);
  mocks.api.mockResolvedValue({ status: "success" });
  expect((await GET()).status).toBe(502);
});
it("escapes provider values so they cannot break out of inline JavaScript", () => {
  const html = zadarmaWidgetDocument('</script><script>alert(1)</script>', '158925');
  expect(html).not.toContain('</script><script>alert(1)');
  expect(html).toContain('\\u003c/script\\u003e');
  expect(html).toContain('/v9/js/loader-phone-lib.js?sub_v=1');
  expect(html).toContain('/v9/js/loader-phone-fn.js?sub_v=1');
});

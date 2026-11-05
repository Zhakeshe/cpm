import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ extension: "101", key: vi.fn(async () => "test-bootstrap-key"), registration: vi.fn(async () => ({ wsUrl: "wss://pbxfr1.zadarma.com:4443", uri: "sip:test-101@pbxfr1.zadarma.com", password: "test-only" })) }));
vi.mock("../src/lib/api", () => ({ requireUser: async () => ({ id: "manager", name: "Test" }), jsonError: (e: Error) => new Response(JSON.stringify({error:e.message}),{status:500}) }));
vi.mock("../src/lib/db", () => ({ prisma: { user: { findUnique: async () => ({ sipExtension: state.extension, sipUsername: "test-101" }) }, integration: { findUnique: async () => ({ config: { extensions: { "101": { username: "test-101", password: "permanent-test-only" } } } }) } } }));
vi.mock("../src/lib/zadarma", () => ({ ZADARMA_DEFAULTS: { wsUrl: "wss://pbx.zadarma.com:8089/ws", domain: "pbx.zadarma.com" }, zadarmaCredentials: () => ({ configured: true }), zadarmaWebrtcKey: state.key }));
vi.mock("../src/lib/zadarma-webrtc", () => ({ zadarmaWebrtcCredentials: state.registration }));
import { GET } from "../src/app/api/sip/credentials/route";
beforeEach(() => { vi.clearAllMocks(); state.extension = "101"; });
it("gives the browser an account bootstrap rather than fetching a password on the VPS", async () => {
  const response = await GET(new Request("https://crm.example/api/sip/credentials?browser=1"));
  const data = await response.json();
  expect(data).toMatchObject({ enabled: true, provider: "zadarma", key: "test-bootstrap-key", sip: "test-101" });
  expect(data.password).toBeUndefined();
  expect(state.registration).not.toHaveBeenCalled();
  expect(state.key).toHaveBeenCalledWith("test-101");
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("does not issue a key to a user without an assigned extension", async () => {
  state.extension = "";
  const response = await GET(new Request("https://crm.example/api/sip/credentials?browser=1"));
  expect(await response.json()).toEqual({ enabled: false, reason: "NO_EXTENSION" });
  expect(state.key).not.toHaveBeenCalled();
});
it("keeps the existing credentials API compatible for older integrations", async () => {
  const response = await GET(new Request("https://crm.example/api/sip/credentials"));
  expect((await response.json()).password).toBe("test-only");
  expect(state.registration).toHaveBeenCalledTimes(1);
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSipAccount, resolveOutboundSipAccount, sipLoginSchema, serverSipAccounts, publicSipSettings } from "../src/lib/sip-config";

afterEach(() => vi.unstubAllEnvs());
describe("explicit SIP accounts", () => {
  it.each(["158925", "200223", "943999", "593615-101"])("accepts real login %s", (login) => {
    expect(sipLoginSchema.safeParse(login).success).toBe(true);
  });
  it("never substitutes the CRM extension when no real account exists", () => {
    expect(() => resolveOutboundSipAccount({ sipExtension: "101", sipUsername: null }, {})).toThrow("SIP_ACCOUNT_NOT_CONFIGURED");
    expect(resolveOutboundSipAccount({ sipExtension: "101", sipUsername: null }, { "101": { username: "158925" } }))
      .toEqual({ sipAccount: "158925", callbackEndpoint: "158925" });
  });
  it("uses a provider PBX routing ID only when explicitly configured", () => {
    expect(resolveOutboundSipAccount({ sipExtension: "101", sipUsername: null }, { "101": { username: "593615-107", pbxExtension: "107" } }))
      .toEqual({ sipAccount: "593615-107", callbackEndpoint: "107" });
  });
  it("rejects stale user/account mismatches and duplicate assignments", () => {
    expect(() => resolveOutboundSipAccount({ sipExtension: "101", sipUsername: "943999" }, { "101": { username: "158925" } })).toThrow();
    vi.stubEnv("SIP_ACCOUNTS_JSON", '{"101":{"username":"158925"},"102":{"username":"158925"}}');
    expect(() => serverSipAccounts()).toThrow("SIP_ACCOUNT_NOT_CONFIGURED");
  });
  it("returns only the current extension's env password, never DB credentials or extension fallback", () => {
    vi.stubEnv("SIP_ACCOUNTS_JSON", '{"101":{"username":"158925","password":"test-only"},"102":{"username":"200223","password":"other"}}');
    expect(resolveSipAccount({}, "101", null)).toEqual({ username: "158925", password: "test-only" });
    expect(resolveSipAccount({}, "103", null)).toBeNull();
    expect(resolveSipAccount({}, "101", "200223")).toBeNull();
    expect(publicSipSettings({ extensions: { "101": { password: "secret" } } })).not.toHaveProperty("extensions");
  });
});

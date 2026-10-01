import { describe, expect, it } from "vitest";
import { resolveSipAccount } from "../src/lib/sip-config";

describe("SIP registration credentials", () => {
  it("uses the complete PBX login while retaining the short routing extension", () => {
    expect(resolveSipAccount({ extensions: {
      "101": { username: "593615-101", password: "test-only" },
    } }, "101", "101")).toEqual({ username: "593615-101", password: "test-only" });
  });

  it("keeps legacy password-only settings compatible with the user's SIP login", () => {
    expect(resolveSipAccount({ extensions: { "101": "test-only" } }, "101", "593615-101"))
      .toEqual({ username: "593615-101", password: "test-only" });
    expect(resolveSipAccount({ extensions: { "101": "test-only" } }, "101"))
      .toEqual({ username: "101", password: "test-only" });
  });

  it("does not register unconfigured extensions", () => {
    expect(resolveSipAccount({}, "101")).toBeNull();
    expect(resolveSipAccount({ extensions: { "101": { username: "593615-101", password: "" } } }, "101"))
      .toBeNull();
  });
});

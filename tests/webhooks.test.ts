import { describe, expect, it } from "vitest";
import { verifyWhatsAppSignature } from "../src/lib/whatsapp";
import { verifySipSecret } from "../src/lib/telephony";

describe("webhook protection", () => {
  it("validates WhatsApp HMAC signatures", () => {
    const crypto = require("crypto") as typeof import("crypto");
    const secret = "app-secret";
    const body = '{"ok":true}';
    const sig = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWhatsAppSignature(body, sig, secret)).toBe(true);
    expect(verifyWhatsAppSignature(body, "sha256=dead", secret)).toBe(false);
  });

  it("validates SIP webhook secret", () => {
    expect(verifySipSecret("secret", "secret")).toBe(true);
    expect(verifySipSecret("nope", "secret")).toBe(false);
  });
});

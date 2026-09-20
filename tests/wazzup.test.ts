import { describe, expect, it } from "vitest";
import { isWazzupPayload } from "../src/lib/wazzup-inbound";
import { allowsFreeform, getWazzupConfig, whatsappTransport } from "../src/lib/whatsapp-transport";
import { signMediaKey, verifyMediaKey } from "../src/lib/signed-media";
import { wazzupChatId } from "../src/lib/wazzup";

describe("wazzup payload", () => {
  it("accepts the official handshake and message batches", () => {
    expect(isWazzupPayload({ test: true })).toBe(true);
    expect(isWazzupPayload({ messages: [{ messageId: "1", chatId: "7701" }] })).toBe(true);
    expect(isWazzupPayload({ statuses: [{ messageId: "1", status: "delivered" }] })).toBe(true);
    expect(isWazzupPayload({ object: "whatsapp_business_account" })).toBe(false);
  });
});

describe("transport prefers Wazzup until Meta is put back", () => {
  it("uses Wazzup when both env pairs exist", async () => {
    const prev = { ...process.env };
    process.env.WAZZUP_API_KEY = "key";
    process.env.WAZZUP_CHANNEL_ID = "11111111-1111-1111-1111-111111111111";
    process.env.WHATSAPP_ACCESS_TOKEN = "meta";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "phone";
    expect(await whatsappTransport()).toBe("wazzup");
    expect(allowsFreeform("wazzup")).toBe(true);
    expect(allowsFreeform("meta")).toBe(false);
    const cfg = await getWazzupConfig();
    expect(cfg.configured).toBe(true);
    for (const key of ["WAZZUP_API_KEY", "WAZZUP_CHANNEL_ID", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"] as const) {
      if (prev[key] == null) delete process.env[key];
      else process.env[key] = prev[key];
    }
  });
});

describe("wazzup helpers", () => {
  it("normalizes chat id and signs media urls", () => {
    expect(wazzupChatId("+7 701 123 45 67")).toBe("77011234567");
    const sig = signMediaKey("whatsapp/out/a.jpg");
    expect(verifyMediaKey("whatsapp/out/a.jpg", sig)).toBe(true);
    expect(verifyMediaKey("whatsapp/out/a.jpg", "nope")).toBe(false);
  });
});

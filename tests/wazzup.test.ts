import { existsSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { isWazzupPayload } from "../src/lib/wazzup-inbound";
import { isMetaWabaParked, META_WABA_PARKED_MODULES, restoreMetaWabaSteps } from "../src/lib/meta-waba-parked";
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

function restoreEnv(prev: NodeJS.ProcessEnv, keys: string[]) {
  for (const key of keys) {
    if (prev[key] == null) delete process.env[key];
    else process.env[key] = prev[key];
  }
}

describe("transport prefers Wazzup until Meta is put back", () => {
  const keys = [
    "WAZZUP_API_KEY",
    "WAZZUP_CHANNEL_ID",
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_TRANSPORT",
  ];

  it("uses Wazzup when both env pairs exist", async () => {
    const prev = { ...process.env };
    process.env.WAZZUP_API_KEY = "key";
    process.env.WAZZUP_CHANNEL_ID = "11111111-1111-1111-1111-111111111111";
    process.env.WHATSAPP_ACCESS_TOKEN = "meta";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "phone";
    delete process.env.WHATSAPP_TRANSPORT;
    expect(await whatsappTransport()).toBe("wazzup");
    expect(isMetaWabaParked("wazzup")).toBe(true);
    expect(allowsFreeform("wazzup")).toBe(true);
    expect(allowsFreeform("meta")).toBe(false);
    const cfg = await getWazzupConfig();
    expect(cfg.configured).toBe(true);
    restoreEnv(prev, keys);
  });

  it("restores Meta Cloud API when WHATSAPP_TRANSPORT=meta", async () => {
    const prev = { ...process.env };
    process.env.WAZZUP_API_KEY = "key";
    process.env.WAZZUP_CHANNEL_ID = "11111111-1111-1111-1111-111111111111";
    process.env.WHATSAPP_ACCESS_TOKEN = "meta";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "phone";
    process.env.WHATSAPP_TRANSPORT = "meta";
    expect(await whatsappTransport()).toBe("meta");
    expect(isMetaWabaParked("meta")).toBe(false);
    expect(restoreMetaWabaSteps()).toContain("WHATSAPP_TRANSPORT=meta");
    restoreEnv(prev, keys);
  });

  it("keeps parked Meta modules on disk", () => {
    for (const file of META_WABA_PARKED_MODULES) {
      expect(existsSync(resolve(__dirname, "..", file))).toBe(true);
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

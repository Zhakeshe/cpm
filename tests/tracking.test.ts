import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRACKING_CHANNELS,
  newTrackToken,
  parseTrackToken,
  publicWhatsAppNumber,
  whatsappClickUrl,
} from "../src/lib/tracking";

describe("tracking tokens", () => {
  it("extracts qc: token from WhatsApp prefill", () => {
    expect(parseTrackToken("Сәлем! Instagram-нан жазып тұрмын qc:ab12cd34")).toBe("ab12cd34");
    expect(parseTrackToken("hello QC:DEADBEEF extra")).toBe("deadbeef");
    expect(parseTrackToken("just a message")).toBeNull();
    expect(parseTrackToken("")).toBeNull();
  });

  it("builds wa.me url with encoded prefill", () => {
    const url = whatsappClickUrl("+7 776 507 91 88", "Сәлем qc:aa11bb22");
    expect(url.startsWith("https://wa.me/77765079188?text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("Сәлем qc:aa11bb22"));
  });

  it("reads public WhatsApp digits from env", () => {
    const prev = process.env.WHATSAPP_PUBLIC_NUMBER;
    process.env.WHATSAPP_PUBLIC_NUMBER = "+7 (776) 507-91-88";
    expect(publicWhatsAppNumber()).toBe("77765079188");
    if (prev == null) delete process.env.WHATSAPP_PUBLIC_NUMBER;
    else process.env.WHATSAPP_PUBLIC_NUMBER = prev;
  });

  it("keeps {token} placeholder on every default channel", () => {
    expect(newTrackToken()).toMatch(/^[a-f0-9]{8}$/);
    for (const ch of DEFAULT_TRACKING_CHANNELS) {
      expect(ch.waPrefill).toContain("{token}");
      expect(ch.greeting.length).toBeGreaterThan(10);
    }
    const slugs = DEFAULT_TRACKING_CHANNELS.map((c) => c.slug);
    expect(slugs).toEqual(["instagram", "tiktok", "facebook", "youtube", "site", "ads"]);
  });
});

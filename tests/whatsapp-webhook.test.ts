import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  extractInboundMessages,
  verifyMetaSignature,
  verifyWhatsAppHub,
  type MetaWhatsAppPayload,
} from "../src/lib/meta-webhook";
import { GET } from "../src/app/api/webhooks/whatsapp/route";

const SAMPLE: MetaWhatsAppPayload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WABA_ID",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "15551633738",
              phone_number_id: "PHONE_NUMBER_ID",
            },
            contacts: [
              {
                profile: { name: "Test User" },
                wa_id: "77000000000",
              },
            ],
            messages: [
              {
                from: "77000000000",
                id: "wamid.TEST123",
                timestamp: "1750000000",
                text: { body: "Сәлем" },
                type: "text",
              },
            ],
          },
          field: "messages",
        },
      ],
    },
  ],
};

describe("Meta WhatsApp GET verification", () => {
  it("returns hub.challenge as plain text when the token matches", async () => {
    process.env.WHATSAPP_VERIFY_TOKEN = "quantum_waba_verify_2026";
    const url =
      "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=quantum_waba_verify_2026&hub.challenge=123456";
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(await res.text()).toBe("123456");
  });

  it("rejects a wrong verify token with 403", async () => {
    process.env.WHATSAPP_VERIFY_TOKEN = "quantum_waba_verify_2026";
    const url =
      "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123456";
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Forbidden");
  });

  it("accepts only subscribe + matching token", () => {
    process.env.WHATSAPP_VERIFY_TOKEN = "quantum_waba_verify_2026";
    expect(
      verifyWhatsAppHub({
        mode: "subscribe",
        token: "quantum_waba_verify_2026",
        challenge: "abc",
      }),
    ).toEqual({ ok: true, challenge: "abc" });
    expect(verifyWhatsAppHub({ mode: "subscribe", token: "nope", challenge: "abc" }).ok).toBe(false);
  });
});

describe("Meta WhatsApp payload parse", () => {
  it("extracts a text message from the Cloud API sample", () => {
    const [msg] = extractInboundMessages(SAMPLE);
    expect(msg).toMatchObject({
      externalMessageId: "wamid.TEST123",
      from: "77000000000",
      waId: "77000000000",
      customerName: "Test User",
      type: "text",
      text: "Сәлем",
      timestamp: "1750000000",
      phoneNumberId: "PHONE_NUMBER_ID",
    });
  });

  it("verifies X-Hub-Signature-256 over the raw body", () => {
    const crypto = require("crypto") as typeof import("crypto");
    const secret = "meta-app-secret";
    const raw = JSON.stringify({ object: "whatsapp_business_account" });
    const header = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
    expect(verifyMetaSignature(raw, header, secret)).toBe(true);
    expect(verifyMetaSignature(JSON.stringify(JSON.parse(raw)), header, secret)).toBe(true);
    expect(verifyMetaSignature(raw, "sha256=00", secret)).toBe(false);
    expect(verifyMetaSignature(raw, header, "")).toBe(false);
  });
});

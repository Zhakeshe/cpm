import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";

vi.mock("../src/lib/outbound", () => ({ sendOutboundMessage: vi.fn() }));
vi.mock("../src/lib/whatsapp-transport", () => ({
  whatsappTransport: vi.fn().mockResolvedValue("wazzup"),
  getWazzupConfig: vi.fn().mockResolvedValue({ channelId: "live-channel" }),
}));
import { sendOutboundMessage } from "../src/lib/outbound";
import { whatsappTransport } from "../src/lib/whatsapp-transport";
import { GREETING_SETTING, isWhatsAppOptOut, maybeSendWhatsAppGreeting } from "../src/lib/whatsapp-greeting";

describe("WhatsApp one-time greeting for every sender", () => {
  let rows: Map<string, unknown>;
  let db: PrismaClient;
  const params = () => ({ contactId: "contact-1", messageId: "in-1", receivedAt: new Date(), text: "Сәлем", provider: "wazzup" as const, channelId: "live-channel" });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(whatsappTransport).mockResolvedValue("wazzup");
    vi.mocked(sendOutboundMessage).mockResolvedValue({ message: { id: "out-1" } } as Awaited<ReturnType<typeof sendOutboundMessage>>);
    rows = new Map([[GREETING_SETTING, { enabled: true, text: "Сәлеметсіз бе!", enabledAt: new Date(Date.now() - 60_000).toISOString() }]]);
    db = {
      systemSetting: {
        findUnique: vi.fn(async ({ where }) => rows.has(where.key) ? { key: where.key, value: rows.get(where.key) } : null),
        create: vi.fn(async ({ data }) => {
          if (rows.has(data.key)) throw Object.assign(new Error(), { code: "P2002" });
          rows.set(data.key, data.value); return data;
        }),
        update: vi.fn(async ({ where, data }) => { rows.set(where.key, data.value); return data; }),
        upsert: vi.fn(async ({ where, create }) => { rows.set(where.key, create.value); return create; }),
      },
      contact: { findUnique: vi.fn().mockResolvedValue({ id: "contact-1", managerId: "mgr-1", archivedAt: null }) },
    } as unknown as PrismaClient;
  });

  it("sends exactly once under concurrent callbacks and preserves the manager's unread state", async () => {
    await Promise.all([maybeSendWhatsAppGreeting(db, params()), maybeSendWhatsAppGreeting(db, params())]);
    expect(sendOutboundMessage).toHaveBeenCalledTimes(1);
    expect(sendOutboundMessage).toHaveBeenCalledWith(db, expect.objectContaining({ senderId: "mgr-1", automatic: true }));
    expect(rows.get("whatsapp:welcome:contact-1")).toMatchObject({ state: "SENT", messageId: "out-1" });
  });

  it("does not greet a previously greeted sender again on a new inbound", async () => {
    rows.set("whatsapp:welcome:contact-1", { state: "SENT", messageId: "prior-greeting" });
    await maybeSendWhatsAppGreeting(db, { ...params(), messageId: "later-inbound" });
    expect(sendOutboundMessage).not.toHaveBeenCalled();
  });

  it("greets an existing archived contact when they write, without changing their CRM state", async () => {
    vi.mocked(db.contact.findUnique).mockResolvedValue({ id: "contact-1", managerId: "mgr-1", archivedAt: new Date() } as never);
    await maybeSendWhatsAppGreeting(db, params());
    expect(sendOutboundMessage).toHaveBeenCalledTimes(1);
  });

  it.each(["Тоқтату", " ТОҚТАТУ! ", "«Тоқтату»", "Стоп", "stop", "Отписаться"])("persists %s even while greetings are disabled", async (text) => {
    rows.set(GREETING_SETTING, { enabled: false });
    await maybeSendWhatsAppGreeting(db, { ...params(), text });
    rows.set(GREETING_SETTING, { enabled: true, text: "Hello", enabledAt: new Date(Date.now() - 60_000).toISOString() });
    await maybeSendWhatsAppGreeting(db, params());
    expect(rows.has("whatsapp:opt-out:contact-1")).toBe(true);
    expect(sendOutboundMessage).not.toHaveBeenCalled();
  });

  it("does not treat discussion about stopping as an opt-out command", () => {
    expect(isWhatsAppOptOut("Тоқтату қалай жұмыс істейді?")).toBe(false);
  });

  it("does not send delayed, pre-activation, future or invalid messages", async () => {
    for (const receivedAt of [new Date(Date.now() - 600_000), new Date(Date.now() + 600_000), new Date("invalid")]) {
      await maybeSendWhatsAppGreeting(db, { ...params(), receivedAt });
    }
    rows.set(GREETING_SETTING, { enabled: true, text: "Hello", enabledAt: new Date(Date.now() + 1000).toISOString() });
    await maybeSendWhatsAppGreeting(db, params());
    expect(sendOutboundMessage).not.toHaveBeenCalled();
  });

  it("does not send when disabled, unconfigured, mock, or from a different channel", async () => {
    rows.set(GREETING_SETTING, { enabled: false });
    await maybeSendWhatsAppGreeting(db, params());
    rows.set(GREETING_SETTING, { enabled: true, text: "Hello", enabledAt: new Date(Date.now() - 60_000).toISOString() });
    vi.mocked(whatsappTransport).mockResolvedValue("mock");
    await maybeSendWhatsAppGreeting(db, params());
    vi.mocked(whatsappTransport).mockResolvedValue("wazzup");
    await maybeSendWhatsAppGreeting(db, { ...params(), channelId: "other-channel" });
    await maybeSendWhatsAppGreeting(db, { ...params(), channelId: undefined });
    expect(sendOutboundMessage).not.toHaveBeenCalled();
  });

  it("keeps an uncertain send claimed instead of retrying", async () => {
    vi.mocked(sendOutboundMessage).mockRejectedValue(new Error("Timeout after provider accepted"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await maybeSendWhatsAppGreeting(db, params());
    await maybeSendWhatsAppGreeting(db, params());
    expect(sendOutboundMessage).toHaveBeenCalledTimes(1);
    expect(rows.get("whatsapp:welcome:contact-1")).toMatchObject({ state: "UNCERTAIN" });
    log.mockRestore();
  });
});

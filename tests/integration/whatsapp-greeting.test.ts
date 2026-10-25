import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, resetDatabase, seedBaseline, whatsappPayload } from "./helpers";
import { handleWazzupInbound } from "../../src/lib/wazzup-inbound";
import { handleWhatsAppInbound } from "../../src/lib/whatsapp";
import { DEFAULT_WHATSAPP_GREETING, GREETING_SETTING, maybeSendWhatsAppGreeting } from "../../src/lib/whatsapp-greeting";

const request = vi.fn();
const incoming = (id: string, text = "Сәлем", extra = {}) => ({ messages: [{
  messageId: id, channelId: "test-channel", chatId: "77015550001", chatType: "whatsapp",
  status: "inbound", text, dateTime: new Date().toISOString(), ...extra,
}] });

describe("live greeting workflow with a simulated provider", () => {
  beforeEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    await resetDatabase();
    // Only test-owned keys; the suite runs in an isolated database.
    await prisma.systemSetting.deleteMany({ where: { key: { startsWith: "whatsapp:" } } });
    await seedBaseline(2);
    vi.stubEnv("WHATSAPP_TRANSPORT", "wazzup");
    vi.stubEnv("WAZZUP_API_KEY", "test-not-a-real-key");
    vi.stubEnv("WAZZUP_CHANNEL_ID", "test-channel");
    request.mockReset();
    request.mockImplementation(async (url: string | URL | Request) => {
      if (String(url) !== "https://api.wazzup24.com/v3/message") throw new Error("Unexpected external request");
      return new Response(JSON.stringify({ messageId: `provider-out-${request.mock.calls.length}` }), { status: 200 });
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(request);
    await prisma.systemSetting.create({ data: { key: GREETING_SETTING, value: {
      enabled: true, text: DEFAULT_WHATSAPP_GREETING, enabledAt: new Date(Date.now() - 60_000).toISOString(),
    } } });
  });
  afterAll(async () => {
    vi.restoreAllMocks(); vi.unstubAllEnvs();
    await prisma.systemSetting.deleteMany({ where: { key: { startsWith: "whatsapp:" } } });
    await prisma.$disconnect();
  });

  it("greets a new organic sender once, persists the reply and keeps both inbound messages unread", async () => {
    const payload = incoming("wz.first");
    await handleWazzupInbound(prisma, payload);
    await handleWazzupInbound(prisma, payload);
    await handleWazzupInbound(prisma, incoming("wz.second", "+"));
    expect(request).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(request.mock.calls[0][1].body);
    expect(sent).toMatchObject({ channelId: "test-channel", chatId: "77015550001", text: DEFAULT_WHATSAPP_GREETING });
    const reply = await prisma.message.findFirstOrThrow({ where: { direction: "OUTBOUND" } });
    expect(reply.rawPayload).toEqual({ automation: "whatsapp-welcome" });
    expect((await prisma.conversation.findFirstOrThrow()).unreadCount).toBe(2);
    expect(await prisma.lead.count()).toBe(1);
    expect(await prisma.notification.count()).toBe(2);
  });

  it("sends once under concurrent processing of the same first inbound", async () => {
    // Create the first inbound with greeting disabled, then model two workers reaching the send.
    await prisma.systemSetting.update({ where: { key: GREETING_SETTING }, data: { value: { enabled: false } } });
    await handleWazzupInbound(prisma, incoming("wz.race"));
    const first = await prisma.message.findUniqueOrThrow({ where: { externalMessageId: "wz.race" } });
    await prisma.systemSetting.update({ where: { key: GREETING_SETTING }, data: { value: {
      enabled: true, text: DEFAULT_WHATSAPP_GREETING, enabledAt: new Date(Date.now() - 60_000).toISOString(),
    } } });
    const args = { contactId: first.contactId, messageId: first.id, receivedAt: first.sentAt, text: first.text, provider: "wazzup" as const, channelId: "test-channel" };
    await Promise.all([maybeSendWhatsAppGreeting(prisma, args), maybeSendWhatsAppGreeting(prisma, args)]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(await prisma.message.count({ where: { direction: "OUTBOUND" } })).toBe(1);
  });

  it("persists opt-out, then sends nothing on the next inbound", async () => {
    await handleWazzupInbound(prisma, incoming("wz.stop", "ТОҚТАТУ!"));
    await handleWazzupInbound(prisma, incoming("wz.after-stop", "+"));
    expect(request).not.toHaveBeenCalled();
    expect(await prisma.systemSetting.count({ where: { key: { startsWith: "whatsapp:opt-out:" } } })).toBe(1);
  });

  it("does not greet an old dialog after enabling, an echo, or an old webhook", async () => {
    await prisma.systemSetting.update({ where: { key: GREETING_SETTING }, data: { value: { enabled: false } } });
    await handleWazzupInbound(prisma, incoming("wz.old-dialog"));
    await prisma.systemSetting.update({ where: { key: GREETING_SETTING }, data: { value: {
      enabled: true, text: DEFAULT_WHATSAPP_GREETING, enabledAt: new Date(Date.now() - 60_000).toISOString(),
    } } });
    await handleWazzupInbound(prisma, incoming("wz.after-enable"));
    await handleWazzupInbound(prisma, incoming("wz.echo", "Hi", { chatId: "77015550002", status: "sent", isEcho: true }));
    await handleWazzupInbound(prisma, incoming("wz.delayed", "Hi", { chatId: "77015550003", dateTime: new Date(Date.now() - 3_600_000).toISOString() }));
    expect(request).not.toHaveBeenCalled();
  });

  it("keeps provider failure claimed, without breaking inbound notifications or retrying", async () => {
    request.mockRejectedValue(new Error("Network timeout"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await handleWazzupInbound(prisma, incoming("wz.fail"));
    await handleWazzupInbound(prisma, incoming("wz.retry"));
    expect(request).toHaveBeenCalledTimes(1);
    expect(await prisma.notification.count()).toBe(2);
    const claim = await prisma.systemSetting.findFirstOrThrow({ where: { key: { startsWith: "whatsapp:welcome:" } } });
    expect(claim.value).toMatchObject({ state: "UNCERTAIN" });
    log.mockRestore();
  });

  it("also greets a Meta inbound within its real service window", async () => {
    vi.stubEnv("WHATSAPP_TRANSPORT", "meta");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "test-not-a-real-key");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "test-phone");
    request.mockImplementation(async (url: string | URL | Request) => {
      if (!String(url).startsWith("https://graph.facebook.com/")) throw new Error("Unexpected external request");
      return new Response(JSON.stringify({ messages: [{ id: "meta-out-1" }] }), { status: 200 });
    });
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "meta-in-1", from: "77015550004", text: "Сәлем" }));
    expect(request).toHaveBeenCalledTimes(1);
    expect(await prisma.message.count({ where: { direction: "OUTBOUND" } })).toBe(1);
    expect((await prisma.conversation.findFirstOrThrow()).unreadCount).toBe(1);
  });
});

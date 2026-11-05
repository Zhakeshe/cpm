import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, resetDatabase, seedBaseline, whatsappPayload } from "./helpers";
import { ingestContact } from "../../src/lib/contacts";
import { handleWazzupInbound } from "../../src/lib/wazzup-inbound";
import { handleWhatsAppInbound } from "../../src/lib/whatsapp";
import { sendOutboundMessage } from "../../src/lib/outbound";
import { CUSTOMER_CONVERSATION_ORDER, LEAD_ACTIVITY_ORDER } from "../../src/lib/customer-inbound";

const message = (id: string, phone: string, inbound = true, at = new Date()) => ({ messages: [{
  messageId: id, chatId: phone, chatType: "whatsapp", channelId: "channel", text: "Тест",
  status: inbound ? "inbound" : "sent", isEcho: !inbound, dateTime: at.toISOString(),
}] });

describe("only customer replies move incoming queues", () => {
  beforeEach(async () => {
    vi.restoreAllMocks(); vi.unstubAllEnvs();
    await resetDatabase(); await seedBaseline(2);
    await prisma.systemSetting.deleteMany({ where: { key: { startsWith: "whatsapp:" } } });
    vi.stubEnv("WHATSAPP_TRANSPORT", "wazzup");
    vi.stubEnv("WAZZUP_API_KEY", "test-key");
    vi.stubEnv("WAZZUP_CHANNEL_ID", "channel");
  });
  afterAll(async () => {
    vi.restoreAllMocks(); vi.unstubAllEnvs(); await prisma.$disconnect();
  });

  it("does not create a contact or a lead for an outgoing message to an unknown number", async () => {
    const result = await handleWazzupInbound(prisma, message("unknown-echo", "77015550001", false));
    expect(result).toMatchObject([{ type: "ignored_unknown_outbound" }]);
    expect(await prisma.contact.count()).toBe(0);
    expect(await prisma.lead.count()).toBe(0);
    expect(await prisma.notification.count()).toBe(0);
    await handleWazzupInbound(prisma, message("first-customer-reply", "77015550001"));
    expect(await prisma.contact.count()).toBe(1);
    expect(await prisma.lead.count()).toBe(1);
    expect(await prisma.notification.count()).toBe(1);
  });

  it("keeps an outgoing-only contact below customer replies, then promotes its inbound without duplication", async () => {
    const oldAt = new Date(Date.now() - 3_600_000);
    await handleWazzupInbound(prisma, message("customer-a", "77015550001", true, oldAt));
    const second = await ingestContact(prisma, { phone: "77015550002", source: "MANUAL" });
    await prisma.contact.update({ where: { id: second.contactId }, data: { leadActivityAt: new Date(Date.now() - 7_200_000) } });
    const before = await prisma.contact.findUniqueOrThrow({ where: { id: second.contactId } });
    await handleWazzupInbound(prisma, message("echo-b", "77015550002", false));
    const afterEcho = await prisma.contact.findUniqueOrThrow({ where: { id: second.contactId } });
    expect(afterEcho.leadActivityAt).toEqual(before.leadActivityAt);
    expect(afterEcho.lastContactAt).toEqual(before.lastContactAt);
    expect(afterEcho.managerId).toBe(before.managerId);
    const chats = await prisma.conversation.findMany({ orderBy: [...CUSTOMER_CONVERSATION_ORDER] });
    expect(chats[0].contactId).not.toBe(second.contactId);
    expect(chats[1].lastCustomerMessageAt).toBeNull();
    await handleWazzupInbound(prisma, message("reply-b", "77015550002"));
    expect((await prisma.contact.findFirstOrThrow({ orderBy: [...LEAD_ACTIVITY_ORDER] })).id).toBe(second.contactId);
    expect((await prisma.conversation.findFirstOrThrow({ orderBy: [...CUSTOMER_CONVERSATION_ORDER] })).contactId).toBe(second.contactId);
    expect(await prisma.contact.count()).toBe(2);
    expect(await prisma.lead.count()).toBe(2);
    expect((await prisma.contact.findUniqueOrThrow({ where: { id: second.contactId } })).pipelineStageId).toBe(before.pipelineStageId);
  });

  it("a normal CRM send and its provider echo do not bump the lead queue or the inbound timestamp", async () => {
    const first = await ingestContact(prisma, { phone: "77015550003", source: "MANUAL" });
    const before = await prisma.contact.findUniqueOrThrow({ where: { id: first.contactId } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ messageId: "crm-out" }), { status: 201 }));
    await sendOutboundMessage(prisma, { contactId: first.contactId, senderId: first.managerId, text: "KASPI ЖҰМА" });
    await handleWazzupInbound(prisma, message("crm-out", "77015550003", false));
    const after = await prisma.contact.findUniqueOrThrow({ where: { id: first.contactId } });
    expect(after.leadActivityAt).toEqual(before.leadActivityAt);
    expect((await prisma.conversation.findFirstOrThrow()).lastCustomerMessageAt).toBeNull();
    expect(await prisma.lead.count()).toBe(1);
  });

  it("does not reassign an inactive owner merely because an outgoing echo arrives", async () => {
    const first = await ingestContact(prisma, { phone: "77015550004", source: "MANUAL" });
    await prisma.user.update({ where: { id: first.managerId! }, data: { isActive: false } });
    await handleWazzupInbound(prisma, message("inactive-owner-echo", "77015550004", false));
    expect((await prisma.contact.findUniqueOrThrow({ where: { id: first.contactId } })).managerId).toBe(first.managerId);
    expect(await prisma.notification.count()).toBe(0);
  });

  it("late webhooks cannot move customer priority backwards; Meta inbound also promotes it", async () => {
    await handleWazzupInbound(prisma, message("newer", "77015550005"));
    const before = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77015550005" } });
    const conversation = await prisma.conversation.findFirstOrThrow();
    await handleWazzupInbound(prisma, message("older", "77015550005", true, new Date(Date.now() - 86_400_000)));
    expect((await prisma.contact.findUniqueOrThrow({ where: { id: before.id } })).leadActivityAt).toEqual(before.leadActivityAt);
    expect((await prisma.conversation.findFirstOrThrow()).lastCustomerMessageAt).toEqual(conversation.lastCustomerMessageAt);
    await prisma.contact.update({ where: { id: before.id }, data: { leadActivityAt: new Date(Date.now() - 86_400_000) } });
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "meta-reply", from: "77015550005", text: "+" }));
    expect((await prisma.contact.findUniqueOrThrow({ where: { id: before.id } })).leadActivityAt.getTime()).toBeGreaterThan(Date.now() - 60_000);
    expect(await prisma.lead.count()).toBe(1);
  });
});

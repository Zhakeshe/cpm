import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, resetDatabase, seedBaseline } from "./helpers";
import { ingestContact } from "../../src/lib/contacts";
import { getBroadcastStatus, prepareBroadcast, sendNextBroadcastRecipient, startBroadcast } from "../../src/lib/whatsapp-broadcast";
import { handleWazzupInbound } from "../../src/lib/wazzup-inbound";

const id = "test-kaspi-campaign";
let postCount = 0;
let onPost: ((body: { chatId: string; crmMessageId?: string; clearUnanswered?: boolean }) => Promise<Response>) | undefined;
const prepare = () => prepareBroadcast(prisma, { id, text: "KASPI ЖҰМА 24 айға бөліп төлеу!", actorId: "admin-1" });
const add = (phone: string) => ingestContact(prisma, { phone, source: "MANUAL" });

describe("one-time WhatsApp broadcast", () => {
  beforeEach(async () => {
    vi.restoreAllMocks(); vi.unstubAllEnvs();
    await resetDatabase(); await seedBaseline(2);
    await prisma.systemSetting.deleteMany({ where: { OR: [{ key: { startsWith: "broadcast:" } }, { key: { startsWith: "whatsapp:" } }] } });
    vi.stubEnv("WHATSAPP_TRANSPORT", "wazzup"); vi.stubEnv("WAZZUP_API_KEY", "fake-key"); vi.stubEnv("WAZZUP_CHANNEL_ID", "test-channel");
    postCount = 0; onPost = undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (String(url) === "https://api.wazzup24.com/v3/channels") return new Response(JSON.stringify([{ channelId: "test-channel", plainId: "77474953016", state: "active", transport: "whatsapp" }]));
      if (String(url) !== "https://api.wazzup24.com/v3/message" || init?.method !== "POST") throw Error("Unexpected request");
      postCount++;
      const body = JSON.parse(String(init.body));
      expect(body.clearUnanswered).toBe(false); expect(body.crmMessageId).toContain(id);
      return onPost ? onPost(body) : new Response(JSON.stringify({ messageId: `broadcast-out-${postCount}` }), { status: 201 });
    });
  });
  afterAll(async () => {
    vi.restoreAllMocks(); vi.unstubAllEnvs();
    await prisma.systemSetting.deleteMany({ where: { OR: [{ key: { startsWith: "broadcast:" } }, { key: { startsWith: "whatsapp:" } }] } });
    await prisma.$disconnect();
  });

  it("snapshots eligible destinations once, excluding opt-outs, archived, invalid, self and duplicates", async () => {
    const first = await add("77015550001");
    const duplicate = await add("77015550002");
    await prisma.contact.update({ where: { id: duplicate.contactId }, data: { whatsappNumber: "77015550001" } });
    const archived = await add("77015550003");
    await prisma.contact.update({ where: { id: archived.contactId }, data: { archivedAt: new Date() } });
    const stopped = await add("77015550004");
    await prisma.systemSetting.create({ data: { key: `whatsapp:opt-out:${stopped.contactId}`, value: { at: new Date().toISOString() } } });
    await add("77474953016");
    await prisma.contact.create({ data: { firstName: "Invalid", phoneNormalized: "bad", phoneDisplay: "bad", source: "MANUAL" } });
    const result = await prepare();
    expect(result.campaign.audience).toBe(1);
    expect(result.campaign.exclusions).toEqual({ archived: 1, invalid: 1, optedOut: 1, self: 1, duplicate: 1 });
    await prepare();
    expect((await getBroadcastStatus(prisma, id)).counts.QUEUED).toBe(1);
    expect(postCount).toBe(0);
    expect(await prisma.contact.count({ where: { id: first.contactId } })).toBe(1);
  });

  it("sends once, preserves incoming queue, owner, stage and unread count, and never reruns a completed campaign", async () => {
    const contact = await add("77015550005");
    const before = await prisma.contact.findUniqueOrThrow({ where: { id: contact.contactId } });
    const customerAt = new Date(Date.now() - 60_000);
    await prisma.conversation.create({ data: { contactId: contact.contactId, managerId: contact.managerId, unreadCount: 3, lastCustomerMessageAt: customerAt } });
    await prepare(); await startBroadcast(prisma, id);
    await Promise.all([sendNextBroadcastRecipient(prisma, id), sendNextBroadcastRecipient(prisma, id)]);
    await sendNextBroadcastRecipient(prisma, id);
    const after = await prisma.contact.findUniqueOrThrow({ where: { id: contact.contactId } });
    expect(after).toEqual(before);
    expect((await prisma.conversation.findFirstOrThrow()).unreadCount).toBe(3);
    expect((await prisma.conversation.findFirstOrThrow()).lastCustomerMessageAt).toEqual(customerAt);
    expect(await prisma.lead.count()).toBe(1);
    expect(await prisma.message.count({ where: { direction: "OUTBOUND" } })).toBe(1);
    expect((await getBroadcastStatus(prisma, id)).campaign.state).toBe("COMPLETED");
    await prepare(); await startBroadcast(prisma, id); await sendNextBroadcastRecipient(prisma, id);
    expect(postCount).toBe(1);
  });

  it("uses the same stored message when the provider echo arrives before its POST response", async () => {
    await add("77015550006");
    onPost = async body => {
      await handleWazzupInbound(prisma, { messages: [{ messageId: "echo-before-ack", chatId: body.chatId, chatType: "whatsapp", status: "sent", isEcho: true, text: "Campaign" }] });
      return new Response(JSON.stringify({ messageId: "echo-before-ack" }), { status: 201 });
    };
    await prepare(); await startBroadcast(prisma, id); await sendNextBroadcastRecipient(prisma, id);
    expect(await prisma.message.count()).toBe(1);
    expect((await prisma.message.findFirstOrThrow()).rawPayload).toMatchObject({ automation: "whatsapp-broadcast", campaignId: id });
    expect((await getBroadcastStatus(prisma, id)).counts.SENT).toBe(1);
    expect(await prisma.lead.count()).toBe(1);
    const receipt = (status: string) => handleWazzupInbound(prisma, { messages: [{ messageId: "echo-before-ack", chatId: "77015550006", chatType: "whatsapp", isEcho: true, status }] });
    await receipt("delivered"); await receipt("sent");
    expect((await getBroadcastStatus(prisma, id)).delivery.DELIVERED).toBe(1);
    await receipt("read"); await receipt("delivered");
    expect((await getBroadcastStatus(prisma, id)).delivery.READ).toBe(1);
    expect(await prisma.message.count()).toBe(1);
    expect(await prisma.lead.count()).toBe(1);
    expect((await prisma.message.findFirstOrThrow()).readAt).not.toBeNull();
  });

  it("rechecks opt-out and changed destination immediately before sending", async () => {
    const contact = await add("77015550007"); await prepare();
    await prisma.systemSetting.create({ data: { key: `whatsapp:opt-out:${contact.contactId}`, value: {} } });
    await startBroadcast(prisma, id); await sendNextBroadcastRecipient(prisma, id);
    expect((await getBroadcastStatus(prisma, id)).counts.SKIPPED).toBe(1);
    expect(postCount).toBe(0);
  });

  it("keeps READ when delivery and read receipts are processed concurrently", async () => {
    await add("77015550011"); await prepare(); await startBroadcast(prisma, id); await sendNextBroadcastRecipient(prisma, id);
    await Promise.all([
      handleWazzupInbound(prisma, { statuses: [{ messageId: "broadcast-out-1", status: "read" }] }),
      handleWazzupInbound(prisma, { messages: [{ messageId: "broadcast-out-1", chatId: "77015550011", isEcho: true, status: "delivered" }] }),
    ]);
    await handleWazzupInbound(prisma, { statuses: [{ messageId: "broadcast-out-1", status: "sent" }] });
    expect((await getBroadcastStatus(prisma, id)).delivery.READ).toBe(1);
    expect(await prisma.lead.count()).toBe(1);
  });

  it("pauses on unknown provider failure without retrying or marking it sent", async () => {
    await add("77015550008"); await prepare(); await startBroadcast(prisma, id);
    onPost = async () => new Response(JSON.stringify({ error: "POST_MESSAGE_ERROR", requestId: "fake-trace", data: [{ code: "UNKNOWN_ERROR" }] }), { status: 400 });
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await sendNextBroadcastRecipient(prisma, id); await sendNextBroadcastRecipient(prisma, id);
    const status = await getBroadcastStatus(prisma, id);
    expect(status.campaign.state).toBe("PAUSED"); expect(status.counts.UNCERTAIN).toBe(1); expect(postCount).toBe(1);
    expect(await prisma.message.count()).toBe(0);
    await expect(startBroadcast(prisma, id)).rejects.toThrow("BROADCAST_REVIEW_REQUIRED");
    log.mockRestore();
  });

  it("skips an unregistered number and continues the rest of the campaign", async () => {
    await add("77015550009"); await add("77015550010"); await prepare(); await startBroadcast(prisma, id);
    onPost = async () => postCount === 1
      ? new Response(JSON.stringify({ error: "POST_MESSAGE_ERROR", data: [{ code: "BAD_CONTACT" }] }), { status: 400 })
      : new Response(JSON.stringify({ messageId: "good-contact-out" }), { status: 201 });
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await sendNextBroadcastRecipient(prisma, id); await sendNextBroadcastRecipient(prisma, id); await sendNextBroadcastRecipient(prisma, id);
    const status = await getBroadcastStatus(prisma, id);
    expect(status.campaign.state).toBe("COMPLETED"); expect(status.counts.FAILED).toBe(1); expect(status.counts.SENT).toBe(1);
    log.mockRestore();
  });

  it("records Inbox-plan first-message rejection and continues without bypassing it", async () => {
    await add("77015550012"); await add("77015550013"); await prepare(); await startBroadcast(prisma, id);
    onPost = async () => postCount === 1
      ? new Response(JSON.stringify({ error: "POST_MESSAGE_ERROR", data: [{ code: "MESSAGES_NOT_TEXT_FIRST" }] }), { status: 400 })
      : new Response(JSON.stringify({ messageId: "existing-chat-out" }), { status: 201 });
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await sendNextBroadcastRecipient(prisma, id); await sendNextBroadcastRecipient(prisma, id); await sendNextBroadcastRecipient(prisma, id);
    const status = await getBroadcastStatus(prisma, id);
    expect(status.campaign.state).toBe("COMPLETED"); expect(status.counts.FAILED).toBe(1); expect(status.counts.SENT).toBe(1);
    expect(status.failureReasons.MESSAGES_NOT_TEXT_FIRST).toBe(1); expect(postCount).toBe(2);
    log.mockRestore();
  });
});

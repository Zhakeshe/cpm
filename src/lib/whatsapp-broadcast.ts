import { createHash } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { sendOutboundMessage } from "./outbound";
import { getWazzupConfig, whatsappTransport } from "./whatsapp-transport";
import { listWazzupChannels, WazzupApiError, wazzupChatId } from "./wazzup";

type Campaign = {
  id: string; text: string; textHash: string; channelId: string; actorId: string;
  state: "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED";
  createdAt: string; startedAt?: string; finishedAt?: string; reason?: string;
  audience: number; exclusions: { archived: number; invalid: number; optedOut: number; self: number; duplicate: number };
};
type Recipient = { contactId: string; to: string; state: "QUEUED" | "SENDING" | "SENT" | "SKIPPED" | "FAILED" | "UNCERTAIN"; at?: string; reason?: string; messageId?: string };
const campaignKey = (id: string) => `broadcast:campaign:${id}`;
const recipientPrefix = (id: string) => `broadcast:recipient:${id}:`;
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function getBroadcastStatus(db: PrismaClient, id: string) {
  const row = await db.systemSetting.findUniqueOrThrow({ where: { key: campaignKey(id) } });
  const campaign = row.value as unknown as Campaign;
  const recipients = await db.systemSetting.findMany({ where: { key: { startsWith: recipientPrefix(id) } }, select: { value: true } });
  const counts: Record<string, number> = {};
  for (const row of recipients) { const state = (row.value as unknown as Recipient).state; counts[state] = (counts[state] || 0) + 1; }
  const messages = await db.message.groupBy({
    by: ["status"], where: { direction: "OUTBOUND", rawPayload: { path: ["campaignId"], equals: id } }, _count: true,
  });
  return { campaign, counts, delivery: Object.fromEntries(messages.map(row => [row.status, row._count])) };
}

export async function prepareBroadcast(db: PrismaClient, params: { id: string; text: string; actorId: string }) {
  if (!/^[a-z0-9-]{1,50}$/.test(params.id) || !params.text.trim() || params.text.length > 4000) throw new Error("INVALID_BROADCAST");
  const textHash = hash(params.text);
  const previous = await db.systemSetting.findUnique({ where: { key: campaignKey(params.id) } });
  if (previous) {
    if ((previous.value as unknown as Campaign).textHash !== textHash) throw new Error("BROADCAST_TEXT_CONFLICT");
    return getBroadcastStatus(db, params.id);
  }
  if (await whatsappTransport(db) !== "wazzup") throw new Error("LIVE_WAZZUP_REQUIRED");
  const config = await getWazzupConfig(db);
  const channel = (await listWazzupChannels(db)).find(row => row.channelId === config.channelId);
  if (channel?.state !== "active" || channel.transport !== "whatsapp") throw new Error("BROADCAST_CHANNEL_NOT_READY");
  const rows = await db.contact.findMany({ orderBy: { id: "asc" }, select: { id: true, phoneNormalized: true, whatsappNumber: true, archivedAt: true } });
  const optOuts = await db.systemSetting.findMany({ where: { key: { startsWith: "whatsapp:opt-out:" } }, select: { key: true } });
  const optedIds = new Set(optOuts.map(row => row.key.slice("whatsapp:opt-out:".length)));
  const phone = (row: typeof rows[number]) => wazzupChatId(row.whatsappNumber || row.phoneNormalized);
  const optedPhones = new Set(rows.filter(row => optedIds.has(row.id)).map(phone));
  const own = wazzupChatId(channel.plainId || "");
  const seen = new Set<string>();
  const exclusions = { archived: 0, invalid: 0, optedOut: 0, self: 0, duplicate: 0 };
  const targets: Array<{ key: string; value: Prisma.InputJsonValue }> = [];
  for (const row of rows) {
    const to = phone(row);
    if (row.archivedAt) { exclusions.archived++; continue; }
    if (optedIds.has(row.id) || optedPhones.has(to)) { exclusions.optedOut++; continue; }
    if (!/^[1-9]\d{6,14}$/.test(to)) { exclusions.invalid++; continue; }
    if (to === own) { exclusions.self++; continue; }
    if (seen.has(to)) { exclusions.duplicate++; continue; }
    seen.add(to);
    targets.push({ key: recipientPrefix(params.id) + hash(to), value: json({ contactId: row.id, to, state: "QUEUED" } satisfies Recipient) });
  }
  if (!targets.length) throw new Error("NO_BROADCAST_RECIPIENTS");
  const campaign: Campaign = { ...params, textHash, channelId: config.channelId, state: "DRAFT", createdAt: new Date().toISOString(), audience: targets.length, exclusions };
  await db.$transaction(async tx => {
    await tx.systemSetting.create({ data: { key: campaignKey(params.id), value: json(campaign) } });
    await tx.systemSetting.createMany({ data: targets });
    await tx.auditLog.create({ data: { actorId: params.actorId, action: "whatsapp.broadcast.prepare", entityType: "SystemSetting", entityId: campaignKey(params.id), newValue: json({ textHash, audience: targets.length, exclusions }) } });
  }, { timeout: 30_000 });
  return getBroadcastStatus(db, params.id);
}

export async function startBroadcast(db: PrismaClient, id: string) {
  const { campaign } = await getBroadcastStatus(db, id);
  if (campaign.state === "RUNNING" || campaign.state === "COMPLETED") return;
  if (campaign.state !== "DRAFT") throw new Error("BROADCAST_REVIEW_REQUIRED");
  const started = { ...campaign, state: "RUNNING", startedAt: new Date().toISOString() };
  await db.$transaction(async tx => {
    const changed = await tx.systemSetting.updateMany({ where: { key: campaignKey(id), value: { equals: json(campaign) } }, data: { value: json(started) } });
    if (changed.count !== 1) throw new Error("BROADCAST_STATE_CHANGED");
    await tx.auditLog.create({ data: { actorId: campaign.actorId, action: "whatsapp.broadcast.start", entityType: "SystemSetting", entityId: campaignKey(id), newValue: json({ audience: campaign.audience, textHash: campaign.textHash }) } });
  });
}

export async function pauseBroadcast(db: PrismaClient, id: string, reason: string) {
  const row = await db.systemSetting.findUniqueOrThrow({ where: { key: campaignKey(id) } });
  const campaign = row.value as unknown as Campaign;
  if (campaign.state !== "RUNNING") return;
  await db.systemSetting.updateMany({ where: { key: row.key, value: { equals: row.value! } }, data: { value: json({ ...campaign, state: "PAUSED", reason }) } });
}

/** One durable attempt per destination. A network timeout or interruption pauses the campaign. */
export async function sendNextBroadcastRecipient(db: PrismaClient, id: string) {
  const campaignRow = await db.systemSetting.findUniqueOrThrow({ where: { key: campaignKey(id) } });
  const campaign = campaignRow.value as unknown as Campaign;
  if (campaign.state !== "RUNNING") return false;
  const inFlight = await db.systemSetting.findFirst({ where: { key: { startsWith: recipientPrefix(id) }, value: { path: ["state"], equals: "SENDING" } } });
  if (inFlight) {
    const recipient = inFlight.value as unknown as Recipient;
    if (!recipient.at || Date.parse(recipient.at) < Date.now() - 60_000) await pauseBroadcast(db, id, "INTERRUPTED_SEND_REQUIRES_REVIEW");
    return false;
  }
  const row = await db.systemSetting.findFirst({ where: { key: { startsWith: recipientPrefix(id) }, value: { path: ["state"], equals: "QUEUED" } }, orderBy: { key: "asc" } });
  if (!row) {
    if (await db.systemSetting.count({ where: { key: { startsWith: recipientPrefix(id) }, value: { path: ["state"], equals: "SENDING" } } })) return false;
    await db.systemSetting.updateMany({ where: { key: campaignRow.key, value: { equals: campaignRow.value! } }, data: { value: json({ ...campaign, state: "COMPLETED", finishedAt: new Date().toISOString() }) } });
    return false;
  }
  const recipient = row.value as unknown as Recipient;
  const claimed = await db.systemSetting.updateMany({ where: { key: row.key, value: { equals: row.value! } }, data: { value: json({ ...recipient, state: "SENDING", at: new Date().toISOString() }) } });
  if (claimed.count !== 1) return false;
  const update = (data: object) => db.systemSetting.update({ where: { key: row.key }, data: { value: json({ ...recipient, at: new Date().toISOString(), ...data }) } });
  try {
    const optOuts = await db.systemSetting.findMany({ where: { key: { startsWith: "whatsapp:opt-out:" } }, select: { key: true } });
    const optedIds = optOuts.map(row => row.key.slice("whatsapp:opt-out:".length));
    const optedContacts = optedIds.length ? await db.contact.findMany({ where: { id: { in: optedIds } }, select: { phoneNormalized: true, whatsappNumber: true } }) : [];
    if (optedIds.includes(recipient.contactId) || optedContacts.some(row => wazzupChatId(row.whatsappNumber || row.phoneNormalized) === recipient.to)) {
      await update({ state: "SKIPPED", reason: "OPTED_OUT" }); return true;
    }
    const current = await db.systemSetting.findUniqueOrThrow({ where: { key: campaignKey(id) } });
    if ((current.value as unknown as Campaign).state !== "RUNNING") { await update({ state: "SKIPPED", reason: "CAMPAIGN_STOPPED" }); return false; }
    const result = await sendOutboundMessage(db, {
      contactId: recipient.contactId, senderId: campaign.actorId, text: campaign.text,
      campaign: { id, recipient: recipient.to, channelId: campaign.channelId },
    });
    await update({ state: "SENT", messageId: result.message.id });
  } catch (err) {
    const code = (err as Error).message;
    if (["NOT_FOUND", "BROADCAST_RECIPIENT_CHANGED", "WHATSAPP_OPTED_OUT"].includes(code)) {
      await update({ state: "SKIPPED", reason: code }); return true;
    }
    const details = err instanceof WazzupApiError ? json(err.details) as object : {};
    if (err instanceof WazzupApiError && err.details.providerErrors?.includes("BAD_CONTACT")) {
      await update({ state: "FAILED", reason: "BAD_CONTACT", ...details }); return true;
    }
    await update({ state: "UNCERTAIN", reason: /^[A-Z_]{1,80}$/.test(code) ? code : "SEND_FAILED", ...details });
    await pauseBroadcast(db, id, "SEND_FAILED_REQUIRES_REVIEW");
  }
  return true;
}

import crypto from "crypto";
import type { PrismaClient, Prisma } from "@prisma/client";
import { ingestContact } from "./contacts";
import { notifyUser as persistNotification } from "./notifications";
import { emitToUser as publishToUser, emitToAdmins as publishToAdmins } from "./realtime";
import { normalizePhone } from "./phone";
import { zadarmaCallback } from "./zadarma";
import { serverSipAccounts } from "./sip-config";

export type TelephonyWebhook = {
  event: "call.started" | "call.answered" | "call.ended" | "call.recording";
  callId: string;
  direction?: "INBOUND" | "OUTBOUND";
  from: string;
  to: string;
  corporateNumber?: string;
  managerExtension?: string;
  providerInternal?: string;
  status?: "RINGING" | "ANSWERED" | "MISSED" | "BUSY" | "FAILED" | "NO_ANSWER";
  startedAt?: string;
  answeredAt?: string;
  endedAt?: string;
  duration?: number;
  answerDuration?: number;
  recordingUrl?: string;
};

export function verifySipSecret(header: string | null, secret: string) {
  if (!secret) return false;
  if (!header) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(secret));
  } catch {
    return false;
  }
}

export async function handleTelephonyEvent(client: PrismaClient, event: TelephonyWebhook) {
  const publications: Array<() => void> = [];
  const result = await client.$transaction(async (tx) => {
    // Serialize events for ONE provider call, never calls across the CRM.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${event.callId}, 0))`;
    return handleLockedEvent(tx, event, publications);
  });
  for (const publish of publications) publish();
  return result;
}

async function handleLockedEvent(tx: Prisma.TransactionClient, incoming: TelephonyWebhook, publications: Array<() => void>) {
  const emitToUser = (...args: Parameters<typeof publishToUser>) => publications.push(() => publishToUser(...args));
  const emitToAdmins = (...args: Parameters<typeof publishToAdmins>) => publications.push(() => publishToAdmins(...args));
  const notifyUser = async (db: PrismaClient, data: Parameters<typeof persistNotification>[1]) => {
    const notification = await persistNotification(db, data, false);
    emitToUser(data.userId, "notification", {
      id: notification.id, type: notification.type, title: notification.title, body: notification.body,
    });
  };
  const db = tx as PrismaClient;
  const existing = await db.call.findUnique({ where: { externalCallId: incoming.callId } });
  if (!incoming.direction && !existing) throw new Error("TELEPHONY_AWAITING_START");
  const event = { ...incoming, direction: incoming.direction || existing!.direction };
  // Late start/answer notifications must not resurrect an ended call.
  if (existing?.endedAt && (event.event === "call.started" || event.event === "call.answered")) {
    return { call: existing, ingest: null };
  }
  if (event.event === "call.recording") {
    if (!existing) throw new Error("TELEPHONY_AWAITING_START");
    if (!event.recordingUrl) return { call: existing, ingest: null };
    const recordedCall = await db.call.update({ where: { id: existing.id }, data: { recordingUrl: event.recordingUrl } });
    const rec = await db.callRecording.findFirst({ where: { callId: existing.id } });
    if (rec) await db.callRecording.update({ where: { id: rec.id }, data: { url: event.recordingUrl } });
    else await db.callRecording.create({ data: { callId: existing.id, url: event.recordingUrl } });
    if (existing.managerId) emitToUser(existing.managerId, "call:updated", { callId: existing.id });
    emitToAdmins("call:updated", { callId: existing.id });
    return { call: recordedCall, ingest: null };
  }

  const customerNumber = existing
    ? (existing.direction === "INBOUND" ? existing.fromNumber : existing.toNumber)
    : event.direction === "INBOUND" ? event.from : event.to;
  let routedManagerId: string | null = null;
  if (event.providerInternal) {
    const accounts = serverSipAccounts();
    const account = Object.values(accounts).find((a) => (a.pbxExtension || a.username) === event.providerInternal);
    const bySip = await db.user.findMany({ where: { isActive: true, OR: [
      { sipUsername: account?.username || event.providerInternal },
      ...(account ? Object.entries(accounts).filter(([, a]) => a === account).map(([logicalExtension]) => ({ sipExtension: logicalExtension, OR: [{ sipUsername: null }, { sipUsername: account.username }] })) : []),
    ] }, take: 2 });
    if (bySip.length === 1) routedManagerId = bySip[0].id;
  }
  if (event.managerExtension) {
    const byExt = await db.user.findFirst({ where: { sipExtension: event.managerExtension, isActive: true } });
    if (byExt) routedManagerId = byExt.id;
  }

  const ingest = await ingestContact(db, {
    phone: customerNumber,
    firstName: "Звонок",
    source: "PHONE_CALL",
    // Only new contacts use the provider's explicitly resolved manager.
    newContactManagerId: routedManagerId,
  });
  const managerId = routedManagerId || existing?.managerId || (event.direction === "INBOUND" ? ingest.managerId : null);

  const status = event.status || (event.event === "call.ended" ? "ANSWERED" : "RINGING");

  const data = {
    contactId: ingest.contactId,
    managerId,
    direction: existing?.direction || event.direction,
    fromNumber: existing?.fromNumber || normalizePhone(event.from) || event.from,
    toNumber: existing?.toNumber || normalizePhone(event.to) || event.to,
    corporateNumber: event.corporateNumber || existing?.corporateNumber || process.env.SIP_CORPORATE_NUMBER || "",
    status: event.event === "call.started" && existing?.answeredAt ? existing.status : status,
    startedAt: existing?.startedAt || (event.startedAt ? new Date(event.startedAt) : new Date()),
    answeredAt: event.answeredAt ? new Date(event.answeredAt) : undefined,
    endedAt: event.endedAt ? new Date(event.endedAt) : undefined,
    duration: event.duration ?? existing?.duration ?? 0,
    answerDuration: event.answerDuration ?? existing?.answerDuration ?? 0,
    recordingUrl: event.recordingUrl,
  };

  const call = existing
    ? await db.call.update({
        where: { id: existing.id },
        data,
      })
    : await db.call.create({
        data: {
          externalCallId: event.callId,
          ...data,
        },
      });

  if (event.recordingUrl) {
    const rec = await db.callRecording.findFirst({ where: { callId: call.id } });
    if (rec) {
      await db.callRecording.update({ where: { id: rec.id }, data: { url: event.recordingUrl } });
    } else {
      await db.callRecording.create({ data: { callId: call.id, url: event.recordingUrl } });
    }
  }

  if (event.event === "call.started" && !existing) {
    await db.activity.create({
      data: {
        contactId: ingest.contactId,
        managerId,
        type: event.direction === "INBOUND" ? "CALL_IN" : "CALL_OUT",
        title: event.direction === "INBOUND" ? "Входящий звонок" : "Исходящий звонок",
        payload: { callId: call.id },
      },
    });
  }

  if (event.event === "call.started" && (!existing || managerId !== existing.managerId)) {
    if (managerId) {
      if (event.direction === "INBOUND") await notifyUser(db, {
        userId: managerId,
        type: "INCOMING_CALL",
        title: "Входящий звонок",
        body: customerNumber,
        data: { contactId: ingest.contactId, callId: call.id },
      });
      emitToUser(managerId, callRealtimeEvent(event.direction), { callId: call.id, contactId: ingest.contactId, direction: event.direction });
      if (ingest.createdContact) {
        emitToUser(managerId, "lead:new", { contactId: ingest.contactId });
      }
    }
    emitToAdmins(callRealtimeEvent(event.direction), { callId: call.id, contactId: ingest.contactId, direction: event.direction });
    if (ingest.createdContact) {
      emitToAdmins("lead:new", { contactId: ingest.contactId });
    }
  }

  if (event.event === "call.ended" || event.event === "call.answered") {
    if (managerId) emitToUser(managerId, "call:updated", { callId: call.id });
    emitToAdmins("call:updated", { callId: call.id });
  }

  if (!existing?.endedAt && event.direction === "INBOUND" && event.event === "call.ended" && (status === "MISSED" || status === "NO_ANSWER") && managerId) {
    await notifyUser(db, {
      userId: managerId,
      type: "MISSED_CALL",
      title: "Пропущенный звонок",
      body: customerNumber,
      data: { contactId: ingest.contactId, callId: call.id },
    });
  }

  return { call, ingest };
}

export function callRealtimeEvent(direction: "INBOUND" | "OUTBOUND") {
  return direction === "INBOUND" ? "call:incoming" : "call:outgoing";
}

export async function originateCall(params: Parameters<typeof zadarmaCallback>[0]) {
  return zadarmaCallback(params);
}

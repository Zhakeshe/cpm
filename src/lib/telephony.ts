import crypto from "crypto";
import type { PrismaClient } from "@prisma/client";
import { ingestContact } from "./contacts";
import { notifyUser } from "./notifications";
import { emitToUser, emitToAdmins } from "./realtime";
import { normalizePhone } from "./phone";

export type TelephonyWebhook = {
  event: "call.started" | "call.answered" | "call.ended" | "call.recording";
  callId: string;
  direction: "INBOUND" | "OUTBOUND";
  from: string;
  to: string;
  corporateNumber?: string;
  managerExtension?: string;
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

export async function handleTelephonyEvent(db: PrismaClient, event: TelephonyWebhook) {
  const customerNumber = event.direction === "INBOUND" ? event.from : event.to;
  const ingest = await ingestContact(db, {
    phone: customerNumber,
    firstName: "Звонок",
    source: "PHONE_CALL",
  });

  let managerId = ingest.managerId;
  if (event.managerExtension) {
    const byExt = await db.user.findFirst({ where: { sipExtension: event.managerExtension } });
    if (byExt) managerId = byExt.id;
  }

  const existing = await db.call.findUnique({ where: { externalCallId: event.callId } });
  const status = event.status || (event.event === "call.ended" ? "ANSWERED" : "RINGING");

  const data = {
    contactId: ingest.contactId,
    managerId,
    direction: event.direction,
    fromNumber: normalizePhone(event.from) || event.from,
    toNumber: normalizePhone(event.to) || event.to,
    corporateNumber: event.corporateNumber || process.env.SIP_CORPORATE_NUMBER || "",
    status,
    startedAt: event.startedAt ? new Date(event.startedAt) : new Date(),
    answeredAt: event.answeredAt ? new Date(event.answeredAt) : undefined,
    endedAt: event.endedAt ? new Date(event.endedAt) : undefined,
    duration: event.duration || 0,
    answerDuration: event.answerDuration || 0,
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
    if (managerId) {
      await notifyUser(db, {
        userId: managerId,
        type: "INCOMING_CALL",
        title: "Входящий звонок",
        body: customerNumber,
        data: { contactId: ingest.contactId, callId: call.id },
      });
      emitToUser(managerId, "call:incoming", { callId: call.id, contactId: ingest.contactId });
      if (ingest.createdContact) {
        emitToUser(managerId, "lead:new", { contactId: ingest.contactId });
      }
    }
    emitToAdmins("call:incoming", { callId: call.id, contactId: ingest.contactId });
    if (ingest.createdContact) {
      emitToAdmins("lead:new", { contactId: ingest.contactId });
    }
  }

  if (event.event === "call.ended") {
    if (managerId) emitToUser(managerId, "call:updated", { callId: call.id });
    emitToAdmins("call:updated", { callId: call.id });
  }

  if (event.event === "call.ended" && (status === "MISSED" || status === "NO_ANSWER") && managerId) {
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

export async function originateCall(params: { fromExtension: string; toNumber: string }) {
  const url = process.env.SIP_ORIGINATE_URL;
  const token = process.env.SIP_API_TOKEN;
  if (!url) {
    return { mocked: true, callId: `local-${crypto.randomUUID()}` };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token || ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: params.fromExtension, to: params.toNumber }),
  });
  if (!res.ok) throw new Error(`SIP originate failed: ${await res.text()}`);
  return res.json();
}

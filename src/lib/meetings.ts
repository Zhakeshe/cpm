import type { PrismaClient } from "@prisma/client";
import { advanceOpenStage } from "./outcomes";
import { notifyUser } from "./notifications";
import { generateOpenSlots, nextAutoSlot, overlaps, SLOT_MINUTES, type TimeInterval } from "./demo-slots";

export class SlotTakenError extends Error {
  status = 409;
  constructor() {
    super("SLOT_TAKEN");
  }
}

export class SlotUnavailableError extends Error {
  status = 400;
  constructor() {
    super("SLOT_UNAVAILABLE");
  }
}

export async function busyIntervals(db: PrismaClient, managerId: string, exceptId?: string): Promise<TimeInterval[]> {
  const meetings = await db.meeting.findMany({
    where: {
      managerId,
      status: "SCHEDULED",
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { startsAt: true, endsAt: true },
  });
  return meetings.map((m) => ({
    start: m.startsAt,
    end: m.endsAt ?? new Date(m.startsAt.getTime() + SLOT_MINUTES * 60 * 1000),
  }));
}

export async function listDemoSlots(db: PrismaClient, managerId: string, now = new Date(), days = 7) {
  const busy = await busyIntervals(db, managerId);
  const slots = generateOpenSlots({ from: now, days, busy, now });
  return {
    slots: slots.map((d) => d.toISOString()),
    next: slots[0]?.toISOString() ?? null,
  };
}

async function assertFree(db: PrismaClient, managerId: string, start: Date, end: Date, exceptId?: string) {
  const busy = await busyIntervals(db, managerId, exceptId);
  if (busy.some((block) => overlaps({ start, end }, block))) {
    throw new SlotTakenError();
  }
}

export async function bookDemo(
  db: PrismaClient,
  params: {
    managerId: string;
    creatorId: string;
    contactId?: string;
    startsAt?: Date;
    auto?: boolean;
    format?: "ONLINE" | "OFFLINE" | "PHONE";
    comment?: string;
    now?: Date;
  },
) {
  const busy = await busyIntervals(db, params.managerId);
  const start = params.auto || !params.startsAt ? nextAutoSlot({ busy, now: params.now }) : params.startsAt;
  if (!start) throw new SlotUnavailableError();
  const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
  await assertFree(db, params.managerId, start, end);

  const meeting = await db.meeting.create({
    data: {
      contactId: params.contactId,
      managerId: params.managerId,
      startsAt: start,
      endsAt: end,
      format: params.format || "ONLINE",
      comment: params.comment || "",
    },
  });

  if (params.contactId) {
    await db.activity.create({
      data: {
        contactId: params.contactId,
        managerId: params.managerId,
        type: "MEETING_CREATED",
        title: `Назначено демо ${start.toISOString()}`,
        payload: { meetingId: meeting.id, auto: Boolean(params.auto || !params.startsAt) },
      },
    });
    await advanceOpenStage(db, { contactId: params.contactId, slug: "demo", actorId: params.creatorId });
  }

  await notifyUser(db, {
    userId: params.managerId,
    type: "MEETING_ASSIGNED",
    title: "Назначена встреча",
    body: params.comment || start.toISOString(),
    data: { meetingId: meeting.id, contactId: params.contactId },
  });

  return meeting;
}

export async function updateMeeting(
  db: PrismaClient,
  params: {
    id: string;
    managerScope?: string;
    status?: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    startsAt?: Date;
  },
) {
  const existing = await db.meeting.findUnique({ where: { id: params.id } });
  if (!existing || (params.managerScope && existing.managerId !== params.managerScope)) {
    throw Object.assign(new Error("NOT_FOUND"), { status: 404 });
  }
  const data: { status?: typeof params.status; startsAt?: Date; endsAt?: Date; reminderSentAt?: null } = {};
  if (params.status) data.status = params.status;
  if (params.startsAt) {
    const end = new Date(params.startsAt.getTime() + SLOT_MINUTES * 60 * 1000);
    await assertFree(db, existing.managerId, params.startsAt, end, existing.id);
    data.startsAt = params.startsAt;
    data.endsAt = end;
    data.reminderSentAt = null;
  }
  return db.meeting.update({ where: { id: params.id }, data });
}

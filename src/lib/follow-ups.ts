import type { Prisma, PrismaClient } from "@prisma/client";
import { notifyUser } from "./notifications";
import { advanceOpenStage } from "./outcomes";

export const DEFAULT_STALE_DAYS = 3;
export const FOLLOW_UP_PRESETS = ["today", "tomorrow", "in3days"] as const;
export type FollowUpPreset = (typeof FOLLOW_UP_PRESETS)[number];

export type FollowUpReason = "never" | "stale";

/**
 * A live deal belongs on the call-back list when nobody scheduled the next
 * step and either the client was never actually reached, or the last touch
 * is older than the stale window.
 */
export function isOnFollowUpQueue(
  input: {
    status: string;
    lastContactAt: Date | null;
    hasOpenTask: boolean;
    hasMessages: boolean;
    hasCalls: boolean;
  },
  now = new Date(),
  staleDays = DEFAULT_STALE_DAYS,
) {
  if (input.status === "WON" || input.status === "LOST") return false;
  if (input.hasOpenTask) return false;
  if (!input.hasMessages && !input.hasCalls) return true;
  if (!input.lastContactAt) return true;
  const cutoff = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000);
  return input.lastContactAt < cutoff;
}

export function followUpReason(input: { hasMessages: boolean; hasCalls: boolean }): FollowUpReason {
  return !input.hasMessages && !input.hasCalls ? "never" : "stale";
}

export function dueAtForPreset(preset: FollowUpPreset, now = new Date()) {
  const due = new Date(now);
  if (preset === "today") {
    due.setHours(due.getHours() + 3, 0, 0, 0);
    return due;
  }
  if (preset === "tomorrow") {
    due.setDate(due.getDate() + 1);
    due.setHours(10, 0, 0, 0);
    return due;
  }
  due.setDate(due.getDate() + 3);
  due.setHours(10, 0, 0, 0);
  return due;
}

export function followUpWhere(
  managerId: string | undefined,
  now = new Date(),
  staleDays = DEFAULT_STALE_DAYS,
): Prisma.ContactWhereInput {
  const cutoff = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000);
  return {
    ...(managerId ? { managerId } : {}),
    status: { in: ["NEW", "IN_PROGRESS"] },
    tasks: { none: { status: "OPEN" } },
    OR: [
      { lastContactAt: null },
      { lastContactAt: { lt: cutoff } },
      { AND: [{ messages: { none: {} } }, { calls: { none: {} } }] },
    ],
  };
}

export async function listFollowUpQueue(
  db: PrismaClient,
  managerId: string | undefined,
  now = new Date(),
  staleDays = DEFAULT_STALE_DAYS,
) {
  const contacts = await db.contact.findMany({
    where: followUpWhere(managerId, now, staleDays),
    include: {
      manager: { select: { id: true, name: true } },
      pipelineStage: { select: { id: true, name: true } },
      _count: { select: { messages: true, calls: true } },
    },
    orderBy: [{ lastContactAt: "asc" }, { createdAt: "asc" }],
    take: 200,
  });
  return contacts.map((contact) => {
    const hasMessages = contact._count.messages > 0;
    const hasCalls = contact._count.calls > 0;
    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phoneDisplay: contact.phoneDisplay,
      source: contact.source,
      status: contact.status,
      lastContactAt: contact.lastContactAt,
      comment: contact.comment,
      manager: contact.manager,
      pipelineStage: contact.pipelineStage,
      reason: followUpReason({ hasMessages, hasCalls }),
    };
  });
}

export async function countFollowUpQueue(
  db: PrismaClient,
  managerId: string | undefined,
  now = new Date(),
  staleDays = DEFAULT_STALE_DAYS,
) {
  return db.contact.count({ where: followUpWhere(managerId, now, staleDays) });
}

export async function scheduleFollowUp(
  db: PrismaClient,
  params: {
    contactId: string;
    managerId: string;
    creatorId: string;
    preset: FollowUpPreset;
    description?: string;
    now?: Date;
  },
) {
  const dueAt = dueAtForPreset(params.preset, params.now);
  const reminderAt = new Date(dueAt.getTime() - 10 * 60 * 1000);
  const description = (params.description || "").trim() || "Перезвонить";
  const task = await db.task.create({
    data: {
      contactId: params.contactId,
      managerId: params.managerId,
      creatorId: params.creatorId,
      type: "FOLLOW_UP",
      description,
      dueAt,
      reminderAt,
    },
  });
  await db.activity.create({
    data: {
      contactId: params.contactId,
      managerId: params.managerId,
      type: "TASK_CREATED",
      title: `Запланирован перезвон: ${description}`,
      payload: { taskId: task.id, preset: params.preset },
    },
  });
  await notifyUser(db, {
    userId: params.managerId,
    type: "NEW_TASK",
    title: "Перезвон запланирован",
    body: description,
    data: { taskId: task.id, contactId: params.contactId },
  });
  await advanceOpenStage(db, { contactId: params.contactId, slug: "later_call", actorId: params.creatorId });
  return task;
}

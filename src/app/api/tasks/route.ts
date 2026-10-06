import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canReassignManager, scopeManagerId } from "@/lib/rbac";
import { notifyUser } from "@/lib/notifications";
import { clientDayStart, TASK_BUCKETS, taskBucketFilter, type TaskBucket } from "@/lib/task-buckets";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const taskInclude = {
  contact: {
    include: {
      pipelineStage: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  },
  manager: { select: { id: true, name: true } },
  creator: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

const taskTypes = ["CALL", "WHATSAPP", "DEMO", "MEETING", "SEND_PROPOSAL", "FOLLOW_UP", "OTHER"] as const;
function taskFilters(req: NextRequest, user: Awaited<ReturnType<typeof requireUser>>): Prisma.TaskWhereInput {
  const params = req.nextUrl.searchParams;
  const managerScope = scopeManagerId(user.role, user.id);
  const managerId = managerScope || params.get("managerId") || undefined;
  const type = params.get("type");
  const q = params.get("q")?.trim();
  const from = params.get("from");
  const to = params.get("to");
  const filters: Prisma.TaskWhereInput[] = [];
  if (managerId) filters.push({ managerId });
  if (params.get("contactId")) filters.push({ contactId: params.get("contactId")! });
  if (type && taskTypes.includes(type as (typeof taskTypes)[number])) filters.push({ type: type as (typeof taskTypes)[number] });
  if (params.get("tagId")) filters.push({ contact: { tags: { some: { tagId: params.get("tagId")! } } } });
  if (from || to) filters.push({ dueAt: { gte: from ? new Date(from) : undefined, lt: to ? new Date(to) : undefined } });
  if (q) {
    filters.push({
      OR: [
        { description: { contains: q, mode: "insensitive" } },
        { contact: { firstName: { contains: q, mode: "insensitive" } } },
        { contact: { lastName: { contains: q, mode: "insensitive" } } },
        { manager: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  return filters.length ? { AND: filters } : {};
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const params = req.nextUrl.searchParams;
    const timezoneOffset = Math.max(-840, Math.min(840, Number(params.get("tz") || 0) || 0));
    const now = new Date();
    const today = clientDayStart(now, timezoneOffset);
    const baseWhere = taskFilters(req, user);
    if (params.get("mode") === "summary") {
      const entries = await Promise.all(TASK_BUCKETS.map(async (bucket) => [
        bucket,
        await prisma.task.count({ where: { AND: [baseWhere, taskBucketFilter(bucket, now, today)] } }),
      ] as const));
      return NextResponse.json({ counts: Object.fromEntries(entries) });
    }
    const bucket = params.get("bucket");
    if (!TASK_BUCKETS.includes(bucket as TaskBucket)) {
      return NextResponse.json({ error: "INVALID_BUCKET" }, { status: 400 });
    }
    const offset = Math.max(0, Number(params.get("offset") || 0) || 0);
    const limit = Math.max(10, Math.min(100, Number(params.get("limit") || 30) || 30));
    const where = { AND: [baseWhere, taskBucketFilter(bucket as TaskBucket, now, today)] };
    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy: [{ dueAt: "asc" }, { id: "asc" }],
        skip: offset,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);
    return NextResponse.json({ items, total, nextOffset: offset + items.length, hasMore: offset + items.length < total });
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  contactId: z.string().optional(),
  managerId: z.string().optional(),
  type: z.enum(["CALL", "WHATSAPP", "DEMO", "MEETING", "SEND_PROPOSAL", "FOLLOW_UP", "OTHER"]),
  description: z.string().min(1),
  dueAt: z.string().refine((value) => !Number.isNaN(new Date(value).getTime())),
  reminderAt: z.string().refine((value) => !Number.isNaN(new Date(value).getTime())).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const managerId = body.managerId && canReassignManager(user.role) ? body.managerId : user.id;
    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          contactId: body.contactId,
          managerId,
          creatorId: user.id,
          type: body.type,
          description: body.description,
          dueAt: new Date(body.dueAt),
          reminderAt: body.reminderAt ? new Date(body.reminderAt) : undefined,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "task.create",
          entityType: "Task",
          entityId: created.id,
          newValue: { managerId, contactId: body.contactId || null, dueAt: created.dueAt.toISOString(), status: created.status },
        },
      });
      if (body.contactId) {
        await tx.activity.create({
          data: {
            contactId: body.contactId,
            managerId,
            type: "TASK_CREATED",
            title: `Создана задача: ${body.description}`,
            payload: { taskId: created.id },
          },
        });
      }
      return created;
    });
    await notifyUser(prisma, {
      userId: managerId,
      type: "NEW_TASK",
      title: "Новая задача",
      body: body.description,
      data: { taskId: task.id },
    });
    return NextResponse.json(task);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = z
      .object({
        id: z.string().min(1),
        status: z.enum(["OPEN", "DONE", "CANCELLED"]).optional(),
        dueAt: z.string().refine((value) => !Number.isNaN(new Date(value).getTime())).optional(),
      })
      .refine((value) => value.status !== undefined || value.dueAt !== undefined)
      .parse(await req.json());
    const managerId = scopeManagerId(user.role, user.id);
    const existing = await prisma.task.findFirst({
      where: { id: body.id, ...(managerId ? { managerId } : {}) },
      select: { id: true, status: true, dueAt: true, managerId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const task = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: body.id },
        data: {
          status: body.status,
          dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
          reminderSentAt: body.dueAt ? null : undefined,
          overdueNotifiedAt: body.dueAt ? null : undefined,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: body.dueAt ? "task.reschedule" : `task.${String(body.status).toLowerCase()}`,
          entityType: "Task",
          entityId: updated.id,
          oldValue: { status: existing.status, dueAt: existing.dueAt.toISOString(), managerId: existing.managerId },
          newValue: { status: updated.status, dueAt: updated.dueAt.toISOString(), managerId: updated.managerId },
        },
      });
      return updated;
    });
    return NextResponse.json(task);
  } catch (err) {
    return jsonError(err);
  }
}

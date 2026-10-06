import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canReassignManager, scopeManagerId } from "@/lib/rbac";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

export async function GET() {
  try {
    const user = await requireUser();
    const managerId = scopeManagerId(user.role, user.id);
    const tasks = await prisma.task.findMany({
      where: managerId ? { managerId } : {},
      include: {
        contact: {
          include: {
            pipelineStage: { select: { id: true, name: true } },
            tags: { include: { tag: true } },
          },
        },
        manager: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { dueAt: "asc" },
      take: 300,
    });
    return NextResponse.json(tasks);
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
    const task = await prisma.task.create({
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
    if (body.contactId) {
      await prisma.activity.create({
        data: {
          contactId: body.contactId,
          managerId,
          type: "TASK_CREATED",
          title: `Создана задача: ${body.description}`,
          payload: { taskId: task.id },
        },
      });
    }
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
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const task = await prisma.task.update({
      where: { id: body.id },
      data: {
        status: body.status,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
        reminderSentAt: body.dueAt ? null : undefined,
        overdueNotifiedAt: body.dueAt ? null : undefined,
      },
    });
    return NextResponse.json(task);
  } catch (err) {
    return jsonError(err);
  }
}

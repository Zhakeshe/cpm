import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { requestedManagerId, scopeManagerId } from "@/lib/rbac";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const managerId = requestedManagerId(user.role, user.id, req.nextUrl.searchParams.get("manager"));
    const tasks = await prisma.task.findMany({
      where: managerId ? { managerId } : {},
      include: { contact: true, manager: { select: { id: true, name: true } } },
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
  dueAt: z.string(),
  reminderAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const managerId = body.managerId || user.id;
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
    const body = await req.json();
    const task = await prisma.task.update({
      where: { id: body.id },
      data: { status: body.status },
    });
    return NextResponse.json(task);
  } catch (err) {
    return jsonError(err);
  }
}

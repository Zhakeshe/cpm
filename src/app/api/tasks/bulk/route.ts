import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { canReassignManager, scopeManagerId } from "@/lib/rbac";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("DONE"), ids: z.array(z.string()).min(1).max(500) }),
  z.object({ action: z.literal("CANCEL"), ids: z.array(z.string()).min(1).max(500) }),
  z.object({
    action: z.literal("RESCHEDULE"),
    ids: z.array(z.string()).min(1).max(500),
    dueAt: z.string().refine((value) => !Number.isNaN(new Date(value).getTime())),
  }),
  z.object({ action: z.literal("REASSIGN"), ids: z.array(z.string()).min(1).max(500), managerId: z.string().min(1) }),
]);

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    if (body.action === "REASSIGN" && !canReassignManager(user.role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const managerScope = scopeManagerId(user.role, user.id);
    const tasks = await prisma.task.findMany({
      where: { id: { in: body.ids }, ...(managerScope ? { managerId: managerScope } : {}) },
      select: { id: true, status: true, dueAt: true, managerId: true },
    });
    if (tasks.length !== new Set(body.ids).size) {
      return NextResponse.json({ error: "TASK_ACCESS_DENIED" }, { status: 403 });
    }
    const data: Prisma.TaskUpdateManyMutationInput = body.action === "DONE"
      ? { status: "DONE" as const }
      : body.action === "CANCEL"
        ? { status: "CANCELLED" as const }
        : body.action === "RESCHEDULE"
          ? { dueAt: new Date(body.dueAt), reminderSentAt: null, overdueNotifiedAt: null }
          : { managerId: body.managerId };
    await prisma.$transaction(async (tx) => {
      await tx.task.updateMany({ where: { id: { in: tasks.map((task) => task.id) } }, data });
      await tx.auditLog.createMany({
        data: tasks.map((task) => ({
          actorId: user.id,
          action: `task.bulk.${body.action.toLowerCase()}`,
          entityType: "Task",
          entityId: task.id,
          oldValue: { status: task.status, dueAt: task.dueAt.toISOString(), managerId: task.managerId },
          newValue: {
            status: body.action === "DONE" ? "DONE" : body.action === "CANCEL" ? "CANCELLED" : task.status,
            dueAt: body.action === "RESCHEDULE" ? new Date(body.dueAt).toISOString() : task.dueAt.toISOString(),
            managerId: body.action === "REASSIGN" ? body.managerId : task.managerId,
          },
        })),
      });
    });
    return NextResponse.json({ updated: tasks.length });
  } catch (err) {
    return jsonError(err);
  }
}

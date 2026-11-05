import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { scopeManagerId } from "@/lib/rbac";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const managerId = scopeManagerId(user.role, user.id);
    const task = await prisma.task.findFirst({
      where: { id, ...(managerId ? { managerId } : {}) },
      select: { id: true },
    });
    if (!task) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const history = await prisma.auditLog.findMany({
      where: { entityType: "Task", entityId: id },
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(history);
  } catch (err) {
    return jsonError(err);
  }
}

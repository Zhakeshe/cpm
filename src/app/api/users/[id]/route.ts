import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canSeeAllRecords } from "@/lib/rbac";
import { analytics, rangeFromPreset } from "@/lib/analytics";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser();
    const { id } = await ctx.params;
    if (!canSeeAllRecords(actor.role) && actor.id !== id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const preset = new URL(req.url).searchParams.get("preset") || "month";
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        acceptsNewLeads: true,
        sipExtension: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
    if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const [stats, openTasks, recentCalls, recentContacts] = await Promise.all([
      analytics(rangeFromPreset(preset), id),
      prisma.task.count({ where: { managerId: id, status: "OPEN" } }),
      prisma.call.findMany({
        where: { managerId: id },
        include: { contact: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { startedAt: "desc" },
        take: 10,
      }),
      prisma.contact.findMany({
        where: { managerId: id },
        include: { pipelineStage: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({ user, stats, openTasks, recentCalls, recentContacts });
  } catch (err) {
    return jsonError(err);
  }
}

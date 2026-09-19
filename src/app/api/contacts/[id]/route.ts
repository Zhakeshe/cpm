import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canListenAllRecordings, scopeManagerId } from "@/lib/rbac";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const managerId = scopeManagerId(user.role, user.id);
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true, role: true } },
        pipelineStage: true,
        conversations: { include: { messages: { orderBy: { sentAt: "asc" }, take: 200 } } },
        calls: { orderBy: { startedAt: "desc" }, take: 50, include: { recordings: true } },
        tasks: { orderBy: { dueAt: "desc" } },
        meetings: { orderBy: { startsAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" }, take: 200 },
      },
    });
    if (!contact || (managerId && contact.managerId !== managerId)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (!canListenAllRecordings(user.role)) {
      contact.calls = contact.calls.filter((c) => c.managerId === user.id);
    }
    return NextResponse.json(contact);
  } catch (err) {
    return jsonError(err);
  }
}

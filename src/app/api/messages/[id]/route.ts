import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const managerId = scopeManagerId(user.role, user.id);
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: {
          include: {
            manager: { select: { id: true, name: true } },
            pipelineStage: true,
            tasks: { where: { status: "OPEN" }, take: 3 },
          },
        },
        messages: { orderBy: { sentAt: "asc" } },
      },
    });
    if (!conversation || (managerId && conversation.managerId !== user.id)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    await prisma.conversation.update({ where: { id }, data: { unreadCount: 0 } });
    return NextResponse.json(conversation);
  } catch (err) {
    return jsonError(err);
  }
}

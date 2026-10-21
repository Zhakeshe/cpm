import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";

const contactInclude = {
  manager: { select: { id: true, name: true } },
  tasks: { where: { status: "OPEN" as const }, orderBy: { dueAt: "asc" as const }, take: 1 },
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const managerId = scopeManagerId(user.role, user.id);
    const stageId = req.nextUrl.searchParams.get("stageId");
    const offset = Math.max(0, Number(req.nextUrl.searchParams.get("offset")) || 0);
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 100));
    const contactWhere = managerId ? { managerId } : {};
    if (stageId) {
      const stage = await prisma.pipelineStage.findFirst({
        where: { id: stageId, isActive: true, pipeline: { isDefault: true } },
        select: { id: true },
      });
      if (!stage) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      const where = { ...contactWhere, pipelineStageId: stageId };
      const [items, total] = await Promise.all([
        prisma.contact.findMany({
          where,
          include: contactInclude,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: offset,
          take: limit,
        }),
        prisma.contact.count({ where }),
      ]);
      return NextResponse.json({ items, total, nextOffset: offset + items.length, hasMore: offset + items.length < total });
    }
    const stages = await prisma.pipelineStage.findMany({
      where: { isActive: true, pipeline: { isDefault: true } },
      orderBy: { order: "asc" },
      include: {
        contacts: {
          where: contactWhere,
          include: contactInclude,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 100,
        },
        _count: { select: { contacts: { where: contactWhere } } },
      },
    });
    return NextResponse.json(stages.map(({ _count, ...stage }) => ({
      ...stage,
      contactTotal: _count.contacts,
      hasMore: stage.contacts.length < _count.contacts,
    })));
  } catch (err) {
    return jsonError(err);
  }
}

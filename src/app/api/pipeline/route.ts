import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { requestedManagerId } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const managerId = requestedManagerId(user.role, user.id, req.nextUrl.searchParams.get("manager"));
    const stages = await prisma.pipelineStage.findMany({
      where: { isActive: true, pipeline: { isDefault: true } },
      orderBy: { order: "asc" },
      include: {
        contacts: {
          where: managerId ? { managerId } : {},
          include: {
            manager: { select: { id: true, name: true } },
            tasks: { where: { status: "OPEN" }, orderBy: { dueAt: "asc" }, take: 1 },
          },
          orderBy: { updatedAt: "desc" },
          take: 100,
        },
      },
    });
    return NextResponse.json(stages);
  } catch (err) {
    return jsonError(err);
  }
}

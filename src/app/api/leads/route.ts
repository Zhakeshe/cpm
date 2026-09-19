import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const managerId = scopeManagerId(user.role, user.id);
    const unprocessed = req.nextUrl.searchParams.get("unprocessed") === "1";
    const leads = await prisma.lead.findMany({
      where: {
        ...(managerId ? { managerId } : {}),
        ...(unprocessed ? { processedAt: null } : {}),
      },
      include: {
        contact: {
          include: {
            pipelineStage: true,
            manager: { select: { id: true, name: true, email: true } },
          },
        },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(leads);
  } catch (err) {
    return jsonError(err);
  }
}

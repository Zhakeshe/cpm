import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { listDemoSlots } from "@/lib/meetings";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const requested = req.nextUrl.searchParams.get("managerId");
    const scoped = scopeManagerId(user.role, user.id);
    const managerId = scoped || requested || user.id;
    if (scoped && requested && requested !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const days = Number(req.nextUrl.searchParams.get("days") || 7);
    return NextResponse.json(await listDemoSlots(prisma, managerId, new Date(), Number.isFinite(days) ? days : 7));
  } catch (err) {
    return jsonError(err);
  }
}

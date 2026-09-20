import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { analytics, managerTable, rangeFromPreset } from "@/lib/analytics";
import { canSeeAllRecords } from "@/lib/rbac";
import { funnelConversion, planFact } from "@/lib/plan-fact";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const preset = req.nextUrl.searchParams.get("preset") || "today";
    const from = req.nextUrl.searchParams.get("from") || undefined;
    const to = req.nextUrl.searchParams.get("to") || undefined;
    const managerId = req.nextUrl.searchParams.get("managerId") || undefined;
    const range = rangeFromPreset(preset, from, to);
    const now = new Date();
    if (!canSeeAllRecords(user.role)) {
      const [stats, funnel, plan] = await Promise.all([
        analytics(range, user.id),
        funnelConversion(prisma, user.id),
        planFact(prisma, now.getFullYear(), now.getMonth() + 1),
      ]);
      return NextResponse.json({
        stats,
        managers: [],
        funnel,
        plan: { ...plan, rows: plan.rows.filter((r) => r.managerId === user.id) },
      });
    }
    const [stats, managers, funnel, plan] = await Promise.all([
      analytics(range, managerId),
      managerTable(range),
      funnelConversion(prisma, managerId),
      planFact(prisma, now.getFullYear(), now.getMonth() + 1),
    ]);
    return NextResponse.json({ stats, managers, funnel, plan });
  } catch (err) {
    return jsonError(err);
  }
}

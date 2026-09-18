import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { analytics, managerTable, rangeFromPreset } from "@/lib/analytics";
import { canSeeAllRecords } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const preset = req.nextUrl.searchParams.get("preset") || "today";
    const from = req.nextUrl.searchParams.get("from") || undefined;
    const to = req.nextUrl.searchParams.get("to") || undefined;
    const managerId = req.nextUrl.searchParams.get("managerId") || undefined;
    const range = rangeFromPreset(preset, from, to);
    if (!canSeeAllRecords(user.role)) {
      const stats = await analytics(range, user.id);
      return NextResponse.json({ stats, managers: [] });
    }
    const [stats, managers] = await Promise.all([analytics(range, managerId), managerTable(range)]);
    return NextResponse.json({ stats, managers });
  } catch (err) {
    return jsonError(err);
  }
}

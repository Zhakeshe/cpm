import { NextResponse } from "next/server";
import { requireRole, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { monitorReportSchema } from "@/lib/monitoring";
export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPERVISOR"]);
    const saved = await prisma.systemSetting.findUnique({ where: { key: "monitor:last-report" } });
    const report = monitorReportSchema.safeParse(saved?.value);
    return NextResponse.json({ report: report.success ? report.data : null, stale: !report.success || Date.now() - Date.parse(report.data.checkedAt) > 180_000 }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return jsonError(e); }
}

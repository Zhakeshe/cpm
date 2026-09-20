import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canManageSettings, canSeeAllRecords } from "@/lib/rbac";
import { planFact } from "@/lib/plan-fact";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const now = new Date();
    const year = Number(req.nextUrl.searchParams.get("year") || now.getFullYear());
    const month = Number(req.nextUrl.searchParams.get("month") || now.getMonth() + 1);
    const data = await planFact(prisma, year, month);
    if (!canSeeAllRecords(user.role)) {
      return NextResponse.json({ ...data, rows: data.rows.filter((r) => r.managerId === user.id) });
    }
    return NextResponse.json(data);
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  managerId: z.string(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  leadTarget: z.number().int().nonnegative(),
  revenueTarget: z.number().nonnegative(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!canManageSettings(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const body = schema.parse(await req.json());
    const row = await prisma.salesQuota.upsert({
      where: { managerId_year_month: { managerId: body.managerId, year: body.year, month: body.month } },
      create: body,
      update: { leadTarget: body.leadTarget, revenueTarget: body.revenueTarget },
    });
    return NextResponse.json(row);
  } catch (err) {
    return jsonError(err);
  }
}

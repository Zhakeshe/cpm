import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canSeeAllRecords, scopeManagerId } from "@/lib/rbac";
import { getSlaSettings } from "@/lib/sla";

export async function GET() {
  try {
    const user = await requireUser();
    if (!canSeeAllRecords(user.role)) {
      const scoped = scopeManagerId(user.role, user.id);
      const items = await prisma.lead.findMany({
        where: { managerId: scoped, slaBreachedAt: { not: null }, processedAt: null },
        include: { contact: { select: { id: true, firstName: true, lastName: true, phoneDisplay: true } }, manager: { select: { name: true } } },
        orderBy: { slaBreachedAt: "asc" },
        take: 100,
      });
      return NextResponse.json({ settings: await getSlaSettings(prisma), items });
    }
    const items = await prisma.lead.findMany({
      where: { slaBreachedAt: { not: null }, processedAt: null },
      include: { contact: { select: { id: true, firstName: true, lastName: true, phoneDisplay: true } }, manager: { select: { name: true } } },
      orderBy: { slaBreachedAt: "asc" },
      take: 200,
    });
    return NextResponse.json({ settings: await getSlaSettings(prisma), items });
  } catch (err) {
    return jsonError(err);
  }
}

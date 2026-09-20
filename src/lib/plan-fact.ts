import type { PrismaClient } from "@prisma/client";
import { startOfMonth, endOfMonth } from "date-fns";

export async function planFact(db: PrismaClient, year: number, month: number) {
  const from = startOfMonth(new Date(year, month - 1, 1));
  const to = endOfMonth(from);
  const quotas = await db.salesQuota.findMany({
    where: { year, month },
    include: { manager: { select: { id: true, name: true, email: true } } },
  });
  const managers = await db.user.findMany({
    where: { role: { in: ["MANAGER", "OPERATOR"] }, isActive: true },
    select: { id: true, name: true, email: true },
  });
  const rows = [];
  for (const manager of managers) {
    const quota = quotas.find((q) => q.managerId === manager.id);
    const [leads, won] = await Promise.all([
      db.lead.count({ where: { managerId: manager.id, createdAt: { gte: from, lte: to } } }),
      db.contact.aggregate({
        where: { managerId: manager.id, status: "WON", closedAt: { gte: from, lte: to } },
        _sum: { dealAmount: true },
        _count: true,
      }),
    ]);
    const revenue = Number(won._sum.dealAmount || 0);
    const leadTarget = quota?.leadTarget || 0;
    const revenueTarget = Number(quota?.revenueTarget || 0);
    rows.push({
      managerId: manager.id,
      name: manager.name,
      email: manager.email,
      leads,
      leadTarget,
      leadPct: leadTarget ? Math.round((leads / leadTarget) * 100) : 0,
      sales: won._count,
      revenue,
      revenueTarget,
      revenuePct: revenueTarget ? Math.round((revenue / revenueTarget) * 100) : 0,
    });
  }
  return { year, month, rows };
}

export async function funnelConversion(db: PrismaClient, managerId?: string) {
  const stages = await db.pipelineStage.findMany({
    where: { pipeline: { isDefault: true }, isActive: true },
    orderBy: { order: "asc" },
  });
  const rows = [];
  let previous = 0;
  for (const [idx, stage] of stages.entries()) {
    const count = await db.contact.count({
      where: {
        archivedAt: null,
        pipelineStageId: stage.id,
        ...(managerId ? { managerId } : {}),
      },
    });
    const conversion = idx === 0 || previous === 0 ? 100 : Math.round((count / previous) * 100);
    rows.push({ id: stage.id, name: stage.name, slug: stage.slug, count, conversion });
    previous = count || previous;
  }
  return rows;
}

import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { countFollowUpQueue } from "./follow-ups";
import { canSeeAllRecords, type Role } from "./rbac";

export type DateRange = { from: Date; to: Date };

export function rangeFromPreset(preset: string, from?: string, to?: string): DateRange {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (preset === "custom" && from && to) {
    return { from: new Date(from), to: new Date(to) };
  }
  if (preset === "yesterday") {
    const y = startOfDay(now);
    y.setDate(y.getDate() - 1);
    const end = new Date(y);
    end.setDate(end.getDate() + 1);
    return { from: y, to: end };
  }
  if (preset === "week") {
    const fromD = startOfDay(now);
    fromD.setDate(fromD.getDate() - 7);
    return { from: fromD, to: now };
  }
  if (preset === "month") {
    const fromD = startOfDay(now);
    fromD.setDate(fromD.getDate() - 30);
    return { from: fromD, to: now };
  }
  return { from: startOfDay(now), to: now };
}

export async function dashboardStats(user: { id: string; role: Role }) {
  const today = rangeFromPreset("today");
  const managerFilter = canSeeAllRecords(user.role) ? {} : { managerId: user.id };
  const [
    newLeads,
    unprocessed,
    callsToday,
    missed,
    tasksOpen,
    overdue,
    demos,
    sales,
    unreadWa,
    activeClients,
    onlineManagers,
    needsFollowUp,
  ] = await Promise.all([
    prisma.lead.count({ where: { ...managerFilter, createdAt: { gte: today.from } } }),
    prisma.lead.count({ where: { ...managerFilter, processedAt: null } }),
    prisma.call.count({ where: { ...managerFilter, startedAt: { gte: today.from } } }),
    prisma.call.count({
      where: { ...managerFilter, startedAt: { gte: today.from }, status: { in: ["MISSED", "NO_ANSWER"] } },
    }),
    prisma.task.count({ where: { ...managerFilter, status: "OPEN" } }),
    prisma.task.count({ where: { ...managerFilter, status: "OPEN", dueAt: { lt: new Date() } } }),
    prisma.meeting.count({
      where: { ...managerFilter, startsAt: { gte: today.from }, status: "SCHEDULED" },
    }),
    prisma.contact.count({
      where: { ...managerFilter, status: "WON", updatedAt: { gte: today.from } },
    }),
    prisma.conversation.aggregate({
      where: managerFilter,
      _sum: { unreadCount: true },
    }),
    prisma.contact.count({ where: { ...managerFilter, status: { in: ["NEW", "IN_PROGRESS"] } } }),
    prisma.user.count({
      where: {
        isActive: true,
        lastSeenAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
    }),
    countFollowUpQueue(prisma, canSeeAllRecords(user.role) ? undefined : user.id),
  ]);

  const won = await prisma.contact.aggregate({
    where: { ...managerFilter, status: "WON", updatedAt: { gte: today.from } },
    _sum: { dealAmount: true },
    _count: true,
  });
  const leadsTotal = await prisma.lead.count({ where: { ...managerFilter, createdAt: { gte: today.from } } });
  const conversion = leadsTotal ? Number(won._count) / leadsTotal : 0;

  return {
    newLeads,
    unprocessed,
    callsToday,
    missed,
    tasksOpen,
    overdue,
    needsFollowUp,
    demos,
    sales,
    unreadWa: unreadWa._sum.unreadCount || 0,
    activeClients,
    onlineManagers,
    conversion,
    salesAmount: Number(won._sum.dealAmount || 0),
  };
}

export async function analytics(range: DateRange, managerId?: string) {
  const filter = managerId ? { managerId } : {};
  const created = { gte: range.from, lte: range.to };
  const [newLeads, processed, calls, missed, conversations, demos, salesAgg, talk] = await Promise.all([
    prisma.lead.count({ where: { ...filter, createdAt: created } }),
    prisma.lead.count({ where: { ...filter, processedAt: { not: null, gte: range.from, lte: range.to } } }),
    prisma.call.count({ where: { ...filter, startedAt: created } }),
    prisma.call.count({
      where: { ...filter, startedAt: created, status: { in: ["MISSED", "NO_ANSWER"] } },
    }),
    prisma.conversation.count({ where: { ...filter, createdAt: created } }),
    prisma.meeting.count({ where: { ...filter, startsAt: created } }),
    prisma.contact.aggregate({
      where: { ...filter, status: "WON", updatedAt: created },
      _sum: { dealAmount: true },
      _count: true,
    }),
    prisma.call.aggregate({
      where: { ...filter, startedAt: created, status: "ANSWERED" },
      _avg: { duration: true },
    }),
  ]);
  const conversion = newLeads ? Number(salesAgg._count) / newLeads : 0;
  const salesAmount = Number(salesAgg._sum.dealAmount || 0);
  const avgCheck = salesAgg._count ? salesAmount / salesAgg._count : 0;
  const responseTime = await avgResponseSeconds(range, managerId);

  const byDay = await prisma.$queryRaw<Array<{ day: Date; count: bigint }>>(
    Prisma.sql`SELECT date_trunc('day', "createdAt") as day, count(*)::bigint as count
               FROM "Lead" WHERE "createdAt" >= ${range.from} AND "createdAt" <= ${range.to}
               ${managerId ? Prisma.sql`AND "managerId" = ${managerId}` : Prisma.empty}
               GROUP BY 1 ORDER BY 1`,
  );
  const bySource = await prisma.contact.groupBy({
    by: ["source"],
    where: { ...filter, createdAt: created },
    _count: true,
  });
  const salesByDay = await prisma.$queryRaw<Array<{ day: Date; amount: unknown }>>(
    Prisma.sql`SELECT date_trunc('day', "updatedAt") as day, coalesce(sum("dealAmount"),0) as amount
               FROM "Contact" WHERE status = 'WON' AND "updatedAt" >= ${range.from} AND "updatedAt" <= ${range.to}
               ${managerId ? Prisma.sql`AND "managerId" = ${managerId}` : Prisma.empty}
               GROUP BY 1 ORDER BY 1`,
  );

  return {
    newLeads,
    processed,
    calls,
    missed,
    conversations,
    demos,
    sales: salesAgg._count,
    conversion,
    salesAmount,
    avgCheck,
    avgTalk: talk._avg.duration || 0,
    avgResponseSeconds: responseTime,
    byDay: byDay.map((d) => ({ day: d.day, count: Number(d.count) })),
    bySource,
    salesByDay: salesByDay.map((d) => ({ day: d.day, amount: Number(d.amount) })),
  };
}

/**
 * Response time = seconds between an inbound WhatsApp message and the first
 * outbound message that follows it in the same conversation.
 */
export async function avgResponseSeconds(range: DateRange, managerId?: string) {
  const rows = await prisma.$queryRaw<Array<{ avg: number | null }>>(
    Prisma.sql`
      SELECT avg(EXTRACT(EPOCH FROM (reply."sentAt" - inbound."sentAt")))::float AS avg
      FROM "Message" inbound
      CROSS JOIN LATERAL (
        SELECT m."sentAt"
        FROM "Message" m
        WHERE m."conversationId" = inbound."conversationId"
          AND m.direction = 'OUTBOUND'
          AND m."sentAt" > inbound."sentAt"
        ORDER BY m."sentAt"
        LIMIT 1
      ) reply
      WHERE inbound.direction = 'INBOUND'
        AND inbound."sentAt" >= ${range.from}
        AND inbound."sentAt" <= ${range.to}
        ${managerId ? Prisma.sql`AND inbound."managerId" = ${managerId}` : Prisma.empty}
    `,
  );
  return Math.round(rows[0]?.avg || 0);
}

export async function managerTable(range: DateRange) {
  const managers = await prisma.user.findMany({
    where: { role: { in: ["MANAGER", "OPERATOR"] } },
    orderBy: { name: "asc" },
  });
  const rows = [];
  for (const m of managers) {
    const stats = await analytics(range, m.id);
    rows.push({
      id: m.id,
      name: m.name,
      email: m.email,
      isActive: m.isActive,
      acceptsNewLeads: m.acceptsNewLeads,
      isOnline: m.isOnline,
      sipExtension: m.sipExtension,
      lastSeenAt: m.lastSeenAt,
      ...stats,
    });
  }
  return rows;
}

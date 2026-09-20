import type { PrismaClient } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";
import { listFollowUpQueue } from "./follow-ups";

export async function myDay(db: PrismaClient, managerId?: string) {
  const from = startOfDay(new Date());
  const to = endOfDay(new Date());
  const scope = managerId ? { managerId } : {};
  const [tasks, meetings, slaLeads, followUps] = await Promise.all([
    db.task.findMany({
      where: { ...scope, status: "OPEN", dueAt: { lte: to } },
      include: { contact: { select: { id: true, firstName: true, lastName: true, phoneDisplay: true } } },
      orderBy: { dueAt: "asc" },
      take: 40,
    }),
    db.meeting.findMany({
      where: { ...scope, status: "SCHEDULED", startsAt: { gte: from, lte: to } },
      include: { contact: { select: { id: true, firstName: true, lastName: true, phoneDisplay: true } } },
      orderBy: { startsAt: "asc" },
      take: 20,
    }),
    db.lead.findMany({
      where: { ...scope, slaBreachedAt: { not: null }, processedAt: null },
      include: { contact: { select: { id: true, firstName: true, lastName: true, phoneDisplay: true } } },
      take: 20,
    }),
    listFollowUpQueue(db, managerId).then((rows) => rows.slice(0, 15)),
  ]);
  return { tasks, meetings, slaLeads, followUps };
}

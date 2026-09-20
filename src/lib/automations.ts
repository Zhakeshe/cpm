import type { PrismaClient } from "@prisma/client";
import { addDays } from "date-fns";
import { notifyUser } from "./notifications";

export async function runAutomations(db: PrismaClient) {
  const rules = await db.automationRule.findMany({ where: { enabled: true } });
  let created = 0;
  for (const rule of rules) {
    const cutoff = addDays(new Date(), -rule.staleDays);
    const stale = await db.contact.findMany({
      where: {
        archivedAt: null,
        status: { in: ["NEW", "IN_PROGRESS"] },
        OR: [{ lastContactAt: null }, { lastContactAt: { lte: cutoff } }],
        tasks: { none: { status: "OPEN" } },
      },
      take: 50,
    });
    for (const contact of stale) {
      if (!contact.managerId) continue;
      if (rule.action === "CREATE_TASK") {
        await db.task.create({
          data: {
            contactId: contact.id,
            managerId: contact.managerId,
            type: rule.taskType as "FOLLOW_UP",
            description: `${rule.name}: ${contact.firstName} ${contact.phoneDisplay}`,
            dueAt: new Date(),
          },
        });
        created += 1;
      }
      if (rule.action === "NOTIFY" || rule.action === "CREATE_TASK") {
        await notifyUser(db, {
          userId: contact.managerId,
          type: "OVERDUE_TASK",
          title: rule.name,
          body: contact.phoneDisplay,
          data: { contactId: contact.id, ruleId: rule.id },
        });
      }
    }
  }
  return { created };
}

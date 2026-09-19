import type { PrismaClient } from "@prisma/client";
import { nextManager } from "./contacts";
import { notifyAdmins, notifyUser } from "./notifications";

export type SlaSettings = {
  enabled: boolean;
  minutes: number;
  action: "NOTIFY_MANAGER" | "NOTIFY_ADMIN" | "REASSIGN";
};

export const defaultSla: SlaSettings = {
  enabled: false,
  minutes: 10,
  action: "NOTIFY_MANAGER",
};

export async function getSlaSettings(db: PrismaClient): Promise<SlaSettings> {
  const row = await db.systemSetting.findUnique({ where: { key: "lead_sla" } });
  if (!row) return defaultSla;
  return { ...defaultSla, ...(row.value as object) };
}

export async function applyLeadSla(db: PrismaClient) {
  const sla = await getSlaSettings(db);
  if (!sla.enabled) return { processed: 0 };
  const cutoff = new Date(Date.now() - sla.minutes * 60 * 1000);
  const stale = await db.lead.findMany({
    where: { processedAt: null, slaBreachedAt: null, createdAt: { lte: cutoff } },
    include: { contact: true, manager: true },
  });
  for (const lead of stale) {
    await db.lead.update({ where: { id: lead.id }, data: { slaBreachedAt: new Date() } });
    if (sla.action === "NOTIFY_MANAGER" && lead.managerId) {
      await notifyUser(db, {
        userId: lead.managerId,
        type: "LEAD_REASSIGNED",
        title: "SLA: лид не обработан",
        body: lead.contact.phoneDisplay,
        data: { leadId: lead.id, contactId: lead.contactId },
      });
    }
    if (sla.action === "NOTIFY_ADMIN") {
      await notifyAdmins(db, {
        type: "LEAD_REASSIGNED",
        title: "SLA: лид не обработан",
        body: `${lead.contact.phoneDisplay} / ${lead.manager?.name || "без менеджера"}`,
        data: { leadId: lead.id },
      });
    }
    if (sla.action === "REASSIGN") {
      const next = await nextManager(db);
      if (next && next.id !== lead.managerId) {
        await db.lead.update({ where: { id: lead.id }, data: { managerId: next.id, slaBreachedAt: new Date() } });
        await db.contact.update({ where: { id: lead.contactId }, data: { managerId: next.id } });
        if (lead.managerId) {
          await notifyUser(db, {
            userId: lead.managerId,
            type: "LEAD_REASSIGNED",
            title: "Лид перераспределён по SLA",
            body: lead.contact.phoneDisplay,
            data: { leadId: lead.id },
          });
        }
        await notifyUser(db, {
          userId: next.id,
          type: "LEAD_REASSIGNED",
          title: "Вам передан лид (SLA)",
          body: lead.contact.phoneDisplay,
          data: { leadId: lead.id, contactId: lead.contactId },
        });
      }
    }
  }
  return { processed: stale.length };
}

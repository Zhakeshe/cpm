import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedBaseline } from "./helpers";
import { ingestContact } from "../../src/lib/contacts";
import { applyLeadSla } from "../../src/lib/sla";
import { searchContacts } from "../../src/lib/search";
import { scopeManagerId } from "../../src/lib/rbac";

describe("SLA, поиск и доступ", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedBaseline(2);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("передаёт необработанный лид следующему менеджеру при включённом SLA", async () => {
    await prisma.systemSetting.upsert({
      where: { key: "lead_sla" },
      create: { key: "lead_sla", value: { enabled: true, minutes: 10, action: "REASSIGN" } },
      update: { value: { enabled: true, minutes: 10, action: "REASSIGN" } },
    });
    const created = await ingestContact(prisma, { phone: "77470000030", source: "WHATSAPP" });
    await prisma.lead.updateMany({
      where: { contactId: created.contactId },
      data: { createdAt: new Date(Date.now() - 60 * 60 * 1000) },
    });

    const result = await applyLeadSla(prisma);
    expect(result.processed).toBe(1);

    const lead = await prisma.lead.findFirstOrThrow({ where: { contactId: created.contactId } });
    expect(lead.managerId).not.toBe(created.managerId);
    expect(lead.slaBreachedAt).not.toBeNull();

    const contact = await prisma.contact.findUniqueOrThrow({ where: { id: created.contactId } });
    expect(contact.managerId).toBe(lead.managerId);
  });

  it("не трогает лиды при выключенном SLA", async () => {
    await prisma.systemSetting.upsert({
      where: { key: "lead_sla" },
      create: { key: "lead_sla", value: { enabled: false, minutes: 10, action: "REASSIGN" } },
      update: { value: { enabled: false, minutes: 10, action: "REASSIGN" } },
    });
    const created = await ingestContact(prisma, { phone: "77470000031", source: "WHATSAPP" });
    await prisma.lead.updateMany({
      where: { contactId: created.contactId },
      data: { createdAt: new Date(Date.now() - 60 * 60 * 1000) },
    });

    const result = await applyLeadSla(prisma);
    expect(result.processed).toBe(0);
    const lead = await prisma.lead.findFirstOrThrow({ where: { contactId: created.contactId } });
    expect(lead.managerId).toBe(created.managerId);
  });

  it("находит клиента по телефону в любом формате и ограничивает выдачу менеджеру", async () => {
    const mine = await ingestContact(prisma, {
      phone: "+7 747 123 45 67",
      firstName: "Айгуль",
      source: "MANUAL",
    });
    await prisma.contact.update({ where: { id: mine.contactId }, data: { managerId: "mgr-1" } });
    const other = await ingestContact(prisma, { phone: "77470000040", firstName: "Чужой", source: "MANUAL" });
    await prisma.contact.update({ where: { id: other.contactId }, data: { managerId: "mgr-2" } });

    const asAdmin = await searchContacts("+7 (747) 123-45-67", scopeManagerId("ADMIN", "admin-1"));
    expect(asAdmin.map((c) => c.id)).toContain(mine.contactId);

    const asOtherManager = await searchContacts("77471234567", scopeManagerId("MANAGER", "mgr-2"));
    expect(asOtherManager).toHaveLength(0);

    const byName = await searchContacts("Айгуль", scopeManagerId("MANAGER", "mgr-1"));
    expect(byName.map((c) => c.id)).toEqual([mine.contactId]);
  });
});

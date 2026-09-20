import { beforeEach, afterAll, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedBaseline } from "./helpers";
import { ingestContact, reassignContact } from "../../src/lib/contacts";
import { capturePublicLead } from "../../src/lib/public-leads";
import { mapLeadImportRows, parseCsv } from "../../src/lib/csv";
import { importLeadRows } from "../../src/lib/import-leads";

describe("клиенты и распределение лидов", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedBaseline(3);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("импортирует клиентов из CSV и пропускает дубликаты телефона", async () => {
    const csv = "first_name,phone,source\nАйгуль,+7 747 555 00 01,WEBSITE\nАйгуль,87475550001,WEBSITE\nДамир,77475550002,MANUAL\n";
    const mapped = mapLeadImportRows(parseCsv(csv));
    const result = await importLeadRows(prisma, mapped.rows, { id: "admin-1", role: "ADMIN" });
    expect(result.created).toBe(2);
    expect(result.duplicates).toBe(1);
    expect(await prisma.contact.count()).toBe(2);
  });

  it("принимает заявку с публичной формы и ставит в очередь менеджеру", async () => {
    const ingest = await capturePublicLead(prisma, {
      firstName: "Аружан",
      phone: "+7 747 900 11 22",
      comment: "Хочу консультацию",
      campaign: "instagram",
    });
    expect(ingest.createdContact).toBe(true);
    expect(ingest.managerId).toBe("mgr-1");
    const contact = await prisma.contact.findUniqueOrThrow({ where: { id: ingest.contactId } });
    expect(contact.source).toBe("WEBSITE");
    expect(contact.firstName).toBe("Аружан");
    const note = await prisma.notification.findFirst({ where: { userId: "mgr-1", type: "NEW_LEAD" } });
    expect(note?.title).toContain("форм");
  });

  it("создаёт клиента, лид и назначает менеджера по round-robin", async () => {
    const first = await ingestContact(prisma, { phone: "+7 747 111 22 33", source: "WHATSAPP" });
    const second = await ingestContact(prisma, { phone: "+7 747 111 22 34", source: "WHATSAPP" });
    const third = await ingestContact(prisma, { phone: "+7 747 111 22 35", source: "WHATSAPP" });
    const fourth = await ingestContact(prisma, { phone: "+7 747 111 22 36", source: "WHATSAPP" });

    expect([first, second, third, fourth].every((r) => r.createdContact)).toBe(true);
    expect([first.managerId, second.managerId, third.managerId, fourth.managerId]).toEqual([
      "mgr-1",
      "mgr-2",
      "mgr-3",
      "mgr-1",
    ]);
    expect(await prisma.lead.count()).toBe(4);
  });

  it("не создаёт дубликат по телефону в другом формате", async () => {
    await ingestContact(prisma, { phone: "+7 747 123 45 67", source: "WHATSAPP" });
    const again = await ingestContact(prisma, { phone: "87471234567", source: "PHONE_CALL" });

    expect(again.duplicate).toBe(true);
    expect(again.createdContact).toBe(false);
    expect(await prisma.contact.count()).toBe(1);
  });

  it("оставляет прежнего ответственного у вернувшегося клиента", async () => {
    const first = await ingestContact(prisma, { phone: "77471234567", source: "WHATSAPP" });
    await ingestContact(prisma, { phone: "77470000001", source: "WHATSAPP" });
    const returning = await ingestContact(prisma, { phone: "77471234567", source: "WHATSAPP" });

    expect(returning.managerId).toBe(first.managerId);
    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77471234567" } });
    expect(contact.managerId).toBe(first.managerId);
  });

  it("переназначает вернувшегося клиента, если аккаунт менеджера закрыт", async () => {
    const first = await ingestContact(prisma, { phone: "77470000050", source: "WHATSAPP" });
    expect(first.managerId).toBe("mgr-1");
    await prisma.user.update({ where: { id: "mgr-1" }, data: { isActive: false, acceptsNewLeads: false, isOnline: false } });

    const returning = await ingestContact(prisma, { phone: "77470000050", source: "WHATSAPP" });
    expect(returning.duplicate).toBe(true);
    expect(returning.managerId).not.toBe("mgr-1");
    expect(["mgr-2", "mgr-3"]).toContain(returning.managerId);

    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77470000050" } });
    expect(contact.managerId).toBe(returning.managerId);
  });

  it("исключает менеджера с выключенным приёмом лидов и неактивного", async () => {
    await prisma.user.update({ where: { id: "mgr-2" }, data: { acceptsNewLeads: false } });
    await prisma.user.update({ where: { id: "mgr-3" }, data: { isActive: false } });

    const a = await ingestContact(prisma, { phone: "77470000010", source: "WHATSAPP" });
    const b = await ingestContact(prisma, { phone: "77470000011", source: "WHATSAPP" });

    expect(a.managerId).toBe("mgr-1");
    expect(b.managerId).toBe("mgr-1");
  });

  it("пишет смену ответственного в audit log и историю клиента", async () => {
    const created = await ingestContact(prisma, { phone: "77470000020", source: "MANUAL" });
    await reassignContact(prisma, {
      contactId: created.contactId,
      toUserId: "mgr-3",
      actorId: "admin-1",
      ip: "10.0.0.1",
    });

    const contact = await prisma.contact.findUniqueOrThrow({ where: { id: created.contactId } });
    expect(contact.managerId).toBe("mgr-3");

    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "contact.reassign" } });
    expect(audit.oldValue).toMatchObject({ managerId: created.managerId });
    expect(audit.newValue).toMatchObject({ managerId: "mgr-3" });
    expect(audit.ip).toBe("10.0.0.1");

    const activity = await prisma.activity.findFirst({
      where: { contactId: created.contactId, type: "MANAGER_ASSIGNED" },
      orderBy: { createdAt: "desc" },
    });
    expect(activity?.title).toContain("изменён");
  });
});

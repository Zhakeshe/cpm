import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedBaseline } from "./helpers";
import { ingestContact } from "../../src/lib/contacts";
import { runReminders } from "../../src/lib/reminders";
import { assertStageRequirements, MissingStageFieldsError } from "../../src/lib/pipeline-rules";

describe("напоминания и правила стадий", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedBaseline(2);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("шлёт напоминание по задаче один раз", async () => {
    const contact = await ingestContact(prisma, { phone: "77470000201", source: "MANUAL" });
    await prisma.task.create({
      data: {
        contactId: contact.contactId,
        managerId: "mgr-1",
        type: "CALL",
        description: "Перезвонить клиенту",
        dueAt: new Date(Date.now() + 30 * 60 * 1000),
        reminderAt: new Date(Date.now() - 60 * 1000),
      },
    });

    const first = await runReminders(prisma);
    expect(first.taskReminders).toBe(1);

    const second = await runReminders(prisma);
    expect(second.taskReminders).toBe(0);

    const notifications = await prisma.notification.findMany({ where: { title: "Напоминание по задаче" } });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].userId).toBe("mgr-1");
  });

  it("уведомляет о просроченной задаче однократно", async () => {
    const contact = await ingestContact(prisma, { phone: "77470000202", source: "MANUAL" });
    await prisma.task.create({
      data: {
        contactId: contact.contactId,
        managerId: "mgr-2",
        type: "FOLLOW_UP",
        description: "Отправить КП",
        dueAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    });

    await runReminders(prisma);
    await runReminders(prisma);

    const overdue = await prisma.notification.findMany({ where: { type: "OVERDUE_TASK" } });
    expect(overdue).toHaveLength(1);
    expect(overdue[0].userId).toBe("mgr-2");
  });

  it("предупреждает о демо за полчаса, но не о завтрашнем", async () => {
    const contact = await ingestContact(prisma, { phone: "77470000203", source: "MANUAL" });
    await prisma.meeting.create({
      data: {
        contactId: contact.contactId,
        managerId: "mgr-1",
        startsAt: new Date(Date.now() + 20 * 60 * 1000),
      },
    });
    await prisma.meeting.create({
      data: {
        contactId: contact.contactId,
        managerId: "mgr-1",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const result = await runReminders(prisma);
    expect(result.meetingReminders).toBe(1);

    const notifications = await prisma.notification.findMany({ where: { type: "MEETING_ASSIGNED" } });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toContain("Демо через");
  });

  it("не пускает клиента на стадию без обязательных полей", async () => {
    const stage = await prisma.pipelineStage.findFirstOrThrow({ where: { slug: "paid" } });
    await prisma.pipelineStage.update({
      where: { id: stage.id },
      data: { requiredFields: ["dealAmount", "email"] },
    });
    const created = await ingestContact(prisma, { phone: "77470000204", source: "MANUAL" });
    const contact = await prisma.contact.findUniqueOrThrow({ where: { id: created.contactId } });

    await expect(assertStageRequirements(prisma, stage.id, contact)).rejects.toBeInstanceOf(MissingStageFieldsError);

    try {
      await assertStageRequirements(prisma, stage.id, contact);
    } catch (err) {
      expect((err as MissingStageFieldsError).fields).toEqual(["dealAmount", "email"]);
    }

    const filled = { ...contact, dealAmount: 150000, email: "client@example.com" };
    await expect(assertStageRequirements(prisma, stage.id, filled)).resolves.toBeUndefined();
  });

  it("принимает значение обязательного поля из custom fields", async () => {
    const stage = await prisma.pipelineStage.findFirstOrThrow({ where: { slug: "contacted" } });
    await prisma.pipelineStage.update({ where: { id: stage.id }, data: { requiredFields: ["inn"] } });
    const created = await ingestContact(prisma, { phone: "77470000205", source: "MANUAL" });
    const contact = await prisma.contact.findUniqueOrThrow({ where: { id: created.contactId } });

    await expect(assertStageRequirements(prisma, stage.id, contact)).rejects.toThrow("STAGE_FIELDS_REQUIRED");
    await expect(
      assertStageRequirements(prisma, stage.id, { ...contact, customFields: { inn: "123456789" } }),
    ).resolves.toBeUndefined();
  });
});

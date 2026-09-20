import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedBaseline } from "./helpers";
import { ingestContact } from "../../src/lib/contacts";
import { addContactNote, applyContactStage, OutcomeReasonRequiredError } from "../../src/lib/outcomes";

describe("закрытие сделки и заметки", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedBaseline(1);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("не даёт закрыть отказ без причины и пишет причину в карточку", async () => {
    const pipeline = await prisma.pipeline.findFirstOrThrow();
    const lost = await prisma.pipelineStage.create({
      data: { pipelineId: pipeline.id, slug: "lost", name: "Отказ", order: 9, isLost: true },
    });
    const created = await ingestContact(prisma, { phone: "77470000901", firstName: "Марат", source: "MANUAL" });
    const contact = await prisma.contact.findUniqueOrThrow({ where: { id: created.contactId } });

    await expect(
      applyContactStage(prisma, {
        contactId: contact.id,
        fromStageId: contact.pipelineStageId,
        toStageId: lost.id,
        actorId: "mgr-1",
        contactForRules: contact,
      }),
    ).rejects.toBeInstanceOf(OutcomeReasonRequiredError);

    const closed = await applyContactStage(prisma, {
      contactId: contact.id,
      fromStageId: contact.pipelineStageId,
      toStageId: lost.id,
      actorId: "mgr-1",
      outcomeReason: "price",
      contactForRules: contact,
    });
    expect(closed?.status).toBe("LOST");
    expect(closed?.outcomeReason).toBe("price");
    expect(closed?.closedAt).toBeTruthy();
    const activity = await prisma.activity.findFirst({ where: { contactId: contact.id, type: "STAGE_CHANGED" }, orderBy: { createdAt: "desc" } });
    expect(activity?.title).toContain("проиграна");
  });

  it("кладёт заметку менеджера в историю", async () => {
    const created = await ingestContact(prisma, { phone: "77470000902", firstName: "Аян", source: "WEBSITE" });
    const note = await addContactNote(prisma, { contactId: created.contactId, managerId: "mgr-1", text: "  Перезвонить после обеда  " });
    expect(note.type).toBe("NOTE");
    expect(note.title).toBe("Перезвонить после обеда");
  });
});

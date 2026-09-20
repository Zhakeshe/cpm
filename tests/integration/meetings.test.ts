import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedBaseline } from "./helpers";
import { ingestContact } from "../../src/lib/contacts";
import { bookDemo, SlotTakenError } from "../../src/lib/meetings";
import { slotFromAlmaty } from "../../src/lib/demo-slots";

describe("демо слоты", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedBaseline(1);
    const pipeline = await prisma.pipeline.findFirstOrThrow();
    await prisma.pipelineStage.create({
      data: { pipelineId: pipeline.id, slug: "demo", name: "Записан на демо", order: 4 },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("автоматты слот қояды, қайталамайды және клиентті демо сатысына жылжытады", async () => {
    const created = await ingestContact(prisma, { phone: "77470000801", firstName: "Дина", source: "WEBSITE" });
    const now = new Date("2026-09-21T03:00:00.000Z");
    const first = await bookDemo(prisma, {
      managerId: "mgr-1",
      creatorId: "mgr-1",
      contactId: created.contactId,
      auto: true,
      now,
    });
    expect(first.startsAt.toISOString()).toBe(slotFromAlmaty(2026, 8, 21, 10, 0).toISOString());

    await expect(
      bookDemo(prisma, {
        managerId: "mgr-1",
        creatorId: "mgr-1",
        startsAt: first.startsAt,
        now,
      }),
    ).rejects.toBeInstanceOf(SlotTakenError);

    const contact = await prisma.contact.findUniqueOrThrow({
      where: { id: created.contactId },
      include: { pipelineStage: true },
    });
    expect(contact.pipelineStage?.slug).toBe("demo");
  });
});

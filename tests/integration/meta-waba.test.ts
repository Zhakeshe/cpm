import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase } from "./helpers";
import { upsertTemplatesFromMeta } from "../../src/lib/meta-waba";

describe("синхронизация шаблонов Meta", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("создаёт шаблон из Graph и не трогает локальный черновик", async () => {
    await prisma.messageTemplate.create({
      data: {
        name: "Локальный",
        metaName: "local_only",
        language: "ru",
        body: "черновик",
        status: "PENDING",
      },
    });

    const first = await upsertTemplatesFromMeta(prisma, [
      {
        name: "hello_world",
        language: "en_US",
        status: "APPROVED",
        category: "UTILITY",
        components: [{ type: "BODY", text: "Welcome {{1}}" }],
      },
    ]);
    expect(first).toEqual({ created: 1, updated: 0, total: 1 });

    const second = await upsertTemplatesFromMeta(prisma, [
      {
        name: "hello_world",
        language: "en_US",
        status: "PENDING",
        category: "UTILITY",
        components: [{ type: "BODY", text: "Welcome {{1}}" }],
      },
    ]);
    expect(second.updated).toBe(1);

    const hello = await prisma.messageTemplate.findUniqueOrThrow({
      where: { metaName_language: { metaName: "hello_world", language: "en_US" } },
    });
    expect(hello.status).toBe("PENDING");
    expect(hello.isActive).toBe(false);
    expect(await prisma.messageTemplate.count()).toBe(2);
  });
});

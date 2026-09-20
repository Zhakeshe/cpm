import { PrismaClient } from "@prisma/client";
import { VACUUM_PIPELINE_STAGES } from "../src/lib/pipeline-defaults";

const prisma = new PrismaClient();

/** Wipes demo/test contacts and retunes the vacuum funnel. Keeps users, catalog, Wazzup. */
async function main() {
  await prisma.call.deleteMany();
  await prisma.task.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.contact.deleteMany();

  const pipeline = await prisma.pipeline.upsert({
    where: { id: "default" },
    update: { name: "Пылесосы Quantum" },
    create: { id: "default", name: "Пылесосы Quantum", isDefault: true },
  });

  for (const s of VACUUM_PIPELINE_STAGES) {
    await prisma.pipelineStage.upsert({
      where: { pipelineId_slug: { pipelineId: pipeline.id, slug: s.slug } },
      update: {
        name: s.name,
        order: s.order,
        isWon: Boolean(s.isWon),
        isLost: Boolean(s.isLost),
        requiredFields: s.requiredFields,
        isActive: true,
      },
      create: {
        pipelineId: pipeline.id,
        slug: s.slug,
        name: s.name,
        order: s.order,
        isWon: Boolean(s.isWon),
        isLost: Boolean(s.isLost),
        requiredFields: s.requiredFields,
      },
    });
  }

  console.log("sales_data_reset", { stages: VACUUM_PIPELINE_STAGES.length });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

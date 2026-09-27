import { PrismaClient } from "@prisma/client";
import { ensureVacuumPipeline, VACUUM_PIPELINE_STAGES } from "../src/lib/pipeline-defaults";

const prisma = new PrismaClient();

/** Wipes demo/test contacts and retunes the vacuum funnel. Keeps users, catalog, Wazzup. */
async function main() {
  await prisma.call.deleteMany();
  await prisma.task.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.contact.deleteMany();

  await ensureVacuumPipeline(prisma);

  console.log("sales_data_reset", { stages: VACUUM_PIPELINE_STAGES.length });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedVacuumCatalog } from "../src/lib/catalog";
import { ensureVacuumPipeline } from "../src/lib/pipeline-defaults";
import { ensureTrackingChannels } from "../src/lib/tracking";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const managerHash = await bcrypt.hash("Manager123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@crm.local" },
    update: {},
    create: {
      email: "admin@crm.local",
      name: "Руководитель",
      passwordHash,
      role: Role.ADMIN,
      sipExtension: "100",
    },
  });

  const names = ["Айдана", "Данияр", "Алия", "Нурлан", "Сауле"];
  const managers = [];
  for (let i = 0; i < names.length; i++) {
    const email = `manager${i + 1}@crm.local`;
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: names[i],
        passwordHash: managerHash,
        role: Role.MANAGER,
        sipExtension: String(101 + i),
        acceptsNewLeads: true,
      },
    });
    managers.push(u);
  }

  await ensureVacuumPipeline(prisma);

  await prisma.managerAssignmentState.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", lastManagerId: managers[0]?.id },
  });

  await prisma.integration.upsert({
    where: { type: "WHATSAPP_BUSINESS" },
    update: {},
    create: { type: "WHATSAPP_BUSINESS", status: "DISCONNECTED" },
  });
  await prisma.integration.upsert({
    where: { type: "TELEPHONY" },
    update: {},
    create: { type: "TELEPHONY", status: "DISCONNECTED" },
  });
  await prisma.integration.upsert({
    where: { type: "META_LEADS" },
    update: {},
    create: { type: "META_LEADS", status: "DISCONNECTED" },
  });
  await prisma.integration.upsert({
    where: { type: "WAZZUP" },
    update: {},
    create: { type: "WAZZUP", status: "DISCONNECTED" },
  });

  await prisma.systemSetting.upsert({
    where: { key: "lead_sla" },
    update: {},
    create: { key: "lead_sla", value: { enabled: false, minutes: 10, action: "NOTIFY_MANAGER" } },
  });
  await prisma.systemSetting.upsert({
    where: { key: "call_routing" },
    update: {},
    create: {
      key: "call_routing",
      value: { existingContact: "responsible", fallback: "queue" },
    },
  });

  await prisma.messageTemplate.upsert({
    where: { metaName_language: { metaName: "consultation_followup", language: "ru" } },
    update: {},
    create: {
      name: "Продолжение консультации",
      metaName: "consultation_followup",
      language: "ru",
      category: "MARKETING",
      body: "Здравствуйте, {{1}}. Ранее вы обращались к нам. Хотите продолжить консультацию?",
      placeholders: ["{{1}}"],
      status: "APPROVED",
    },
  });
  await prisma.messageTemplate.upsert({
    where: { metaName_language: { metaName: "demo_reminder", language: "ru" } },
    update: {},
    create: {
      name: "Напоминание о демо",
      metaName: "demo_reminder",
      language: "ru",
      category: "UTILITY",
      body: "{{1}}, напоминаем о демонстрации {{2}}. Подтвердите, пожалуйста, участие.",
      placeholders: ["{{1}}", "{{2}}"],
      status: "APPROVED",
    },
  });

  const quickReplies = [
    { id: "qr-discount", title: "Скидка сейчас", body: "Сейчас действует скидка. Напишите, если готовы оформить — подскажу условия.", sortOrder: 1 },
    { id: "qr-consult", title: "Консультация", body: "Могу кратко рассказать по продукту и ответить на вопросы. Вам удобно сейчас?", sortOrder: 2 },
    { id: "qr-callback", title: "Перезвоним", body: "Хорошо, перезвоним в удобное время. Напишите, когда вам удобно.", sortOrder: 3 },
  ];
  for (const qr of quickReplies) {
    await prisma.quickReply.upsert({
      where: { id: qr.id },
      update: {},
      create: qr,
    });
  }

  await prisma.messageTemplate.upsert({
    where: { metaName_language: { metaName: "sale_now_discount", language: "ru" } },
    update: {},
    create: {
      name: "Скидка сейчас",
      metaName: "sale_now_discount",
      language: "ru",
      category: "MARKETING",
      body: "{{1}}, сейчас действует скидка {{2}}. Напишите, если готовы оформить.",
      placeholders: ["{{1}}", "{{2}}"],
      status: "APPROVED",
    },
  });

  await seedVacuumCatalog(prisma);
  await ensureTrackingChannels(prisma);

  console.log("Seeded", { admin: admin.email, managers: managers.map((m) => m.email) });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

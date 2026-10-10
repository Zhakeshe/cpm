import type { PrismaClient } from "@prisma/client";
import { vacuumDefaults } from "./quotes";

async function mergeLegacyTags(db: PrismaClient, legacyNames: string[], targetName: string, color: string) {
  const target = await db.tag.upsert({
    where: { name: targetName },
    update: { color },
    create: { name: targetName, color },
  });
  const legacy = await db.tag.findMany({
    where: { name: { in: legacyNames }, id: { not: target.id } },
    select: { id: true, contacts: { select: { contactId: true } } },
  });
  const contactIds = [...new Set(legacy.flatMap((tag) => tag.contacts.map((contact) => contact.contactId)))];
  if (contactIds.length) {
    await db.contactTag.createMany({
      data: contactIds.map((contactId) => ({ contactId, tagId: target.id })),
      skipDuplicates: true,
    });
  }
  if (legacy.length) await db.tag.deleteMany({ where: { id: { in: legacy.map((tag) => tag.id) } } });
}

export async function seedVacuumCatalog(db: PrismaClient) {
  for (const product of vacuumDefaults()) {
    await db.product.upsert({
      where: { sku: product.sku },
      update: { name: product.name, price: product.price, description: product.description, category: product.category },
      create: product,
    });
  }
  await mergeLegacyTags(db, ["демо басқа күнге", "Демо шықты", "демо шықты "], "демо шықты ертеңге", "#10b981");
  await db.tag.deleteMany({
    where: {
      name: {
        in: [
          "B2B",
          "b2b",
          "бөліп төлеу",
          "ыстық",
          "кепілдік",
          "қайта қоңырау",
          "демо өтті",
          "бағасын білу",
          "Бағасын білейін",
          "бағасын білейін",
          "бағасын білейін деп едім",
          "Багасын билейин",
          "багасын билейин",
          "потом звондау керек",
          "Потом звондау керек",
          "потом звандау керек",
          "Потом звандау керек",
          "потом зв керек",
        ],
      },
    },
  });
  const tags = [
    { name: "демо шықты", color: "#2563eb" },
    { name: "керек емес", color: "#ef4444" },
    { name: "демо шықты ертеңге", color: "#10b981" },
    { name: "кешке зв", color: "#f472b6" },
  ];
  for (const tag of tags) {
    await db.tag.upsert({ where: { name: tag.name }, update: { color: tag.color }, create: tag });
  }
  const fields = [
    { key: "rooms", name: "Бөлме саны", fieldType: "text", options: [] as string[], required: false },
    { key: "pets", name: "Үй жануары", fieldType: "select", options: ["жоқ", "мысық", "ит", "басқа"], required: false },
    { key: "floor", name: "Еден түрі", fieldType: "select", options: ["ламинат", "кілем", "плитка", "араласты"], required: false },
    { key: "model_interest", name: "Қызыққан модель", fieldType: "select", options: vacuumDefaults().map((p) => p.name), required: false },
    { key: "warranty", name: "Кепілдік", fieldType: "select", options: ["жоқ", "12 ай", "24 ай"], required: false },
  ];
  for (const field of fields) {
    await db.customFieldDef.upsert({
      where: { key: field.key },
      update: { name: field.name, options: field.options, fieldType: field.fieldType },
      create: field,
    });
  }
  const existing = await db.automationRule.count();
  if (!existing) {
    await db.automationRule.create({
      data: { name: "3 күн тиілмесе — қайта қоңырау", enabled: true, staleDays: 3, action: "CREATE_TASK", taskType: "FOLLOW_UP" },
    });
  }
  return { products: vacuumDefaults().length, tags: tags.length, fields: fields.length };
}

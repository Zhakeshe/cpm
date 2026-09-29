import type { PrismaClient } from "@prisma/client";
import { vacuumDefaults } from "./quotes";

export const LEAD_TAGS = [
  { name: "демо шыкты", color: "#2563eb" },
  { name: "керек емес", color: "#64748b" },
  { name: "багасын былейын деп едым", color: "#f59e0b" },
  { name: "Кешке зв", color: "#8b5cf6" },
  { name: "потом звондау керек", color: "#10b981" },
];

export async function seedVacuumCatalog(db: PrismaClient) {
  for (const product of vacuumDefaults()) {
    await db.product.upsert({
      where: { sku: product.sku },
      update: { name: product.name, price: product.price, description: product.description, category: product.category },
      create: product,
    });
  }
  for (const tag of LEAD_TAGS) {
    await db.tag.upsert({ where: { name: tag.name }, update: { color: tag.color }, create: tag });
  }
  await db.tag.deleteMany({ where: { name: { notIn: LEAD_TAGS.map((t) => t.name) } } });
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
  return { products: vacuumDefaults().length, tags: LEAD_TAGS.length, fields: fields.length };
}

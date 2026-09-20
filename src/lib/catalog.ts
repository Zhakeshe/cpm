import type { PrismaClient } from "@prisma/client";
import { vacuumDefaults } from "./quotes";

export async function seedVacuumCatalog(db: PrismaClient) {
  for (const product of vacuumDefaults()) {
    await db.product.upsert({
      where: { sku: product.sku },
      update: { name: product.name, price: product.price, description: product.description, category: product.category },
      create: product,
    });
  }
  const tags = [
    { name: "ыстық", color: "#ef4444" },
    { name: "қайта қоңырау", color: "#f59e0b" },
    { name: "кепілдік", color: "#10b981" },
    { name: "B2B", color: "#6366f1" },
    { name: "бөліп төлеу", color: "#8b5cf6" },
    { name: "демо өтті", color: "#2563eb" },
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

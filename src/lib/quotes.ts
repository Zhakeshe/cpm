import type { Prisma, PrismaClient, QuoteStatus } from "@prisma/client";
import { advanceOpenStage } from "./outcomes";

type Db = PrismaClient | Prisma.TransactionClient;

export type QuoteLine = { productId?: string; title: string; qty: number; unitPrice: number };

export function quoteTotal(items: QuoteLine[]) {
  return items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0), 0);
}

export async function nextQuoteNumber(db: Db) {
  const year = new Date().getFullYear();
  const prefix = `КП-${year}-`;
  const last = await db.quote.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
  });
  const n = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export async function createQuote(
  db: Db,
  params: { contactId: string; managerId: string; note?: string; items: QuoteLine[] },
) {
  if (!params.items.length) throw Object.assign(new Error("QUOTE_ITEMS_REQUIRED"), { status: 400 });
  const total = quoteTotal(params.items);
  const number = await nextQuoteNumber(db);
  const quote = await db.quote.create({
    data: {
      number,
      contactId: params.contactId,
      managerId: params.managerId,
      note: params.note || "",
      total,
      items: {
        create: params.items.map((item) => ({
          productId: item.productId || null,
          title: item.title,
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: { items: true, contact: true, manager: { select: { name: true } } },
  });
  await db.activity.create({
    data: {
      contactId: params.contactId,
      managerId: params.managerId,
      type: "NOTE",
      title: `КП ${number} на ${total.toLocaleString("ru-KZ")} ₸`,
      payload: { quoteId: quote.id, total },
    },
  });
  await db.contact.update({
    where: { id: params.contactId },
    data: { dealAmount: total },
  });
  const refreshed = await db.contact.findUnique({ where: { id: params.contactId } });
  if (refreshed) {
    await advanceOpenStage(db, {
      contactId: params.contactId,
      slug: "demo_done",
      actorId: params.managerId,
      contactForRules: refreshed,
    });
  }
  return quote;
}

export async function setQuoteStatus(db: Db, id: string, status: QuoteStatus, actorId: string) {
  const quote = await db.quote.update({ where: { id }, data: { status } });
  if (status === "ACCEPTED") {
    await db.contact.update({
      where: { id: quote.contactId },
      data: { dealAmount: quote.total },
    });
  }
  await db.activity.create({
    data: {
      contactId: quote.contactId,
      managerId: actorId,
      type: "NOTE",
      title: `КП ${quote.number}: ${status}`,
      payload: { quoteId: id, status },
    },
  });
  return quote;
}

export function vacuumDefaults(): Array<{ sku: string; name: string; category: string; price: number; stock: number; description: string }> {
  return [
    { sku: "QC-MINI", name: "Quantum Clean Mini", category: "vacuum", price: 45000, stock: 20, description: "Компактті тұрмыстық шаңсорғыш" },
    { sku: "QC-PRO400", name: "Quantum Clean Pro 400", category: "vacuum", price: 89000, stock: 15, description: "Күшті мотор, үй мен кеңсе" },
    { sku: "QC-WD800", name: "Quantum Wet+Dry 800", category: "vacuum", price: 129000, stock: 8, description: "Су + құрғақ жинау" },
    { sku: "QC-ROBOT", name: "Quantum Robot S1", category: "robot", price: 199000, stock: 6, description: "Робот-шаңсорғыш, карталау" },
    { sku: "QC-HEPA", name: "HEPA сүзгі", category: "parts", price: 6900, stock: 80, description: "Барлық Pro модельге" },
    { sku: "QC-BRUSH", name: "Щетка жиынтығы", category: "parts", price: 4500, stock: 50, description: "Еден / кілем / бұрыш" },
  ];
}

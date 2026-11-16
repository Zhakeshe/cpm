import type { PrismaClient } from "@prisma/client";

export const LEAD_ACTIVITY_ORDER = [{ leadActivityAt: "desc" }, { id: "desc" }] as const;
export const CUSTOMER_CONVERSATION_ORDER = [
  { lastCustomerMessageAt: { sort: "desc", nulls: "last" } },
  { createdAt: "desc" },
  { id: "desc" },
] as const;

/** Advance the incoming queue only for a customer message; late webhooks cannot move it backwards. */
export async function recordCustomerInbound(db: PrismaClient, contactId: string, conversationId: string, sentAt: Date) {
  const at = new Date(Math.min(Number.isFinite(sentAt.getTime()) ? sentAt.getTime() : Date.now(), Date.now()));
  await db.$transaction([
    db.contact.updateMany({ where: { id: contactId, leadActivityAt: { lt: at } }, data: { leadActivityAt: at } }),
    db.conversation.updateMany({
      where: { id: conversationId, OR: [{ lastCustomerMessageAt: null }, { lastCustomerMessageAt: { lt: at } }] },
      data: { lastCustomerMessageAt: at },
    }),
  ]);
}

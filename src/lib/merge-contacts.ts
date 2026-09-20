import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export async function mergeContacts(
  db: Db,
  params: { primaryId: string; secondaryId: string; actorId: string },
) {
  if (params.primaryId === params.secondaryId) throw Object.assign(new Error("SAME_CONTACT"), { status: 400 });
  const [primary, secondary] = await Promise.all([
    db.contact.findUnique({ where: { id: params.primaryId }, include: { tags: true } }),
    db.contact.findUnique({ where: { id: params.secondaryId }, include: { tags: true } }),
  ]);
  if (!primary || !secondary) throw Object.assign(new Error("NOT_FOUND"), { status: 404 });

  const altPhone = primary.altPhone || (secondary.phoneNormalized !== primary.phoneNormalized ? secondary.phoneDisplay : null);

  for (const row of secondary.tags) {
    await db.contactTag.upsert({
      where: { contactId_tagId: { contactId: primary.id, tagId: row.tagId } },
      create: { contactId: primary.id, tagId: row.tagId },
      update: {},
    });
  }

  await db.lead.updateMany({ where: { contactId: secondary.id }, data: { contactId: primary.id } });
  await db.task.updateMany({ where: { contactId: secondary.id }, data: { contactId: primary.id } });
  await db.meeting.updateMany({ where: { contactId: secondary.id }, data: { contactId: primary.id } });
  await db.call.updateMany({ where: { contactId: secondary.id }, data: { contactId: primary.id } });
  await db.activity.updateMany({ where: { contactId: secondary.id }, data: { contactId: primary.id } });
  await db.managerChange.updateMany({ where: { contactId: secondary.id }, data: { contactId: primary.id } });
  await db.quote.updateMany({ where: { contactId: secondary.id }, data: { contactId: primary.id } });
  await db.payment.updateMany({ where: { contactId: secondary.id }, data: { contactId: primary.id } });
  await db.contactFile.updateMany({ where: { contactId: secondary.id }, data: { contactId: primary.id } });
  await db.message.updateMany({ where: { contactId: secondary.id }, data: { contactId: primary.id } });

  const secondaryConvos = await db.conversation.findMany({ where: { contactId: secondary.id } });
  for (const convo of secondaryConvos) {
    const existing = await db.conversation.findUnique({
      where: { contactId_channel: { contactId: primary.id, channel: convo.channel } },
    });
    if (existing) {
      await db.message.updateMany({ where: { conversationId: convo.id }, data: { conversationId: existing.id, contactId: primary.id } });
      await db.conversation.delete({ where: { id: convo.id } });
    } else {
      await db.conversation.update({ where: { id: convo.id }, data: { contactId: primary.id } });
    }
  }

  const custom = { ...(secondary.customFields as object), ...(primary.customFields as object) };
  await db.contact.update({
    where: { id: primary.id },
    data: {
      email: primary.email || secondary.email,
      altPhone,
      address: primary.address || secondary.address,
      city: primary.city || secondary.city,
      companyId: primary.companyId || secondary.companyId,
      comment: [primary.comment, secondary.comment].filter(Boolean).join("\n"),
      dealAmount: Number(primary.dealAmount) >= Number(secondary.dealAmount) ? primary.dealAmount : secondary.dealAmount,
      customFields: custom,
    },
  });

  await db.contact.update({
    where: { id: secondary.id },
    data: { archivedAt: new Date(), comment: `merged into ${primary.id}` },
  });

  await db.activity.create({
    data: {
      contactId: primary.id,
      managerId: params.actorId,
      type: "NOTE",
      title: `Дубликат объединён: ${secondary.firstName} ${secondary.phoneDisplay}`,
      payload: { secondaryId: secondary.id },
    },
  });
  await db.auditLog.create({
    data: {
      actorId: params.actorId,
      action: "contact.merge",
      entityType: "Contact",
      entityId: primary.id,
      oldValue: { secondaryId: secondary.id },
      newValue: { primaryId: primary.id },
    },
  });
  return { primaryId: primary.id, archivedId: secondary.id };
}

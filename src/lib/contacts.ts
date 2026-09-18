import type { PrismaClient, ContactSource, Prisma } from "@prisma/client";
import { pickRoundRobinManager, type ManagerCandidate } from "./assignment";
import { displayPhone, normalizePhone } from "./phone";

type Db = PrismaClient | Prisma.TransactionClient;

export async function findContactByPhone(db: Db, phone: string) {
  const phoneNormalized = normalizePhone(phone);
  if (!phoneNormalized) return null;
  return db.contact.findUnique({ where: { phoneNormalized } });
}

export async function nextManager(db: Db) {
  const managers = (await db.user.findMany({
    where: { role: { in: ["MANAGER", "OPERATOR"] } },
    select: { id: true, isActive: true, acceptsNewLeads: true },
  })) as ManagerCandidate[];
  const state = await db.managerAssignmentState.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
  });
  const picked = pickRoundRobinManager(managers, state.lastManagerId);
  if (picked) {
    await db.managerAssignmentState.update({
      where: { id: "global" },
      data: { lastManagerId: picked.id, lastAssignedAt: new Date() },
    });
  }
  return picked;
}

export type IngestContactInput = {
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  source: ContactSource;
  comment?: string;
  campaign?: string;
  adName?: string;
  formName?: string;
  actorId?: string | null;
  createLeadOnDuplicate?: boolean;
};

export type IngestResult = {
  contactId: string;
  leadId: string | null;
  managerId: string | null;
  createdContact: boolean;
  createdLead: boolean;
  duplicate: boolean;
};

export async function ingestContact(db: Db, input: IngestContactInput): Promise<IngestResult> {
  const phoneNormalized = normalizePhone(input.phone);
  if (!phoneNormalized) {
    throw new Error("PHONE_REQUIRED");
  }

  const existing = await db.contact.findUnique({
    where: { phoneNormalized },
    include: { manager: true, pipelineStage: true },
  });

  const firstStage = await db.pipelineStage.findFirst({
    where: { isActive: true, pipeline: { isDefault: true } },
    orderBy: { order: "asc" },
  });

  if (existing) {
    const managerId = existing.managerId;
    let leadId: string | null = null;
    let createdLead = false;
    if (input.createLeadOnDuplicate) {
      const lead = await db.lead.create({
        data: {
          contactId: existing.id,
          managerId,
          source: input.source,
          pipelineStageId: existing.pipelineStageId ?? firstStage?.id,
          processedAt: new Date(),
          campaign: input.campaign,
          adName: input.adName,
          formName: input.formName,
        },
      });
      leadId = lead.id;
      createdLead = true;
    }
    if (createdLead) {
      await db.activity.create({
        data: {
          contactId: existing.id,
          managerId,
          type: "LEAD_CREATED",
          title: "Повторное обращение — событие добавлено в существующую карточку",
          payload: { source: input.source, duplicate: true },
        },
      });
    }
    await db.contact.update({
      where: { id: existing.id },
      data: { lastContactAt: new Date() },
    });
    return {
      contactId: existing.id,
      leadId,
      managerId,
      createdContact: false,
      createdLead,
      duplicate: true,
    };
  }

  const assigned = await nextManager(db);
  const contact = await db.contact.create({
    data: {
      firstName: input.firstName || "Клиент",
      lastName: input.lastName || "",
      phoneNormalized,
      phoneDisplay: displayPhone(phoneNormalized),
      whatsappNumber: phoneNormalized,
      email: input.email,
      source: input.source,
      managerId: assigned?.id,
      pipelineStageId: firstStage?.id,
      comment: input.comment || "",
      lastContactAt: new Date(),
    },
  });
  const lead = await db.lead.create({
    data: {
      contactId: contact.id,
      managerId: assigned?.id,
      source: input.source,
      pipelineStageId: firstStage?.id,
      campaign: input.campaign,
      adName: input.adName,
      formName: input.formName,
    },
  });
  await db.activity.create({
    data: {
      contactId: contact.id,
      managerId: assigned?.id,
      type: "LEAD_CREATED",
      title: `Лид создан (${input.source})`,
      payload: { source: input.source },
    },
  });
  if (assigned) {
    await db.activity.create({
      data: {
        contactId: contact.id,
        managerId: assigned.id,
        type: "MANAGER_ASSIGNED",
        title: "Назначен ответственный менеджер",
        payload: { managerId: assigned.id },
      },
    });
  }
  return {
    contactId: contact.id,
    leadId: lead.id,
    managerId: assigned?.id ?? null,
    createdContact: true,
    createdLead: true,
    duplicate: false,
  };
}

export async function reassignContact(
  db: Db,
  params: { contactId: string; toUserId: string; actorId: string; ip?: string; reason?: string },
) {
  const contact = await db.contact.findUnique({ where: { id: params.contactId } });
  if (!contact) throw new Error("NOT_FOUND");
  const from = contact.managerId;
  await db.contact.update({
    where: { id: params.contactId },
    data: { managerId: params.toUserId },
  });
  await db.conversation.updateMany({
    where: { contactId: params.contactId },
    data: { managerId: params.toUserId },
  });
  await db.lead.updateMany({
    where: { contactId: params.contactId, processedAt: null },
    data: { managerId: params.toUserId },
  });
  await db.managerChange.create({
    data: {
      contactId: params.contactId,
      fromUserId: from,
      toUserId: params.toUserId,
      reason: params.reason,
    },
  });
  await db.auditLog.create({
    data: {
      actorId: params.actorId,
      action: "contact.reassign",
      entityType: "Contact",
      entityId: params.contactId,
      oldValue: { managerId: from },
      newValue: { managerId: params.toUserId },
      ip: params.ip,
    },
  });
  await db.activity.create({
    data: {
      contactId: params.contactId,
      managerId: params.toUserId,
      type: "MANAGER_ASSIGNED",
      title: "Ответственный менеджер изменён",
      payload: { from, to: params.toUserId },
    },
  });
}

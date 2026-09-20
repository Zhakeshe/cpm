import type { Prisma, PrismaClient } from "@prisma/client";
import { assertStageRequirements } from "./pipeline-rules";

export const LOST_REASONS = ["price", "no_need", "competitor", "silent", "later", "other"] as const;
export const WON_REASONS = ["paid_full", "installment", "repeat"] as const;

export type OutcomeKind = "WON" | "LOST";

export class OutcomeReasonRequiredError extends Error {
  status = 400;
  constructor() {
    super("OUTCOME_REASON_REQUIRED");
  }
}

type Db = PrismaClient | Prisma.TransactionClient;

export function normalizeOutcomeReason(kind: OutcomeKind, reason?: string | null) {
  const value = (reason || "").trim().slice(0, 120);
  if (!value) return null;
  const allowed = kind === "WON" ? WON_REASONS : LOST_REASONS;
  if ((allowed as readonly string[]).includes(value)) return value;
  return value;
}

/**
 * Closing a deal always records why. Reopening clears the outcome so the
 * contact returns to the live follow-up queue.
 */
/** Moves an open deal forward to a named column (демо, қайта қоңырау, КП). Never closes won/lost. */
export async function advanceOpenStage(
  db: Db,
  params: { contactId: string; slug: string; actorId: string; contactForRules?: Parameters<typeof assertStageRequirements>[2] },
) {
  const contact = await db.contact.findUnique({
    where: { id: params.contactId },
    include: { pipelineStage: true },
  });
  if (!contact) return null;
  const target = await db.pipelineStage.findFirst({
    where: { slug: params.slug, isActive: true, pipeline: { isDefault: true } },
  });
  if (!target || contact.pipelineStageId === target.id) return contact;
  if (contact.pipelineStage?.isWon || contact.pipelineStage?.isLost) return contact;
  if ((contact.pipelineStage?.order ?? 0) > target.order) return contact;
  await applyContactStage(db, {
    contactId: params.contactId,
    fromStageId: contact.pipelineStageId,
    toStageId: target.id,
    actorId: params.actorId,
    contactForRules: params.contactForRules || contact,
  });
  return contact;
}

export async function applyContactStage(
  db: Db,
  params: {
    contactId: string;
    fromStageId: string | null;
    toStageId: string;
    actorId: string;
    outcomeReason?: string | null;
    contactForRules: Parameters<typeof assertStageRequirements>[2];
  },
) {
  await assertStageRequirements(db as PrismaClient, params.toStageId, params.contactForRules);
  const [from, to] = await Promise.all([
    params.fromStageId ? db.pipelineStage.findUnique({ where: { id: params.fromStageId } }) : null,
    db.pipelineStage.findUnique({ where: { id: params.toStageId } }),
  ]);
  if (!to) throw Object.assign(new Error("STAGE_NOT_FOUND"), { status: 400 });

  let status: "NEW" | "IN_PROGRESS" | "WON" | "LOST" = "IN_PROGRESS";
  let outcomeReason: string | null = null;
  let closedAt: Date | null = null;
  if (to.isWon || to.isLost) {
    const kind: OutcomeKind = to.isWon ? "WON" : "LOST";
    const reason = normalizeOutcomeReason(kind, params.outcomeReason);
    if (!reason) throw new OutcomeReasonRequiredError();
    status = kind;
    outcomeReason = reason;
    closedAt = new Date();
  }

  await db.contact.update({
    where: { id: params.contactId },
    data: {
      pipelineStageId: params.toStageId,
      status,
      outcomeReason,
      closedAt,
    },
  });
  await db.activity.create({
    data: {
      contactId: params.contactId,
      managerId: params.actorId,
      type: "STAGE_CHANGED",
      title: to.isWon || to.isLost
        ? `Сделка ${to.isWon ? "выиграна" : "проиграна"}: ${to.name} (${outcomeReason})`
        : `Статус изменён: «${from?.name || "—"}» → «${to.name}»`,
      payload: { from: params.fromStageId, to: params.toStageId, outcomeReason },
    },
  });
  await db.auditLog.create({
    data: {
      actorId: params.actorId,
      action: "contact.stage",
      entityType: "Contact",
      entityId: params.contactId,
      oldValue: { stage: params.fromStageId },
      newValue: { stage: params.toStageId, outcomeReason, status },
    },
  });
  await db.lead.updateMany({
    where: { contactId: params.contactId, processedAt: null },
    data: { processedAt: new Date(), pipelineStageId: params.toStageId },
  });
  return db.contact.findUnique({ where: { id: params.contactId } });
}

export async function addContactNote(
  db: Db,
  params: { contactId: string; managerId: string; text: string },
) {
  const text = params.text.trim().slice(0, 2000);
  if (!text) throw Object.assign(new Error("NOTE_REQUIRED"), { status: 400 });
  return db.activity.create({
    data: {
      contactId: params.contactId,
      managerId: params.managerId,
      type: "NOTE",
      title: text,
      payload: { note: true },
    },
  });
}

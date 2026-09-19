import type { Prisma, PrismaClient } from "@prisma/client";

export const REQUIRED_FIELD_LABELS: Record<string, string> = {
  dealAmount: "Сумма сделки",
  email: "Email",
  comment: "Комментарий",
  whatsappNumber: "WhatsApp-номер",
  lastName: "Фамилия",
};

export class MissingStageFieldsError extends Error {
  status = 400;
  constructor(public fields: string[]) {
    super("STAGE_FIELDS_REQUIRED");
  }
}

type ContactLike = {
  dealAmount?: Prisma.Decimal | number | string | null;
  email?: string | null;
  comment?: string | null;
  whatsappNumber?: string | null;
  lastName?: string | null;
  customFields?: Prisma.JsonValue;
};

function isFilled(contact: ContactLike, field: string) {
  if (field === "dealAmount") return Number(contact.dealAmount || 0) > 0;
  const known = (contact as Record<string, unknown>)[field];
  if (typeof known === "string") return known.trim().length > 0;
  if (known) return true;
  const custom = (contact.customFields || {}) as Record<string, unknown>;
  const value = custom[field];
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

/**
 * A stage can demand data before a deal is allowed to enter it, so the move is
 * rejected with the exact list of fields the manager still has to fill in.
 */
export async function assertStageRequirements(
  db: PrismaClient,
  stageId: string,
  contact: ContactLike,
) {
  const stage = await db.pipelineStage.findUnique({ where: { id: stageId } });
  if (!stage?.requiredFields?.length) return;
  const missing = stage.requiredFields.filter((field) => !isFilled(contact, field));
  if (missing.length > 0) {
    throw new MissingStageFieldsError(missing);
  }
}

export function describeFields(fields: string[]) {
  return fields.map((f) => REQUIRED_FIELD_LABELS[f] || f).join(", ");
}

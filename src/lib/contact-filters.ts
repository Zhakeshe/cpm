import type { ContactSource, Prisma } from "@prisma/client";

/** Sales team works in Kazakhstan; calendar-day filters use Almaty, not UTC midnight. */
const CRM_TZ_OFFSET = "+05:00";

export function createdAtRange(from?: string, to?: string): { gte?: Date; lte?: Date } | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: new Date(`${from}T00:00:00${CRM_TZ_OFFSET}`) } : {}),
    ...(to ? { lte: new Date(`${to}T23:59:59.999${CRM_TZ_OFFSET}`) } : {}),
  };
}

export type ContactFilterInput = {
  q?: string;
  stageId?: string;
  managerId?: string;
  source?: ContactSource | string;
  tagId?: string;
  companyId?: string;
  status?: string;
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  archived?: boolean;
};

export function parseContactFilters(params: URLSearchParams): ContactFilterInput {
  const num = (key: string) => {
    const v = params.get(key);
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    q: params.get("q") || undefined,
    stageId: params.get("stage") || undefined,
    managerId: params.get("manager") || undefined,
    source: params.get("source") || undefined,
    tagId: params.get("tag") || undefined,
    companyId: params.get("company") || undefined,
    status: params.get("status") || undefined,
    from: params.get("date") || params.get("from") || undefined,
    to: params.get("date") || params.get("to") || undefined,
    minAmount: num("minAmount"),
    maxAmount: num("maxAmount"),
    archived: params.get("archived") === "1",
  };
}

export function contactWhere(filters: ContactFilterInput, scopedManagerId?: string): Prisma.ContactWhereInput {
  const and: Prisma.ContactWhereInput[] = [];
  if (scopedManagerId) and.push({ managerId: scopedManagerId });
  else if (filters.managerId) and.push({ managerId: filters.managerId });
  if (!filters.archived) and.push({ archivedAt: null });
  else and.push({ archivedAt: { not: null } });
  if (filters.stageId) and.push({ pipelineStageId: filters.stageId });
  if (filters.source) and.push({ source: filters.source as ContactSource });
  if (filters.status) and.push({ status: filters.status as Prisma.EnumContactStatusFilter["equals"] });
  if (filters.companyId) and.push({ companyId: filters.companyId });
  if (filters.tagId) and.push({ tags: { some: { tagId: filters.tagId } } });
  if (filters.minAmount != null || filters.maxAmount != null) {
    and.push({
      dealAmount: {
        ...(filters.minAmount != null ? { gte: filters.minAmount } : {}),
        ...(filters.maxAmount != null ? { lte: filters.maxAmount } : {}),
      },
    });
  }
  const createdAt = createdAtRange(filters.from, filters.to);
  if (createdAt) and.push({ createdAt });
  const q = filters.q?.trim();
  if (q) {
    const digits = q.replace(/\D/g, "");
    and.push({
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { id: { equals: q } },
        { comment: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { phoneDisplay: { contains: q, mode: "insensitive" } },
        { pipelineStage: { name: { contains: q, mode: "insensitive" } } },
        { manager: { is: { name: { contains: q, mode: "insensitive" } } } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
        ...(digits ? [{ phoneNormalized: { contains: digits } }, { altPhone: { contains: digits } }, { whatsappNumber: { contains: digits } }] : []),
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

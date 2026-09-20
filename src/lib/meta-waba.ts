import type { PrismaClient, TemplateStatus } from "@prisma/client";
import { placeholdersOf } from "./templates";
import { graphGet, whatsappCredentials } from "./meta-graph";

export type MetaTemplateComponent = {
  type?: string;
  format?: string;
  text?: string;
};

export type MetaMessageTemplate = {
  id?: string;
  name?: string;
  language?: string;
  status?: string;
  category?: string;
  components?: MetaTemplateComponent[];
};

export type WabaPhoneSnapshot = {
  id?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  codeVerificationStatus?: string;
};

export type WabaAccountSnapshot = {
  id?: string;
  name?: string;
  accountReviewStatus?: string;
  businessVerificationStatus?: string;
};

export type SyncedTemplate = {
  metaName: string;
  language: string;
  name: string;
  category: string;
  body: string;
  status: TemplateStatus;
  isActive: boolean;
  placeholders: string[];
};

export function mapMetaTemplateStatus(status?: string): TemplateStatus {
  const value = (status || "").toUpperCase();
  if (value === "APPROVED") return "APPROVED";
  if (value === "REJECTED" || value === "DISABLED" || value === "PAUSED") return "REJECTED";
  return "PENDING";
}

export function extractTemplateBody(components?: MetaTemplateComponent[]) {
  const body = (components || []).find((c) => (c.type || "").toUpperCase() === "BODY");
  return (body?.text || "").trim();
}

export function humanizeTemplateName(metaName: string) {
  return metaName
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mappedTemplateFromMeta(raw: MetaMessageTemplate): SyncedTemplate | null {
  const metaName = (raw.name || "").trim();
  const language = (raw.language || "en").trim();
  if (!metaName || !language) return null;
  const body = extractTemplateBody(raw.components) || metaName;
  const status = mapMetaTemplateStatus(raw.status);
  return {
    metaName,
    language,
    name: humanizeTemplateName(metaName),
    category: (raw.category || "UTILITY").toUpperCase(),
    body,
    status,
    isActive: status === "APPROVED",
    placeholders: placeholdersOf(body),
  };
}

export async function fetchWabaTemplates(): Promise<MetaMessageTemplate[]> {
  const { wabaId } = whatsappCredentials();
  if (!wabaId) return [];
  const all: MetaMessageTemplate[] = [];
  let after: string | undefined;
  for (let i = 0; i < 10; i += 1) {
    const page = await graphGet<{ data?: MetaMessageTemplate[]; paging?: { cursors?: { after?: string } } }>(
      `${wabaId}/message_templates`,
      {
        fields: "name,language,status,category,components",
        limit: "100",
        ...(after ? { after } : {}),
      },
    );
    all.push(...(page.data || []));
    after = page.paging?.cursors?.after;
    if (!after || !(page.data || []).length) break;
  }
  return all;
}

export async function fetchWabaPhone(): Promise<WabaPhoneSnapshot | null> {
  const { phoneNumberId } = whatsappCredentials();
  if (!phoneNumberId) return null;
  const phone = await graphGet<{
    id?: string;
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
    code_verification_status?: string;
  }>(phoneNumberId, {
    fields: "id,display_phone_number,verified_name,quality_rating,code_verification_status",
  });
  return {
    id: phone.id,
    displayPhoneNumber: phone.display_phone_number,
    verifiedName: phone.verified_name,
    qualityRating: phone.quality_rating,
    codeVerificationStatus: phone.code_verification_status,
  };
}

export async function fetchWabaAccount(): Promise<WabaAccountSnapshot | null> {
  const { wabaId } = whatsappCredentials();
  if (!wabaId) return null;
  const account = await graphGet<{
    id?: string;
    name?: string;
    account_review_status?: string;
    business_verification_status?: string;
  }>(wabaId, {
    fields: "id,name,account_review_status,business_verification_status",
  });
  return {
    id: account.id,
    name: account.name,
    accountReviewStatus: account.account_review_status,
    businessVerificationStatus: account.business_verification_status,
  };
}

export async function upsertTemplatesFromMeta(db: PrismaClient, raw: MetaMessageTemplate[]) {
  let created = 0;
  let updated = 0;
  const mapped = raw.map(mappedTemplateFromMeta).filter((row): row is SyncedTemplate => Boolean(row));
  for (const tpl of mapped) {
    const existing = await db.messageTemplate.findUnique({
      where: { metaName_language: { metaName: tpl.metaName, language: tpl.language } },
    });
    await db.messageTemplate.upsert({
      where: { metaName_language: { metaName: tpl.metaName, language: tpl.language } },
      create: {
        name: tpl.name,
        metaName: tpl.metaName,
        language: tpl.language,
        category: tpl.category,
        body: tpl.body,
        placeholders: tpl.placeholders,
        status: tpl.status,
        isActive: tpl.isActive,
      },
      update: {
        category: tpl.category,
        body: tpl.body,
        placeholders: tpl.placeholders,
        status: tpl.status,
        isActive: tpl.isActive,
      },
    });
    if (existing) updated += 1;
    else created += 1;
  }
  return { created, updated, total: mapped.length };
}

/**
 * Pulls WABA phone quality, review status and message templates from Graph.
 * Works while Business verification is still pending — statuses just stay PENDING.
 */
export async function syncWabaFromMeta(db: PrismaClient, actorId?: string) {
  const creds = whatsappCredentials();
  if (!creds.configured) {
    throw Object.assign(new Error("WHATSAPP_NOT_CONFIGURED"), { status: 400 });
  }

  try {
    const [account, phone, templates] = await Promise.all([
      fetchWabaAccount(),
      fetchWabaPhone(),
      fetchWabaTemplates(),
    ]);
    const upserted = await upsertTemplatesFromMeta(db, templates);
    const config = {
      account,
      phone,
      templatesFromMeta: upserted.total,
    };
    await db.integration.upsert({
      where: { type: "WHATSAPP_BUSINESS" },
      create: {
        type: "WHATSAPP_BUSINESS",
        status: "CONNECTED",
        config,
        lastSyncAt: new Date(),
        lastError: null,
      },
      update: {
        status: "CONNECTED",
        config,
        lastSyncAt: new Date(),
        lastError: null,
      },
    });
    if (actorId) {
      await db.auditLog.create({
        data: {
          actorId,
          action: "waba.sync",
          entityType: "Integration",
          entityId: "WHATSAPP_BUSINESS",
          newValue: { ...upserted, phone: phone?.displayPhoneNumber, review: account?.accountReviewStatus },
        },
      });
    }
    return { account, phone, ...upserted };
  } catch (err) {
    const message = (err as Error).message || "META_SYNC_FAILED";
    await db.integration.upsert({
      where: { type: "WHATSAPP_BUSINESS" },
      create: {
        type: "WHATSAPP_BUSINESS",
        status: "ERROR",
        lastError: message,
        lastSyncAt: new Date(),
      },
      update: {
        status: "ERROR",
        lastError: message,
        lastSyncAt: new Date(),
      },
    });
    throw err;
  }
}

export function wabaPublicStatus(integration: {
  status: string;
  lastSyncAt: Date | null;
  lastError: string | null;
  config: unknown;
}) {
  const config = (integration.config || {}) as {
    account?: WabaAccountSnapshot;
    phone?: WabaPhoneSnapshot;
    templatesFromMeta?: number;
  };
  const creds = whatsappCredentials();
  return {
    configured: creds.configured,
    hasPhoneId: Boolean(creds.phoneNumberId),
    hasWabaId: Boolean(creds.wabaId),
    status: integration.status,
    lastSyncAt: integration.lastSyncAt,
    lastError: integration.lastError,
    account: config.account || null,
    phone: config.phone || null,
    templatesFromMeta: config.templatesFromMeta || 0,
  };
}

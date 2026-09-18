import type { PrismaClient } from "@prisma/client";
import { ingestContact } from "./contacts";
import { notifyUser } from "./notifications";
import { emitToAdmins, emitToUser } from "./realtime";

export type MetaLeadFields = {
  phone?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  campaign?: string;
  ad?: string;
  form?: string;
  createdAt?: string;
};

const PHONE_KEYS = ["phone_number", "phone", "telefon", "телефон"];
const NAME_KEYS = ["full_name", "name", "имя"];
const FIRST_NAME_KEYS = ["first_name", "имя"];
const LAST_NAME_KEYS = ["last_name", "фамилия"];
const EMAIL_KEYS = ["email", "почта"];

function pick(fields: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    if (fields[key]) return fields[key];
  }
  return undefined;
}

/**
 * Meta only sends a leadgen_id in the webhook; the answers themselves must be
 * fetched from the Graph API with the page/system-user token.
 */
export async function fetchLeadFromGraph(leadgenId: string): Promise<MetaLeadFields | null> {
  const token = process.env.META_LEADS_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  // Failing loudly keeps the lead in the retry queue instead of silently dropping it.
  if (!token) throw new Error("META_LEADS_TOKEN_MISSING");
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";
  const res = await fetch(
    `https://graph.facebook.com/${version}/${leadgenId}?fields=field_data,campaign_name,ad_name,form_id,created_time`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Meta lead fetch failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    field_data?: Array<{ name: string; values: string[] }>;
    campaign_name?: string;
    ad_name?: string;
    form_id?: string;
    created_time?: string;
  };
  return mapLeadFields(json);
}

export function mapLeadFields(payload: {
  field_data?: Array<{ name: string; values: string[] }>;
  campaign_name?: string;
  ad_name?: string;
  form_id?: string;
  form_name?: string;
  created_time?: string;
}): MetaLeadFields {
  const fields: Record<string, string> = {};
  for (const item of payload.field_data || []) {
    fields[item.name.toLowerCase()] = item.values?.[0] || "";
  }
  const fullName = pick(fields, NAME_KEYS);
  const [firstFromFull, ...restFromFull] = (fullName || "").split(" ");
  return {
    phone: pick(fields, PHONE_KEYS),
    firstName: pick(fields, FIRST_NAME_KEYS) || firstFromFull || undefined,
    lastName: pick(fields, LAST_NAME_KEYS) || restFromFull.join(" ") || undefined,
    email: pick(fields, EMAIL_KEYS),
    campaign: payload.campaign_name,
    ad: payload.ad_name,
    form: payload.form_name || payload.form_id,
    createdAt: payload.created_time,
  };
}

type LeadgenWebhook = {
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        leadgen_id?: string;
        form_id?: string;
        ad_id?: string;
        campaign_id?: string;
        created_time?: number;
      };
    }>;
  }>;
  // direct payloads (manual replay / tests) may already carry the answers
  field_data?: Array<{ name: string; values: string[] }>;
  phone?: string;
  firstName?: string;
  lastName?: string;
  campaign?: string;
  ad?: string;
  form?: string;
};

export async function handleMetaLead(
  db: PrismaClient,
  payload: unknown,
  fetchLead: (id: string) => Promise<MetaLeadFields | null> = fetchLeadFromGraph,
) {
  const body = payload as LeadgenWebhook;
  const leads: MetaLeadFields[] = [];

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const leadgenId = change.value?.leadgen_id;
      if (!leadgenId) continue;
      const fetched = await fetchLead(leadgenId);
      if (fetched?.phone) {
        leads.push({
          ...fetched,
          form: fetched.form || change.value?.form_id,
        });
      }
    }
  }

  if (leads.length === 0) {
    const direct = body.field_data ? mapLeadFields(body) : null;
    const fallback: MetaLeadFields = direct?.phone
      ? direct
      : {
          phone: body.phone,
          firstName: body.firstName,
          lastName: body.lastName,
          campaign: body.campaign,
          ad: body.ad,
          form: body.form,
        };
    if (fallback.phone) leads.push(fallback);
  }

  const results = [];
  for (const lead of leads) {
    const ingest = await ingestContact(db, {
      phone: lead.phone!,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      source: "META_LEAD_ADS",
      campaign: lead.campaign,
      adName: lead.ad,
      formName: lead.form,
      createLeadOnDuplicate: true,
    });
    if (ingest.managerId) {
      await notifyUser(db, {
        userId: ingest.managerId,
        type: "NEW_LEAD",
        title: ingest.createdContact ? "Новый лид из Meta Lead Ads" : "Повторная заявка из Meta Lead Ads",
        body: `${lead.firstName || ""} ${lead.phone}`.trim(),
        data: { contactId: ingest.contactId, campaign: lead.campaign },
      });
      emitToUser(ingest.managerId, "lead:new", { contactId: ingest.contactId });
    }
    emitToAdmins("lead:new", { contactId: ingest.contactId });
    results.push(ingest);
  }
  return results;
}

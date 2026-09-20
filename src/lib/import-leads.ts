import type { ContactSource, PrismaClient } from "@prisma/client";
import { ingestContact } from "./contacts";
import type { ImportedLeadRow } from "./csv";

const SOURCES = new Set<ContactSource>([
  "WHATSAPP",
  "INSTAGRAM",
  "FACEBOOK",
  "PHONE_CALL",
  "MANUAL",
  "WEBSITE",
  "REFERRAL",
  "OTHER",
  "META_LEAD_ADS",
]);

function sourceOf(value?: string): ContactSource {
  const key = (value || "MANUAL").trim().toUpperCase().replace(/\s+/g, "_");
  return SOURCES.has(key as ContactSource) ? (key as ContactSource) : "MANUAL";
}

export async function importLeadRows(
  db: PrismaClient,
  rows: ImportedLeadRow[],
  actor: { id: string; role: string },
) {
  let created = 0;
  let duplicates = 0;
  const errors: Array<{ line: number; error: string }> = [];

  for (const row of rows) {
    if (!row.phone || !row.firstName) {
      errors.push({ line: row.line, error: "REQUIRED" });
      continue;
    }
    try {
      const ingest = await ingestContact(db, {
        phone: row.phone,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        comment: row.comment,
        source: sourceOf(row.source),
        actorId: actor.id,
        createLeadOnDuplicate: false,
      });
      if (ingest.createdContact && actor.role === "MANAGER") {
        await db.contact.update({ where: { id: ingest.contactId }, data: { managerId: actor.id } });
      }
      if (ingest.createdContact) created += 1;
      else if (ingest.duplicate) duplicates += 1;
    } catch (err) {
      errors.push({ line: row.line, error: (err as Error).message || "ERROR" });
    }
  }

  return { created, duplicates, errors, total: rows.length };
}

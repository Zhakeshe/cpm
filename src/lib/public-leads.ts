import type { PrismaClient } from "@prisma/client";
import { ingestContact } from "./contacts";
import { notifyUser } from "./notifications";
import { emitToAdmins, emitToUser } from "./realtime";

export async function capturePublicLead(
  db: PrismaClient,
  input: { firstName: string; phone: string; comment?: string; campaign?: string },
) {
  const ingest = await ingestContact(db, {
    phone: input.phone,
    firstName: input.firstName,
    source: "WEBSITE",
    comment: input.comment,
    campaign: input.campaign,
    createLeadOnDuplicate: true,
  });
  if (ingest.managerId) {
    emitToUser(ingest.managerId, "lead:new", { contactId: ingest.contactId });
    await notifyUser(db, {
      userId: ingest.managerId,
      type: "NEW_LEAD",
      title: "Новый лид с формы",
      body: `${input.firstName} ${input.phone}`,
      data: { contactId: ingest.contactId },
    });
  }
  emitToAdmins("lead:new", { contactId: ingest.contactId });
  return ingest;
}

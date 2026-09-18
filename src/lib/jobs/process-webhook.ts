import type { PrismaClient } from "@prisma/client";
import { handleWhatsAppInbound } from "../whatsapp";
import { handleTelephonyEvent, type TelephonyWebhook } from "../telephony";
import { ingestContact } from "../contacts";
import { notifyUser } from "../notifications";

export async function processWebhookJob(data: { webhookEventId: string; provider: string }) {
  const { prisma } = await import("../db");
  const event = await prisma.webhookEvent.findUnique({ where: { id: data.webhookEventId } });
  if (!event) return;
  await prisma.webhookEvent.update({
    where: { id: event.id },
    data: { processingStatus: "PROCESSING" },
  });
  try {
    if (event.provider === "whatsapp") {
      await handleWhatsAppInbound(prisma, event.payload);
    } else if (event.provider === "telephony") {
      await handleTelephonyEvent(prisma, event.payload as TelephonyWebhook);
    } else if (event.provider === "meta-leads") {
      await handleMetaLead(prisma, event.payload);
    }
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { processingStatus: "PROCESSED", processedAt: new Date(), error: null },
    });
  } catch (err) {
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        processingStatus: "FAILED",
        error: (err as Error).message,
      },
    });
    throw err;
  }
}

async function handleMetaLead(db: PrismaClient, payload: unknown) {
  const p = payload as {
    phone?: string;
    firstName?: string;
    lastName?: string;
    campaign?: string;
    ad?: string;
    form?: string;
  };
  if (!p.phone) return;
  const ingest = await ingestContact(db, {
    phone: p.phone,
    firstName: p.firstName,
    lastName: p.lastName,
    source: "META_LEAD_ADS",
    campaign: p.campaign,
    adName: p.ad,
    formName: p.form,
    createLeadOnDuplicate: true,
  });
  if (ingest.managerId && ingest.createdContact) {
    await notifyUser(db, {
      userId: ingest.managerId,
      type: "NEW_LEAD",
      title: "Новый лид из Meta",
      body: `${p.firstName || ""} ${p.phone}`,
      data: { contactId: ingest.contactId },
    });
  }
}

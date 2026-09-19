import { handleWhatsAppInbound } from "../whatsapp";
import { handleTelephonyEvent, type TelephonyWebhook } from "../telephony";
import { handleMetaLead } from "../meta-leads";

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
    } else {
      throw new Error(`Unknown webhook provider: ${event.provider}`);
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

import type { ContactSource, PrismaClient } from "@prisma/client";
import { convertTrackingClick, resolveTrackingClick } from "./tracking";

export async function inboundSourceFromText(db: PrismaClient, text?: string | null) {
  const click = await resolveTrackingClick(db, text);
  return {
    click,
    source: (click?.source || "WHATSAPP") as ContactSource,
    campaign: click?.slug,
  };
}

export async function attachTrackingAndGreet(
  db: PrismaClient,
  params: {
    text?: string | null;
    contactId: string;
    managerId: string | null;
    inbound: boolean;
  },
) {
  const click = await resolveTrackingClick(db, params.text);
  if (!click) return null;
  const firstConvert = !click.convertedAt;
  await convertTrackingClick(db, { token: click.token, contactId: params.contactId });
  if (!params.inbound || !firstConvert || !click.channel.greeting.trim()) return click;
  const senderId =
    params.managerId ||
    (await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, select: { id: true } }))?.id;
  if (!senderId) return click;
  try {
    const { sendOutboundMessage } = await import("./outbound");
    await sendOutboundMessage(db, {
      contactId: params.contactId,
      senderId,
      text: click.channel.greeting,
    });
  } catch (err) {
    console.error("tracking_greeting_failed", (err as Error).message);
  }
  return click;
}

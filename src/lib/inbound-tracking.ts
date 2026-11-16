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
  await convertTrackingClick(db, { token: click.token, contactId: params.contactId });
  return click;
}

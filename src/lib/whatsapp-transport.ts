import type { PrismaClient } from "@prisma/client";

export type WhatsAppTransport = "wazzup" | "meta" | "mock";

export type WazzupConfig = {
  apiKey: string;
  channelId: string;
  configured: boolean;
};

export async function getWazzupConfig(db?: PrismaClient): Promise<WazzupConfig> {
  const envKey = process.env.WAZZUP_API_KEY || "";
  const envChannel = process.env.WAZZUP_CHANNEL_ID || "";
  let apiKey = envKey;
  let channelId = envChannel;
  if (db && (!apiKey || !channelId)) {
    const row = await db.integration.findUnique({ where: { type: "WAZZUP" } });
    const cfg = (row?.config || {}) as { apiKey?: string; channelId?: string };
    apiKey = apiKey || cfg.apiKey || "";
    channelId = channelId || cfg.channelId || "";
  }
  return { apiKey, channelId, configured: Boolean(apiKey && channelId) };
}

export async function whatsappTransport(db?: PrismaClient): Promise<WhatsAppTransport> {
  const wazzup = await getWazzupConfig(db);
  if (wazzup.configured) return "wazzup";
  if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) return "meta";
  return "mock";
}

export function allowsFreeform(transport: WhatsAppTransport) {
  return transport === "wazzup" || transport === "mock";
}

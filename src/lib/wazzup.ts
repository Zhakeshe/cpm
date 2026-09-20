import crypto from "crypto";
import type { PrismaClient } from "@prisma/client";
import { getWazzupConfig } from "./whatsapp-transport";

const API = "https://api.wazzup24.com/v3";

export class WazzupApiError extends Error {
  status = 400;
  constructor(public code: string) {
    super(code);
  }
}

export type WazzupChannel = {
  channelId: string;
  plainId?: string;
  name?: string;
  transport?: string;
  state?: string;
};

async function wazzupFetch(apiKey: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const snippet = text.replace(/\s+/g, " ").slice(0, 240);
    console.error("wazzup_api_failed", { path, status: res.status, snippet });
    throw new WazzupApiError("WAZZUP_API_FAILED");
  }
  return json;
}

export async function listWazzupChannels(db?: PrismaClient) {
  const { apiKey } = await getWazzupConfig(db);
  if (!apiKey) throw Object.assign(new Error("WAZZUP_NOT_CONFIGURED"), { status: 400 });
  const data = await wazzupFetch(apiKey, "/channels");
  if (Array.isArray(data)) return data as WazzupChannel[];
  if (data && typeof data === "object" && Array.isArray((data as { channels?: unknown }).channels)) {
    return (data as { channels: WazzupChannel[] }).channels;
  }
  return [];
}

export async function subscribeWazzupWebhooks(db: PrismaClient, uri: string) {
  const { apiKey } = await getWazzupConfig(db);
  if (!apiKey) throw Object.assign(new Error("WAZZUP_NOT_CONFIGURED"), { status: 400 });
  await wazzupFetch(apiKey, "/webhooks", {
    method: "PATCH",
    body: JSON.stringify({
      webhooksUri: uri,
      subscriptions: {
        messagesAndStatuses: true,
        contactsAndDealsCreation: false,
        channelsUpdates: true,
        templateStatus: false,
      },
    }),
  });
}

export async function sendWazzupText(params: { apiKey: string; channelId: string; chatId: string; text: string }) {
  const data = (await wazzupFetch(params.apiKey, "/message", {
    method: "POST",
    body: JSON.stringify({
      channelId: params.channelId,
      chatType: "whatsapp",
      chatId: params.chatId,
      text: params.text,
    }),
  })) as { messageId?: string };
  return { mocked: false, id: data.messageId || `wazzup-${crypto.randomUUID()}` };
}

export async function sendWazzupMedia(params: {
  apiKey: string;
  channelId: string;
  chatId: string;
  contentUri: string;
}) {
  const data = (await wazzupFetch(params.apiKey, "/message", {
    method: "POST",
    body: JSON.stringify({
      channelId: params.channelId,
      chatType: "whatsapp",
      chatId: params.chatId,
      contentUri: params.contentUri,
    }),
  })) as { messageId?: string };
  return { mocked: false, id: data.messageId || `wazzup-${crypto.randomUUID()}` };
}

export function wazzupChatId(phone: string) {
  return phone.replace(/\D/g, "");
}

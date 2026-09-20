import type { MessageType, PrismaClient } from "@prisma/client";
import {
  isServiceWindowOpen,
  sendWhatsAppMedia,
  sendWhatsAppTemplate,
  sendWhatsAppText,
  type OutboundMediaType,
} from "./whatsapp";
import { emitToAdmins, emitToUser } from "./realtime";
import { renderTemplate } from "./templates";
import { allowsFreeform, getWazzupConfig, whatsappTransport } from "./whatsapp-transport";
import { sendWazzupMedia, sendWazzupText, wazzupChatId } from "./wazzup";
import { publicMediaUrl } from "./signed-media";

export class ServiceWindowClosedError extends Error {
  status = 409;
  constructor() {
    super("SERVICE_WINDOW_CLOSED");
  }
}

export async function getOrCreateConversation(db: PrismaClient, contactId: string, managerId: string | null) {
  return db.conversation.upsert({
    where: { contactId_channel: { contactId, channel: "whatsapp" } },
    create: { contactId, managerId, channel: "whatsapp" },
    update: {},
  });
}

type SendParams = {
  contactId: string;
  senderId: string;
  text?: string;
  templateId?: string;
  templateParameters?: string[];
  media?: {
    type: OutboundMediaType;
    metaMediaId: string;
    storageKey?: string;
    mimeType?: string;
    fileName?: string;
    size?: number;
    voiceNote?: boolean;
  };
};

/**
 * Meta only accepts free-form messages inside the 24h service window; outside it
 * the manager must pick an approved template, which is enforced here rather than
 * in the UI alone.
 */
export async function sendOutboundMessage(db: PrismaClient, params: SendParams) {
  const contact = await db.contact.findUnique({ where: { id: params.contactId } });
  if (!contact) throw Object.assign(new Error("NOT_FOUND"), { status: 404 });

  const conversation = await getOrCreateConversation(db, contact.id, contact.managerId);
  const transport = await whatsappTransport(db);
  const windowOpen = allowsFreeform(transport) || isServiceWindowOpen(conversation.serviceWindowExpiresAt);
  const to = contact.whatsappNumber || contact.phoneNormalized;
  const wazzup = transport === "wazzup" ? await getWazzupConfig(db) : null;

  let sent: { mocked: boolean; id: string };
  let type: MessageType = "TEXT";
  let text = params.text || "";

  if (params.templateId) {
    const template = await db.messageTemplate.findUnique({ where: { id: params.templateId } });
    if (!template || !template.isActive || (transport === "meta" && template.status !== "APPROVED")) {
      throw Object.assign(new Error("TEMPLATE_UNAVAILABLE"), { status: 400 });
    }
    text = renderTemplate(template.body, params.templateParameters || []);
    type = "TEMPLATE";
    if (wazzup?.configured) {
      sent = await sendWazzupText({ apiKey: wazzup.apiKey, channelId: wazzup.channelId, chatId: wazzupChatId(to), text });
    } else {
      sent = await sendWhatsAppTemplate({
        to,
        metaName: template.metaName,
        language: template.language,
        parameters: params.templateParameters,
      });
    }
  } else if (params.media) {
    if (!windowOpen) throw new ServiceWindowClosedError();
    if (wazzup?.configured) {
      if (!params.media.storageKey) throw Object.assign(new Error("MEDIA_STORAGE_REQUIRED"), { status: 400 });
      sent = await sendWazzupMedia({
        apiKey: wazzup.apiKey,
        channelId: wazzup.channelId,
        chatId: wazzupChatId(to),
        contentUri: publicMediaUrl(params.media.storageKey),
      });
    } else {
      sent = await sendWhatsAppMedia({
        to,
        type: params.media.type,
        mediaId: params.media.metaMediaId,
        caption: params.text,
        fileName: params.media.fileName,
        voiceNote: params.media.voiceNote || params.media.type === "VOICE",
      });
    }
    type = params.media.voiceNote || params.media.type === "VOICE" ? "VOICE" : (params.media.type as MessageType);
    text = params.text || params.media.fileName || "";
  } else {
    if (!params.text?.trim()) throw Object.assign(new Error("TEXT_REQUIRED"), { status: 400 });
    if (!windowOpen) throw new ServiceWindowClosedError();
    if (wazzup?.configured) {
      sent = await sendWazzupText({
        apiKey: wazzup.apiKey,
        channelId: wazzup.channelId,
        chatId: wazzupChatId(to),
        text: params.text,
      });
    } else {
      sent = await sendWhatsAppText({ to, text: params.text });
    }
  }

  const message = await db.message.create({
    data: {
      externalMessageId: sent.id,
      conversationId: conversation.id,
      contactId: contact.id,
      managerId: params.senderId,
      direction: "OUTBOUND",
      type,
      text,
      templateId: params.templateId,
      mediaUrl: params.media?.storageKey,
      mediaId: params.media?.metaMediaId,
      mediaMimeType: params.media?.mimeType,
      mediaFileName: params.media?.fileName,
      mediaSize: params.media?.size,
      status: "SENT",
    },
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: { lastMessage: text || "Вложение", lastMessageAt: new Date(), unreadCount: 0 },
  });
  await db.activity.create({
    data: {
      contactId: contact.id,
      managerId: params.senderId,
      type: "WHATSAPP_OUT",
      title: params.templateId ? "Отправлен шаблон WhatsApp" : "Исходящее сообщение WhatsApp",
      payload: { messageId: message.id },
    },
  });
  await db.contact.update({ where: { id: contact.id }, data: { lastContactAt: new Date() } });

  emitToUser(params.senderId, "whatsapp:message", { conversationId: conversation.id, messageId: message.id });
  if (contact.managerId && contact.managerId !== params.senderId) {
    emitToUser(contact.managerId, "whatsapp:message", { conversationId: conversation.id });
  }
  emitToAdmins("whatsapp:message", { conversationId: conversation.id });

  return { message, conversation, mocked: sent.mocked };
}

export { renderTemplate } from "./templates";

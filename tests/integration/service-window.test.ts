import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedBaseline, whatsappPayload } from "./helpers";
import { handleWhatsAppInbound, SERVICE_WINDOW_MS, isServiceWindowOpen } from "../../src/lib/whatsapp";
import { renderTemplate, sendOutboundMessage, ServiceWindowClosedError } from "../../src/lib/outbound";
import { avgResponseSeconds } from "../../src/lib/analytics";

async function approvedTemplate() {
  return prisma.messageTemplate.create({
    data: {
      name: "Продолжение консультации",
      metaName: "consultation_followup",
      language: "ru",
      body: "Здравствуйте, {{1}}. Продолжим консультацию?",
      placeholders: ["{{1}}"],
      status: "APPROVED",
    },
  });
}

describe("24-часовое окно и шаблоны", () => {
  beforeEach(async () => {
    await resetDatabase();
    await prisma.messageTemplate.deleteMany();
    await seedBaseline(2);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("открывает окно обслуживания на 24 часа после сообщения клиента", async () => {
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wa.w1", from: "77470000101", text: "Привет" }));

    const conversation = await prisma.conversation.findFirstOrThrow();
    expect(conversation.lastCustomerMessageAt).not.toBeNull();
    expect(isServiceWindowOpen(conversation.serviceWindowExpiresAt)).toBe(true);
    const delta =
      conversation.serviceWindowExpiresAt!.getTime() - conversation.lastCustomerMessageAt!.getTime();
    expect(delta).toBe(SERVICE_WINDOW_MS);
  });

  it("отправляет быстрый ответ как обычный текст внутри окна", async () => {
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wa.qr1", from: "77470000109", text: "цена?" }));
    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77470000109" } });
    const reply = await prisma.quickReply.create({
      data: { title: "Скидка", body: "Сейчас скидка 20%. Готовы оформить?" },
    });
    const result = await sendOutboundMessage(prisma, {
      contactId: contact.id,
      senderId: contact.managerId!,
      text: reply.body,
    });
    expect(result.message.type).toBe("TEXT");
    expect(result.message.text).toBe("Сейчас скидка 20%. Готовы оформить?");
  });

  it("разрешает свободный текст внутри окна", async () => {
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wa.w2", from: "77470000102", text: "Вопрос" }));
    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77470000102" } });

    const result = await sendOutboundMessage(prisma, {
      contactId: contact.id,
      senderId: contact.managerId!,
      text: "Здравствуйте! Чем помочь?",
    });

    expect(result.message.direction).toBe("OUTBOUND");
    expect(result.message.type).toBe("TEXT");
    expect(result.message.status).toBe("SENT");
  });

  it("блокирует свободный текст после закрытия окна", async () => {
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wa.w3", from: "77470000103", text: "Давно" }));
    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77470000103" } });
    await prisma.conversation.updateMany({
      where: { contactId: contact.id },
      data: { serviceWindowExpiresAt: new Date(Date.now() - 1000) },
    });

    await expect(
      sendOutboundMessage(prisma, { contactId: contact.id, senderId: contact.managerId!, text: "Ещё тут?" }),
    ).rejects.toBeInstanceOf(ServiceWindowClosedError);

    expect(await prisma.message.count({ where: { direction: "OUTBOUND" } })).toBe(0);
  });

  it("разрешает одобренный шаблон вне окна и подставляет переменные", async () => {
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wa.w4", from: "77470000104", text: "Давно" }));
    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77470000104" } });
    await prisma.conversation.updateMany({
      where: { contactId: contact.id },
      data: { serviceWindowExpiresAt: new Date(Date.now() - 1000) },
    });
    const template = await approvedTemplate();

    const result = await sendOutboundMessage(prisma, {
      contactId: contact.id,
      senderId: contact.managerId!,
      templateId: template.id,
      templateParameters: ["Аружан"],
    });

    expect(result.message.type).toBe("TEMPLATE");
    expect(result.message.text).toBe("Здравствуйте, Аружан. Продолжим консультацию?");
    expect(result.message.templateId).toBe(template.id);
  });

  it("не отправляет неодобренный шаблон", async () => {
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wa.w5", from: "77470000105", text: "Тест" }));
    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77470000105" } });
    const pending = await prisma.messageTemplate.create({
      data: {
        name: "Черновик",
        metaName: "draft_template",
        language: "ru",
        body: "Текст",
        status: "PENDING",
      },
    });

    await expect(
      sendOutboundMessage(prisma, {
        contactId: contact.id,
        senderId: contact.managerId!,
        templateId: pending.id,
      }),
    ).rejects.toThrow("TEMPLATE_UNAVAILABLE");
  });

  it("ответ клиента снова открывает окно", async () => {
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wa.w6", from: "77470000106", text: "Первое" }));
    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77470000106" } });
    await prisma.conversation.updateMany({
      where: { contactId: contact.id },
      data: { serviceWindowExpiresAt: new Date(Date.now() - 1000) },
    });

    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wa.w7", from: "77470000106", text: "Да, продолжим" }));

    const conversation = await prisma.conversation.findFirstOrThrow({ where: { contactId: contact.id } });
    expect(isServiceWindowOpen(conversation.serviceWindowExpiresAt)).toBe(true);
  });

  it("разрешает фото и голосовое внутри окна и блокирует вне окна", async () => {
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wa.m1", from: "77470000108", text: "фото?" }));
    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77470000108" } });
    const photo = await sendOutboundMessage(prisma, {
      contactId: contact.id,
      senderId: contact.managerId!,
      media: { type: "IMAGE", metaMediaId: "meta-img", mimeType: "image/jpeg", fileName: "a.jpg" },
    });
    expect(photo.message.type).toBe("IMAGE");
    const voice = await sendOutboundMessage(prisma, {
      contactId: contact.id,
      senderId: contact.managerId!,
      media: { type: "VOICE", metaMediaId: "meta-voice", mimeType: "audio/ogg", fileName: "voice.ogg", voiceNote: true },
    });
    expect(voice.message.type).toBe("VOICE");

    await prisma.conversation.updateMany({
      where: { contactId: contact.id },
      data: { serviceWindowExpiresAt: new Date(Date.now() - 1000) },
    });
    await expect(
      sendOutboundMessage(prisma, {
        contactId: contact.id,
        senderId: contact.managerId!,
        media: { type: "IMAGE", metaMediaId: "meta-img-2", mimeType: "image/jpeg" },
      }),
    ).rejects.toBeInstanceOf(ServiceWindowClosedError);
  });

  it("подставляет переменные шаблона по позициям", () => {
    expect(renderTemplate("{{1}}, демо {{2}}", ["Аружан", "в 15:00"])).toBe("Аружан, демо в 15:00");
  });

  it("считает среднее время ответа менеджера", async () => {
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wa.r1", from: "77470000107", text: "Вопрос" }));
    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77470000107" } });
    const inbound = await prisma.message.findFirstOrThrow({ where: { contactId: contact.id } });
    const sent = await sendOutboundMessage(prisma, {
      contactId: contact.id,
      senderId: contact.managerId!,
      text: "Отвечаю",
    });
    await prisma.message.update({
      where: { id: sent.message.id },
      data: { sentAt: new Date(inbound.sentAt.getTime() + 180_000) },
    });

    const avg = await avgResponseSeconds({ from: new Date(Date.now() - 3600_000), to: new Date(Date.now() + 3600_000) });
    expect(avg).toBe(180);
  });
});

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedBaseline, whatsappPayload, whatsappStatusPayload } from "./helpers";
import { handleWhatsAppInbound } from "../../src/lib/whatsapp";

describe("WhatsApp WABA", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedBaseline(2);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("создаёт клиента, лид, чат, сообщение и уведомление для менеджера", async () => {
    await handleWhatsAppInbound(
      prisma,
      whatsappPayload({ messageId: "wamid.1", from: "77471234567", text: "Здравствуйте", name: "Азамат Тест" }),
    );

    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77471234567" } });
    expect(contact.firstName).toBe("Азамат");
    expect(contact.source).toBe("WHATSAPP");
    expect(contact.managerId).toBe("mgr-1");

    const conversation = await prisma.conversation.findFirstOrThrow({ where: { contactId: contact.id } });
    expect(conversation.unreadCount).toBe(1);
    expect(conversation.lastMessage).toBe("Здравствуйте");

    const message = await prisma.message.findUniqueOrThrow({ where: { externalMessageId: "wamid.1" } });
    expect(message.direction).toBe("INBOUND");

    const notification = await prisma.notification.findFirstOrThrow({ where: { userId: "mgr-1" } });
    expect(notification.type).toBe("NEW_LEAD");
    expect(await prisma.lead.count()).toBe(1);
  });

  it("повторное сообщение идёт в тот же чат без второго контакта", async () => {
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wamid.1", from: "77471234567", text: "Первое" }));
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wamid.2", from: "77471234567", text: "Второе" }));

    expect(await prisma.contact.count()).toBe(1);
    expect(await prisma.conversation.count()).toBe(1);
    expect(await prisma.message.count()).toBe(2);

    const conversation = await prisma.conversation.findFirstOrThrow();
    expect(conversation.unreadCount).toBe(2);
    expect(conversation.managerId).toBe("mgr-1");
  });

  it("принимает официальный Cloud API payload и не дублирует Message", async () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "15551633738",
                  phone_number_id: "PHONE_NUMBER_ID",
                },
                contacts: [{ profile: { name: "Test User" }, wa_id: "77000000000" }],
                messages: [
                  {
                    from: "77000000000",
                    id: "wamid.TEST123",
                    timestamp: "1750000000",
                    text: { body: "Сәлем" },
                    type: "text",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await handleWhatsAppInbound(prisma, payload);
    await handleWhatsAppInbound(prisma, payload);

    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77000000000" } });
    expect(contact.firstName).toBe("Test");
    expect(contact.lastName).toBe("User");
    expect(await prisma.conversation.count({ where: { contactId: contact.id, channel: "whatsapp" } })).toBe(1);
    expect(await prisma.message.count({ where: { externalMessageId: "wamid.TEST123" } })).toBe(1);
    const message = await prisma.message.findUniqueOrThrow({ where: { externalMessageId: "wamid.TEST123" } });
    expect(message.direction).toBe("INBOUND");
    expect(message.text).toBe("Сәлем");
  });

  it("игнорирует повторную доставку того же message id", async () => {
    const payload = whatsappPayload({ messageId: "wamid.dup", from: "77470000099", text: "Дубль" });
    await handleWhatsAppInbound(prisma, payload);
    await handleWhatsAppInbound(prisma, payload);

    expect(await prisma.message.count()).toBe(1);
    expect(await prisma.contact.count()).toBe(1);
  });

  it("обновляет статусы доставки и прочтения", async () => {
    await handleWhatsAppInbound(prisma, whatsappPayload({ messageId: "wamid.s", from: "77470000055", text: "Статус" }));

    await handleWhatsAppInbound(prisma, whatsappStatusPayload("wamid.s", "delivered"));
    let message = await prisma.message.findUniqueOrThrow({ where: { externalMessageId: "wamid.s" } });
    expect(message.status).toBe("DELIVERED");
    expect(message.deliveredAt).not.toBeNull();

    await handleWhatsAppInbound(prisma, whatsappStatusPayload("wamid.s", "read"));
    message = await prisma.message.findUniqueOrThrow({ where: { externalMessageId: "wamid.s" } });
    expect(message.status).toBe("READ");
    expect(message.readAt).not.toBeNull();

    await handleWhatsAppInbound(prisma, whatsappStatusPayload("wamid.s", "failed"));
    message = await prisma.message.findUniqueOrThrow({ where: { externalMessageId: "wamid.s" } });
    expect(message.status).toBe("FAILED");
  });
});

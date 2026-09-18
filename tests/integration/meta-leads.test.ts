import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedBaseline } from "./helpers";
import { handleMetaLead, mapLeadFields } from "../../src/lib/meta-leads";

const leadgenWebhook = (leadgenId: string) => ({
  entry: [
    {
      changes: [
        {
          field: "leadgen",
          value: { leadgen_id: leadgenId, form_id: "form-42", created_time: 1700000000 },
        },
      ],
    },
  ],
});

describe("Meta Lead Ads", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedBaseline(2);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("разбирает ответы формы из Graph API", () => {
    const mapped = mapLeadFields({
      field_data: [
        { name: "full_name", values: ["Аружан Сейдахмет"] },
        { name: "phone_number", values: ["+7 747 123 45 67"] },
        { name: "email", values: ["aruzhan@example.com"] },
      ],
      campaign_name: "Осенняя кампания",
      ad_name: "Видео 15с",
      form_id: "form-42",
    });

    expect(mapped).toMatchObject({
      firstName: "Аружан",
      lastName: "Сейдахмет",
      phone: "+7 747 123 45 67",
      email: "aruzhan@example.com",
      campaign: "Осенняя кампания",
      ad: "Видео 15с",
      form: "form-42",
    });
  });

  it("создаёт клиента и лид по leadgen_id с данными из Graph API", async () => {
    const fetchLead = async (id: string) => {
      expect(id).toBe("lead-1");
      return {
        phone: "+7 747 000 33 44",
        firstName: "Мадина",
        lastName: "Ержан",
        campaign: "Instagram кампания",
        ad: "Карусель",
        form: "form-42",
      };
    };

    await handleMetaLead(prisma, leadgenWebhook("lead-1"), fetchLead);

    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77470003344" } });
    expect(contact.source).toBe("META_LEAD_ADS");
    expect(contact.firstName).toBe("Мадина");
    expect(contact.managerId).toBe("mgr-1");

    const lead = await prisma.lead.findFirstOrThrow({ where: { contactId: contact.id } });
    expect(lead.campaign).toBe("Instagram кампания");
    expect(lead.adName).toBe("Карусель");
    expect(lead.formName).toBe("form-42");

    const notification = await prisma.notification.findFirstOrThrow({ where: { userId: "mgr-1" } });
    expect(notification.type).toBe("NEW_LEAD");
  });

  it("не дублирует клиента при повторной заявке, но фиксирует новый лид", async () => {
    const fetchLead = async () => ({ phone: "77470005566", firstName: "Ерлан", campaign: "Ретаргет" });

    await handleMetaLead(prisma, leadgenWebhook("lead-2"), fetchLead);
    await handleMetaLead(prisma, leadgenWebhook("lead-3"), fetchLead);

    expect(await prisma.contact.count()).toBe(1);
    expect(await prisma.lead.count()).toBe(2);

    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77470005566" } });
    const leads = await prisma.lead.findMany({ where: { contactId: contact.id } });
    expect(new Set(leads.map((l) => l.managerId))).toEqual(new Set([contact.managerId]));
  });

  it("пропускает заявку без телефона", async () => {
    await handleMetaLead(prisma, leadgenWebhook("lead-4"), async () => ({ firstName: "Без телефона" }));
    expect(await prisma.contact.count()).toBe(0);
  });
});

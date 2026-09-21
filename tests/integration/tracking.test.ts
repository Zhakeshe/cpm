import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedBaseline, whatsappPayload } from "./helpers";
import { ensureTrackingChannels, recordTrackingClick } from "../../src/lib/tracking";
import { handleWhatsAppInbound } from "../../src/lib/whatsapp";
import { handleWazzupInbound } from "../../src/lib/wazzup-inbound";

describe("social tracking attribution", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedBaseline(2);
    await ensureTrackingChannels(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("stores a click token and converts Instagram inbound to INSTAGRAM not WHATSAPP", async () => {
    const recorded = await recordTrackingClick(prisma, { slug: "instagram" });
    expect(recorded?.click.token).toMatch(/^[a-f0-9]{8}$/);
    expect(recorded?.prefill).toContain(`qc:${recorded?.click.token}`);

    await handleWhatsAppInbound(
      prisma,
      whatsappPayload({
        messageId: "wamid.ig1",
        from: "77015550001",
        text: recorded!.prefill,
        name: "Аружан",
      }),
    );

    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77015550001" } });
    expect(contact.source).toBe("INSTAGRAM");
    expect(contact.comment).toContain(recorded!.click.token);

    const click = await prisma.trackingClick.findUniqueOrThrow({ where: { token: recorded!.click.token } });
    expect(click.convertedAt).toBeTruthy();
    expect(click.contactId).toBe(contact.id);

    const lead = await prisma.lead.findFirstOrThrow({ where: { contactId: contact.id } });
    expect(lead.source).toBe("INSTAGRAM");
    expect(lead.campaign).toBe("instagram");

    const outbound = await prisma.message.findFirst({
      where: { contactId: contact.id, direction: "OUTBOUND" },
    });
    expect(outbound?.text).toContain("Instagram");
  });

  it("attributes Wazzup TikTok inbound and does not greet twice", async () => {
    const recorded = await recordTrackingClick(prisma, { slug: "tiktok" });
    const prefill = recorded!.prefill;
    await handleWazzupInbound(prisma, {
      messages: [
        {
          messageId: "wz.tt.1",
          chatType: "whatsapp",
          chatId: "77015550002",
          status: "inbound",
          type: "text",
          text: prefill,
          contact: { name: "Ерлан" },
        },
      ],
    });
    await handleWazzupInbound(prisma, {
      messages: [
        {
          messageId: "wz.tt.2",
          chatType: "whatsapp",
          chatId: "77015550002",
          status: "inbound",
          type: "text",
          text: prefill,
          contact: { name: "Ерлан" },
        },
      ],
    });

    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77015550002" } });
    expect(contact.source).toBe("TIKTOK");
    const greetings = await prisma.message.findMany({
      where: { contactId: contact.id, direction: "OUTBOUND" },
    });
    expect(greetings).toHaveLength(1);
    expect(greetings[0].text).toContain("TikTok");
  });

  it("keeps organic WhatsApp as WHATSAPP when there is no token", async () => {
    await handleWhatsAppInbound(
      prisma,
      whatsappPayload({ messageId: "wamid.org", from: "77015550003", text: "Сәлем, пелесос керек" }),
    );
    const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneNormalized: "77015550003" } });
    expect(contact.source).toBe("WHATSAPP");
    expect(await prisma.message.count({ where: { contactId: contact.id, direction: "OUTBOUND" } })).toBe(0);
  });
});

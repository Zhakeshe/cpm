import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ingestContact } from "../../src/lib/contacts";
import { convertTrackingClick, ensureTrackingChannels, recordTrackingClick } from "../../src/lib/tracking";
import { trackingFunnel } from "../../src/lib/tracking-analytics";
import { prisma, resetDatabase, seedBaseline } from "./helpers";

describe("social channel funnel", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedBaseline(1);
    await ensureTrackingChannels(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("counts click → wrote → demo → paid for Instagram vs TikTok", async () => {
    const igA = await recordTrackingClick(prisma, { slug: "instagram" });
    const igB = await recordTrackingClick(prisma, { slug: "instagram" });
    const igC = await recordTrackingClick(prisma, { slug: "instagram" });
    const tt = await recordTrackingClick(prisma, { slug: "tiktok" });
    expect(igA && igB && igC && tt).toBeTruthy();

    const writer = await ingestContact(prisma, { phone: "77019990001", firstName: "Ару", source: "WHATSAPP" });
    const buyer = await ingestContact(prisma, { phone: "77019990002", firstName: "Ерлан", source: "WHATSAPP" });
    const tiktoker = await ingestContact(prisma, { phone: "77019990003", firstName: "Самал", source: "WHATSAPP" });

    await convertTrackingClick(prisma, { token: igA!.click.token, contactId: writer.contactId });
    await convertTrackingClick(prisma, { token: igB!.click.token, contactId: buyer.contactId });
    await convertTrackingClick(prisma, { token: tt!.click.token, contactId: tiktoker.contactId });

    const starts = new Date();
    await prisma.meeting.create({
      data: {
        contactId: buyer.contactId,
        managerId: "mgr-1",
        startsAt: starts,
        status: "SCHEDULED",
      },
    });
    await prisma.meeting.create({
      data: {
        contactId: writer.contactId,
        managerId: "mgr-1",
        startsAt: starts,
        status: "CANCELLED",
      },
    });
    await prisma.contact.update({
      where: { id: buyer.contactId },
      data: { status: "WON", dealAmount: 89000, closedAt: new Date() },
    });

    const range = { from: new Date(Date.now() - 60_000), to: new Date(Date.now() + 60_000) };
    const rows = await trackingFunnel(prisma, range);
    const instagram = rows.find((r) => r.slug === "instagram");
    const tiktok = rows.find((r) => r.slug === "tiktok");
    expect(instagram?.clicks).toBe(3);
    expect(instagram?.wrote).toBe(2);
    expect(instagram?.demos).toBe(1);
    expect(instagram?.sales).toBe(1);
    expect(instagram?.revenue).toBe(89000);
    expect(instagram?.clickToWrite).toBe(66.7);
    expect(tiktok?.clicks).toBe(1);
    expect(tiktok?.wrote).toBe(1);
    expect(tiktok?.demos).toBe(0);
    expect(tiktok?.sales).toBe(0);
  });
});

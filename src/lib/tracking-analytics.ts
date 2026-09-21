import type { PrismaClient } from "@prisma/client";
import type { DateRange } from "./analytics";
import { DEFAULT_TRACKING_CHANNELS, ensureTrackingChannels } from "./tracking";

export type ChannelFunnelRow = {
  slug: string;
  title: string;
  source: string;
  clicks: number;
  wrote: number;
  demos: number;
  sales: number;
  revenue: number;
  clickToWrite: number;
  writeToDemo: number;
  writeToSale: number;
};

export function ratioPct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function sortChannels<T extends { slug: string }>(rows: T[]) {
  const order = DEFAULT_TRACKING_CHANNELS.map((ch) => ch.slug);
  return rows.slice().sort((a, b) => {
    const ia = order.indexOf(a.slug);
    const ib = order.indexOf(b.slug);
    if (ia === -1 && ib === -1) return a.slug.localeCompare(b.slug);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export async function trackingFunnel(db: PrismaClient, range: DateRange, managerId?: string) {
  await ensureTrackingChannels(db);
  const channels = await db.trackingChannel.findMany({ where: { isActive: true } });
  const created = { gte: range.from, lte: range.to };
  const contactFilter = managerId ? { contact: { managerId } } : {};

  const [clickRows, wroteRows] = await Promise.all([
    db.trackingClick.groupBy({
      by: ["slug"],
      where: { createdAt: created, ...(managerId ? { contact: { managerId } } : {}) },
      _count: { _all: true },
    }),
    db.trackingClick.groupBy({
      by: ["slug"],
      where: { convertedAt: created, contactId: { not: null }, ...contactFilter },
      _count: { _all: true },
    }),
  ]);

  const clickMap = Object.fromEntries(clickRows.map((row) => [row.slug, row._count._all]));
  const wroteMap = Object.fromEntries(wroteRows.map((row) => [row.slug, row._count._all]));

  const rows: ChannelFunnelRow[] = [];
  for (const ch of sortChannels(channels)) {
    const attributed = { trackingClicks: { some: { slug: ch.slug } }, ...(managerId ? { managerId } : {}) };
    const [demos, won] = await Promise.all([
      db.meeting.count({
        where: {
          startsAt: created,
          status: { not: "CANCELLED" },
          contact: attributed,
          ...(managerId ? { managerId } : {}),
        },
      }),
      db.contact.aggregate({
        where: {
          ...attributed,
          status: "WON",
          OR: [{ closedAt: created }, { closedAt: null, updatedAt: created }],
        },
        _count: true,
        _sum: { dealAmount: true },
      }),
    ]);
    const clicks = clickMap[ch.slug] || 0;
    const wrote = wroteMap[ch.slug] || 0;
    const sales = won._count;
    rows.push({
      slug: ch.slug,
      title: ch.title,
      source: ch.source,
      clicks,
      wrote,
      demos,
      sales,
      revenue: Number(won._sum.dealAmount || 0),
      clickToWrite: ratioPct(wrote, clicks),
      writeToDemo: ratioPct(demos, wrote),
      writeToSale: ratioPct(sales, wrote),
    });
  }
  return rows;
}

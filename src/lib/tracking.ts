import crypto from "crypto";
import type { ContactSource, PrismaClient } from "@prisma/client";

export const TRACK_TOKEN_RE = /\bqc:([a-f0-9]{8})\b/i;

export type ChannelSeed = {
  slug: string;
  source: ContactSource;
  title: string;
  greeting: string;
  waPrefill: string;
};

export const DEFAULT_TRACKING_CHANNELS: ChannelSeed[] = [
  {
    slug: "instagram",
    source: "INSTAGRAM",
    title: "Instagram",
    waPrefill: "qc:{token}",
    greeting: "",
  },
  {
    slug: "tiktok",
    source: "TIKTOK",
    title: "TikTok",
    waPrefill: "qc:{token}",
    greeting: "",
  },
  {
    slug: "facebook",
    source: "FACEBOOK",
    title: "Facebook / Reels",
    waPrefill: "qc:{token}",
    greeting: "",
  },
  {
    slug: "youtube",
    source: "YOUTUBE",
    title: "YouTube",
    waPrefill: "qc:{token}",
    greeting: "",
  },
  {
    slug: "site",
    source: "WEBSITE",
    title: "Сайт / QR",
    waPrefill: "qc:{token}",
    greeting: "",
  },
  {
    slug: "ads",
    source: "OTHER",
    title: "Басқа жарнама",
    waPrefill: "qc:{token}",
    greeting: "",
  },
];

export function parseTrackToken(text?: string | null) {
  if (!text) return null;
  const match = text.match(TRACK_TOKEN_RE);
  return match ? match[1].toLowerCase() : null;
}

export function newTrackToken() {
  return crypto.randomBytes(4).toString("hex");
}

export function publicWhatsAppNumber() {
  return (process.env.WHATSAPP_PUBLIC_NUMBER || "").replace(/\D/g, "");
}

export function whatsappClickUrl(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export async function ensureTrackingChannels(db: PrismaClient) {
  for (const ch of DEFAULT_TRACKING_CHANNELS) {
    await db.trackingChannel.upsert({
      where: { slug: ch.slug },
      update: { greeting: ch.greeting, waPrefill: ch.waPrefill },
      create: ch,
    });
  }
}

export async function recordTrackingClick(
  db: PrismaClient,
  params: { slug: string; ip?: string; userAgent?: string },
) {
  await ensureTrackingChannels(db);
  const channel = await db.trackingChannel.findUnique({ where: { slug: params.slug } });
  if (!channel || !channel.isActive) return null;
  const token = newTrackToken();
  const click = await db.trackingClick.create({
    data: {
      token,
      slug: channel.slug,
      source: channel.source,
      ip: params.ip?.slice(0, 80) || null,
      userAgent: params.userAgent?.slice(0, 240) || null,
    },
  });
  const prefill = (channel.waPrefill || "qc:{token}").replaceAll("{token}", token);
  return { click, channel, prefill };
}

export async function resolveTrackingClick(db: PrismaClient, text?: string | null) {
  const token = parseTrackToken(text);
  if (!token) return null;
  const click = await db.trackingClick.findUnique({
    where: { token },
    include: { channel: true },
  });
  if (!click) return null;
  return click;
}

export async function convertTrackingClick(
  db: PrismaClient,
  params: { token: string; contactId: string },
) {
  const click = await db.trackingClick.findUnique({ where: { token: params.token }, include: { channel: true } });
  if (!click) return null;
  if (!click.convertedAt) {
    await db.trackingClick.update({
      where: { id: click.id },
      data: { convertedAt: new Date(), contactId: params.contactId },
    });
  }
  const contact = await db.contact.findUnique({ where: { id: params.contactId } });
  if (contact) {
    const tag = `${click.channel.title} qc:${click.token}`;
    const comment = contact.comment?.includes(click.token)
      ? contact.comment
      : [contact.comment, tag].filter(Boolean).join(" · ");
    const source =
      contact.source === "WHATSAPP" || contact.source === "MANUAL" ? click.source : contact.source;
    await db.contact.update({
      where: { id: contact.id },
      data: { source, comment },
    });
  }
  await db.lead.updateMany({
    where: { contactId: params.contactId, processedAt: null },
    data: { source: click.source, campaign: click.slug },
  });
  return click;
}

export async function trackingStats(db: PrismaClient) {
  await ensureTrackingChannels(db);
  const channels = await db.trackingChannel.findMany({ orderBy: { slug: "asc" } });
  const clicks = await db.trackingClick.groupBy({
    by: ["slug"],
    _count: { _all: true },
  });
  const converted = await db.trackingClick.groupBy({
    by: ["slug"],
    where: { convertedAt: { not: null } },
    _count: { _all: true },
  });
  const order = DEFAULT_TRACKING_CHANNELS.map((ch) => ch.slug);
  const clickMap = Object.fromEntries(clicks.map((row) => [row.slug, row._count._all]));
  const convMap = Object.fromEntries(converted.map((row) => [row.slug, row._count._all]));
  const app = (process.env.APP_URL || "").replace(/\/$/, "");
  return channels
    .slice()
    .sort((a, b) => {
      const ia = order.indexOf(a.slug);
      const ib = order.indexOf(b.slug);
      if (ia === -1 && ib === -1) return a.slug.localeCompare(b.slug);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .map((ch) => ({
      ...ch,
      clicks: clickMap[ch.slug] || 0,
      converted: convMap[ch.slug] || 0,
      url: `${app}/w/${ch.slug}`,
    }));
}

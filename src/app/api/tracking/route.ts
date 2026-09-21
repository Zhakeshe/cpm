import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdmin, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { canManageSettings } from "@/lib/rbac";
import { ensureTrackingChannels, trackingStats } from "@/lib/tracking";
import { z } from "zod";
import type { ContactSource } from "@prisma/client";

const SOURCES = [
  "WHATSAPP",
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "YOUTUBE",
  "PHONE_CALL",
  "MANUAL",
  "WEBSITE",
  "REFERRAL",
  "OTHER",
  "META_LEAD_ADS",
] as const;

const slugSchema = z
  .string()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9-]+$/);

export async function GET() {
  try {
    const user = await requireUser();
    if (!canManageSettings(user.role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const channels = await trackingStats(prisma);
    return NextResponse.json({
      channels,
      publicNumber: (process.env.WHATSAPP_PUBLIC_NUMBER || "").replace(/\D/g, ""),
    });
  } catch (err) {
    return jsonError(err);
  }
}

const createSchema = z.object({
  slug: slugSchema,
  source: z.enum(SOURCES),
  title: z.string().min(1).max(80),
  greeting: z.string().max(1000).optional(),
  waPrefill: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAdmin();
    await ensureTrackingChannels(prisma);
    const body = createSchema.parse(await req.json());
    const waPrefill = body.waPrefill || `Сәлем! ${body.title}-тан жазып тұрмын qc:{token}`;
    if (!waPrefill.includes("{token}")) {
      return NextResponse.json({ error: "TOKEN_PLACEHOLDER_REQUIRED" }, { status: 400 });
    }
    const channel = await prisma.trackingChannel.create({
      data: {
        slug: body.slug,
        source: body.source as ContactSource,
        title: body.title,
        greeting: body.greeting || "",
        waPrefill,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "tracking.create",
        entityType: "TrackingChannel",
        entityId: channel.slug,
        newValue: { slug: channel.slug, source: channel.source },
      },
    });
    return NextResponse.json(channel);
  } catch (err) {
    return jsonError(err);
  }
}

const patchSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(80).optional(),
  greeting: z.string().max(1000).optional(),
  waPrefill: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireAdmin();
    const body = patchSchema.parse(await req.json());
    if (body.waPrefill && !body.waPrefill.includes("{token}")) {
      return NextResponse.json({ error: "TOKEN_PLACEHOLDER_REQUIRED" }, { status: 400 });
    }
    const data: { title?: string; greeting?: string; waPrefill?: string; isActive?: boolean } = {};
    if (body.title) data.title = body.title;
    if (typeof body.greeting === "string") data.greeting = body.greeting;
    if (typeof body.waPrefill === "string") data.waPrefill = body.waPrefill;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    const channel = await prisma.trackingChannel.update({ where: { slug: body.slug }, data });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "tracking.update",
        entityType: "TrackingChannel",
        entityId: channel.slug,
        newValue: data,
      },
    });
    return NextResponse.json(channel);
  } catch (err) {
    return jsonError(err);
  }
}

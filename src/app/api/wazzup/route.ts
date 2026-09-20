import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canManageSettings } from "@/lib/rbac";
import { getWazzupConfig } from "@/lib/whatsapp-transport";
import { listWazzupChannels, subscribeWazzupWebhooks } from "@/lib/wazzup";

export async function GET() {
  try {
    const user = await requireUser();
    if (!canManageSettings(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const cfg = await getWazzupConfig(prisma);
    const row = await prisma.integration.findUnique({ where: { type: "WAZZUP" } });
    let channels: unknown[] = [];
    if (cfg.apiKey) {
      try {
        channels = await listWazzupChannels(prisma);
      } catch {
        channels = [];
      }
    }
    return NextResponse.json({
      configured: cfg.configured,
      hasApiKey: Boolean(cfg.apiKey),
      channelId: cfg.channelId,
      status: row?.status || "DISCONNECTED",
      lastError: row?.lastError,
      lastSyncAt: row?.lastSyncAt,
      channels,
    });
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  apiKey: z.string().optional(),
  channelId: z.string().optional(),
  subscribe: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!canManageSettings(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const body = schema.parse(await req.json());
    const existing = await prisma.integration.findUnique({ where: { type: "WAZZUP" } });
    const prev = (existing?.config || {}) as { apiKey?: string; channelId?: string };
    const config = {
      apiKey: body.apiKey?.trim() || prev.apiKey || "",
      channelId: body.channelId?.trim() || prev.channelId || "",
    };
    await prisma.integration.upsert({
      where: { type: "WAZZUP" },
      create: { type: "WAZZUP", status: config.apiKey && config.channelId ? "CONNECTED" : "DISCONNECTED", config },
      update: { status: config.apiKey && config.channelId ? "CONNECTED" : "DISCONNECTED", config, lastError: null },
    });
    if (body.subscribe) {
      const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
      await subscribeWazzupWebhooks(prisma, `${appUrl}/api/webhooks/wazzup`);
      await prisma.integration.update({
        where: { type: "WAZZUP" },
        data: { lastSyncAt: new Date(), lastError: null },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    await prisma.integration.upsert({
      where: { type: "WAZZUP" },
      create: { type: "WAZZUP", status: "ERROR", config: {}, lastError: (err as Error).message },
      update: { status: "ERROR", lastError: (err as Error).message },
    }).catch(() => undefined);
    return jsonError(err);
  }
}

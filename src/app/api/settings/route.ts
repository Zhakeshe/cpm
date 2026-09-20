import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdmin, requireUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { canManageSettings } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await requireUser();
    if (!canManageSettings(user.role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const [integrations, sla, routing] = await Promise.all([
      prisma.integration.findMany(),
      prisma.systemSetting.findUnique({ where: { key: "lead_sla" } }),
      prisma.systemSetting.findUnique({ where: { key: "call_routing" } }),
    ]);
    const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
    return NextResponse.json({
      integrations,
      sla: sla?.value || { enabled: false, minutes: 10, action: "NOTIFY_MANAGER" },
      routing: routing?.value || {
        existingContact: "responsible",
        fallback: "queue",
      },
      webhooks: {
        whatsappVerify: `${appUrl}/api/webhooks/whatsapp`,
        whatsappInbound: `${appUrl}/api/webhooks/whatsapp`,
        metaLeads: `${appUrl}/api/webhooks/meta-leads`,
        telephony: `${appUrl}/api/webhooks/telephony`,
        publicForm: `${appUrl}/go`,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await req.json();
    if (body.sla) {
      await prisma.systemSetting.upsert({
        where: { key: "lead_sla" },
        create: { key: "lead_sla", value: body.sla },
        update: { value: body.sla },
      });
    }
    if (body.routing) {
      await prisma.systemSetting.upsert({
        where: { key: "call_routing" },
        create: { key: "call_routing", value: body.routing },
        update: { value: body.routing },
      });
    }
    if (body.integration) {
      await prisma.integration.upsert({
        where: { type: body.integration.type },
        create: {
          type: body.integration.type,
          status: body.integration.status || "DISCONNECTED",
          config: body.integration.config || {},
          lastError: body.integration.lastError,
        },
        update: {
          status: body.integration.status,
          config: body.integration.config,
          lastError: body.integration.lastError,
          lastSyncAt: new Date(),
        },
      });
    }
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "settings.update",
        entityType: "SystemSetting",
        entityId: "global",
        newValue: body,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

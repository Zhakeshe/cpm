import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAdmin, requireRole } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getGreetingConfig, GREETING_SETTING } from "@/lib/whatsapp-greeting";

const schema = z.object({ enabled: z.boolean(), text: z.string().trim().min(1).max(4000) });

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPERVISOR"]);
    return NextResponse.json(await getGreetingConfig(prisma));
  } catch (err) { return jsonError(err); }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = schema.parse(await req.json());
    if (/\[Instagram[^\]]*\]/iu.test(body.text)) {
      return NextResponse.json({ error: "INSTAGRAM_LINK_REQUIRED" }, { status: 400 });
    }
    const previous = await getGreetingConfig(prisma);
    const config = {
      ...body,
      enabledAt: body.enabled ? (previous.enabled && previous.enabledAt || new Date().toISOString()) : previous.enabledAt,
    };
    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: GREETING_SETTING },
        create: { key: GREETING_SETTING, value: config },
        update: { value: config },
      }),
      prisma.auditLog.create({
        data: { actorId: user.id, action: "whatsapp.greeting.update", entityType: "SystemSetting", entityId: GREETING_SETTING, oldValue: previous, newValue: config },
      }),
    ]);
    return NextResponse.json(config);
  } catch (err) { return jsonError(err); }
}

import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { syncWabaFromMeta, wabaPublicStatus } from "@/lib/meta-waba";

export async function GET() {
  try {
    await requireAdmin();
    const integration = await prisma.integration.findUnique({ where: { type: "WHATSAPP_BUSINESS" } });
    return NextResponse.json(
      wabaPublicStatus(
        integration || { status: "DISCONNECTED", lastSyncAt: null, lastError: null, config: {} },
      ),
    );
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST() {
  try {
    const actor = await requireAdmin();
    const result = await syncWabaFromMeta(prisma, actor.id);
    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err);
  }
}

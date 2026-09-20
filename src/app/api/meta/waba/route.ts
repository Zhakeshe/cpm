/** PARKED Meta WABA settings sync. Do not delete — restore with WHATSAPP_TRANSPORT=meta. */
import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { isMetaWabaParked } from "@/lib/meta-waba-parked";
import { syncWabaFromMeta, wabaPublicStatus } from "@/lib/meta-waba";
import { whatsappTransport } from "@/lib/whatsapp-transport";

export async function GET() {
  try {
    await requireAdmin();
    const integration = await prisma.integration.findUnique({ where: { type: "WHATSAPP_BUSINESS" } });
    const transport = await whatsappTransport(prisma);
    return NextResponse.json({
      ...wabaPublicStatus(
        integration || { status: "DISCONNECTED", lastSyncAt: null, lastError: null, config: {} },
      ),
      parked: isMetaWabaParked(transport),
      transport,
    });
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

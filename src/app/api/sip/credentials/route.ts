import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { ZADARMA_DEFAULTS } from "@/lib/zadarma";
import { resolveSipAccount, type SipSettings } from "@/lib/sip-config";

/**
 * WebRTC registration needs SIP credentials in the browser, so they are handed
 * out per authenticated user instead of being bundled into the frontend build.
 */
export async function GET() {
  try {
    const user = await requireUser();
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { sipExtension: true, sipUsername: true },
    });
    const integration = await prisma.integration.findUnique({ where: { type: "TELEPHONY" } });
    const config = (integration?.config || {}) as SipSettings;
    const wsUrl = config.wsUrl || process.env.SIP_WS_URL || ZADARMA_DEFAULTS.wsUrl;
    const domain = config.domain || process.env.SIP_DOMAIN || ZADARMA_DEFAULTS.domain;
    const extension = me?.sipExtension || "";
    const account = resolveSipAccount(config, extension, me?.sipUsername);

    if (!wsUrl || !domain || !extension || !account) {
      return NextResponse.json({
        enabled: false,
        reason: !extension ? "NO_EXTENSION" : "NOT_CONFIGURED",
      });
    }

    return NextResponse.json({
      enabled: true,
      wsUrl,
      uri: `sip:${account.username}@${domain}`,
      password: account.password,
      extension,
      displayName: user.name,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return jsonError(err);
  }
}

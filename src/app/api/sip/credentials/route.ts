import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { ZADARMA_DEFAULTS } from "@/lib/zadarma";

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
    const config = (integration?.config || {}) as {
      wsUrl?: string;
      domain?: string;
      extensions?: Record<string, string>;
    };
    const wsUrl = config.wsUrl || process.env.SIP_WS_URL || ZADARMA_DEFAULTS.wsUrl;
    const domain = config.domain || process.env.SIP_DOMAIN || ZADARMA_DEFAULTS.domain;
    const extension = me?.sipExtension || "";
    const password = extension ? config.extensions?.[extension] : undefined;

    if (!wsUrl || !domain || !extension || !password) {
      return NextResponse.json({
        enabled: false,
        reason: !extension ? "NO_EXTENSION" : "NOT_CONFIGURED",
      });
    }

    return NextResponse.json({
      enabled: true,
      wsUrl,
      uri: `sip:${me?.sipUsername || extension}@${domain}`,
      password,
      extension,
      displayName: user.name,
    });
  } catch (err) {
    return jsonError(err);
  }
}

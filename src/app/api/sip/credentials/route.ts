import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { zadarmaWebrtcCredentials } from "@/lib/zadarma-webrtc";
import { ZADARMA_DEFAULTS, zadarmaCredentials, zadarmaWebrtcKey } from "@/lib/zadarma";
import { resolveSipAccount, type SipSettings } from "@/lib/sip-config";

/**
 * WebRTC registration needs SIP credentials in the browser, so they are handed
 * out per authenticated user instead of being bundled into the frontend build.
 */
export async function GET(req: Request) {
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

    const dynamic = zadarmaCredentials().configured;
    if (!extension || (!dynamic && (!wsUrl || !domain || !account))) {
      return NextResponse.json({
        enabled: false,
        reason: !extension ? "NO_EXTENSION" : "NOT_CONFIGURED",
      }, { headers: { "Cache-Control": "no-store" } });
    }

    // The provider handshake belongs to the caller's browser/network, as in its official client.
    if (dynamic && new URL(req.url).searchParams.get("browser") === "1") {
      const sip = account?.username || me?.sipUsername || extension;
      const key = await zadarmaWebrtcKey(sip);
      return NextResponse.json({ enabled: true, provider: "zadarma", key, sip, extension, displayName: user.name }, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const registration = dynamic
      ? await zadarmaWebrtcCredentials(account?.username || me?.sipUsername || extension, process.env.APP_URL || new URL(req.url).origin)
      : { wsUrl, uri: `sip:${account!.username}@${domain}`, password: account!.password };

    return NextResponse.json({
      enabled: true,
      ...registration,
      extension,
      displayName: user.name,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return jsonError(err);
  }
}

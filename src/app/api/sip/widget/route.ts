import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { resolveOutboundSipAccount } from "@/lib/sip-config";
import { zadarmaApiGet, ZadarmaError } from "@/lib/zadarma";
import { zadarmaWidgetDocument } from "@/lib/zadarma-widget";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    if (process.env.SIP_BROWSER_MODE !== "zadarma-widget") throw new ZadarmaError("WEBRTC_NOT_CONFIGURED", 503);
    const manager = await prisma.user.findUnique({
      where: { id: user.id }, select: { sipExtension: true, sipUsername: true },
    });
    if (!manager) throw new ZadarmaError("SIP_ACCOUNT_NOT_CONFIGURED", 503);
    const { sipAccount } = resolveOutboundSipAccount(manager);
    const result = await zadarmaApiGet("/v1/webrtc/get_key/", { sip: sipAccount });
    if (typeof result.key !== "string" || !result.key) throw new ZadarmaError("ZADARMA_API_ERROR");
    return new Response(zadarmaWidgetDocument(result.key, sipAccount), { headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Frame-Options": "SAMEORIGIN",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    const response = jsonError(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicWhatsAppNumber, recordTrackingClick, whatsappClickUrl } from "@/lib/tracking";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const phone = publicWhatsAppNumber();
  const recorded = await recordTrackingClick(prisma, {
    slug: slug.toLowerCase(),
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: req.headers.get("user-agent") || undefined,
  });
  if (!recorded) {
    return NextResponse.json({ error: "UNKNOWN_CHANNEL" }, { status: 404 });
  }
  if (!phone) {
    return NextResponse.json(
      { error: "WHATSAPP_PUBLIC_NUMBER is not set", token: recorded.click.token },
      { status: 503 },
    );
  }
  return NextResponse.redirect(whatsappClickUrl(phone, recorded.prefill), 302);
}

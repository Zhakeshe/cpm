import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueWebhook } from "@/lib/queue";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  if (token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const eventId = String(payload.leadgen_id || payload.id || `meta-${Date.now()}`);
  try {
    const saved = await prisma.webhookEvent.create({
      data: {
        provider: "meta-leads",
        eventId,
        eventType: "leadgen",
        payload,
      },
    });
    await enqueueWebhook({ webhookEventId: saved.id, provider: "meta-leads" });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw err;
  }
  return NextResponse.json({ ok: true });
}

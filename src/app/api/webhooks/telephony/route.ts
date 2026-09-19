import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueWebhook } from "@/lib/queue";
import { verifySipSecret } from "@/lib/telephony";

export async function POST(req: NextRequest) {
  const secret = process.env.SIP_WEBHOOK_SECRET || "";
  const header = req.headers.get("x-sip-secret") || req.headers.get("authorization")?.replace("Bearer ", "") || null;
  if (secret && !verifySipSecret(header, secret)) {
    return NextResponse.json({ error: "INVALID_SECRET" }, { status: 401 });
  }
  const payload = await req.json();
  const eventId = String(payload.callId || payload.id || "");
  if (!eventId) return NextResponse.json({ error: "callId required" }, { status: 400 });
  const composite = `${eventId}:${payload.event || "update"}`;
  try {
    const saved = await prisma.webhookEvent.create({
      data: {
        provider: "telephony",
        eventId: composite,
        eventType: payload.event || "call",
        payload,
      },
    });
    await enqueueWebhook({ webhookEventId: saved.id, provider: "telephony" });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw err;
  }
  return NextResponse.json({ ok: true });
}

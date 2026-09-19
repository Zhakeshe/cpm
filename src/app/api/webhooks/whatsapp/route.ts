import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueWebhook } from "@/lib/queue";
import { verifyWhatsAppSignature } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.WHATSAPP_APP_SECRET || "";
  const sig = req.headers.get("x-hub-signature-256");
  if (secret && !verifyWhatsAppSignature(raw, sig, secret)) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const eventId = crypto.createHash("sha256").update(raw).digest("hex");
  try {
    const saved = await prisma.webhookEvent.create({
      data: {
        provider: "whatsapp",
        eventId,
        eventType: "whatsapp.webhook",
        payload: payload as object,
      },
    });
    await enqueueWebhook({ webhookEventId: saved.id, provider: "whatsapp" });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw err;
  }
  return NextResponse.json({ ok: true });
}

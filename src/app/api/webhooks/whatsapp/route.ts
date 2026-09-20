/** PARKED Meta webhook. Route stays live for later restore. Do not delete. */
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  logWhatsAppWebhook,
  metaAppSecret,
  type MetaWhatsAppPayload,
  verifyMetaSignature,
  verifyWhatsAppHub,
} from "@/lib/meta-webhook";
import { enqueueWebhook } from "@/lib/queue";

export async function GET(req: NextRequest) {
  const verified = verifyWhatsAppHub({
    mode: req.nextUrl.searchParams.get("hub.mode"),
    token: req.nextUrl.searchParams.get("hub.verify_token"),
    challenge: req.nextUrl.searchParams.get("hub.challenge"),
  });
  if (verified.ok) {
    return new NextResponse(verified.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = metaAppSecret();
  const signature = req.headers.get("x-hub-signature-256");

  // GET verification never uses the app secret. POST is signed when a secret exists.
  // Missing secret must not block first-time Meta setup; production still warns.
  if (secret) {
    if (!verifyMetaSignature(raw, signature, secret)) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn("whatsapp_webhook_unsigned: set META_APP_SECRET or WHATSAPP_APP_SECRET");
  }

  let payload: MetaWhatsAppPayload;
  try {
    payload = JSON.parse(raw) as MetaWhatsAppPayload;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  logWhatsAppWebhook(payload);

  const eventId = crypto.createHash("sha256").update(raw).digest("hex");
  try {
    const saved = await prisma.webhookEvent.create({
      data: {
        provider: "whatsapp",
        eventId,
        eventType: payload.object || "whatsapp.webhook",
        payload: payload as object,
      },
    });
    await enqueueWebhook({ webhookEventId: saved.id, provider: "whatsapp" });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ success: true, duplicate: true });
    }
    throw err;
  }
  return NextResponse.json({ success: true });
}

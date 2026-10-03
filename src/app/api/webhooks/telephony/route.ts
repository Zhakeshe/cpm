import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueWebhook } from "@/lib/queue";
import { verifySipSecret } from "@/lib/telephony";
import {
  isZadarmaNotify,
  mapZadarmaNotify,
  verifyZadarmaSignature,
  zadarmaCredentials,
  zadarmaWebhookEventId,
} from "@/lib/zadarma";

export async function GET(req: NextRequest) {
  const echo = req.nextUrl.searchParams.get("zd_echo");
  if (echo != null) return new NextResponse(echo, { headers: { "Content-Type": "text/plain" } });
  return NextResponse.json({ ok: true, provider: "zadarma" });
}

async function parseBody(req: NextRequest): Promise<Record<string, unknown>> {
  const ctype = req.headers.get("content-type") || "";
  if (ctype.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    return Object.fromEntries(new URLSearchParams(text).entries());
  }
  if (ctype.includes("multipart/form-data")) {
    const form = await req.formData();
    return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  }
  return (await req.json()) as Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const payload = await parseBody(req);

  if (isZadarmaNotify(payload)) {
    const fields = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v == null ? "" : String(v)]));
    const secret = zadarmaCredentials().secret;
    const signature = req.headers.get("signature") || req.headers.get("Signature");
    const eventType = /^[A-Z_]{1,40}$/.test(fields.event || "") ? fields.event : "UNKNOWN";
    console.info("[ZADARMA] webhook received", { eventType, signaturePresent: Boolean(signature) });
    if (!verifyZadarmaSignature(fields, signature, secret)) {
      console.warn("[ZADARMA] webhook rejected", { eventType, reason: "INVALID_SIGNATURE" });
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    }
    const mapped = mapZadarmaNotify(payload);
    if (!mapped) return NextResponse.json({ ok: true, ignored: payload.event });
    // Preserve INTERNAL after START, per-extension routing and distinct recordings.
    const composite = zadarmaWebhookEventId(fields);
    try {
      const saved = await prisma.webhookEvent.create({
        data: {
          provider: "telephony",
          eventId: composite,
          eventType: mapped.event,
          payload: mapped,
        },
      });
      await enqueueWebhook({ webhookEventId: saved.id, provider: "telephony" });
      console.info("[ZADARMA] webhook accepted", { eventType, webhookEventId: saved.id });
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      throw err;
    }
    return NextResponse.json({ ok: true });
  }

  const secret = process.env.SIP_WEBHOOK_SECRET || "";
  const header = req.headers.get("x-sip-secret") || req.headers.get("authorization")?.replace("Bearer ", "") || null;
  if (!verifySipSecret(header, secret)) {
    return NextResponse.json({ error: "INVALID_SECRET" }, { status: 401 });
  }
  const eventId = String(payload.callId || payload.id || "");
  if (!eventId) return NextResponse.json({ error: "callId required" }, { status: 400 });
  const composite = `${eventId}:${payload.event || "update"}`;
  try {
    const saved = await prisma.webhookEvent.create({
      data: {
        provider: "telephony",
        eventId: composite,
        eventType: String(payload.event || "call"),
        payload: payload as object,
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

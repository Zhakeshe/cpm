import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueWebhook } from "@/lib/queue";
import { verifyWhatsAppSignature } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const expected = process.env.META_LEADS_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && token && token === expected) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.WHATSAPP_APP_SECRET || "";
  if (secret && !verifyWhatsAppSignature(raw, req.headers.get("x-hub-signature-256"), secret)) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const leadgenIds = collectLeadgenIds(payload);
  const eventId = leadgenIds.length
    ? `leadgen:${leadgenIds.join(",")}`
    : `meta:${crypto.createHash("sha256").update(raw).digest("hex")}`;

  try {
    const saved = await prisma.webhookEvent.create({
      data: {
        provider: "meta-leads",
        eventId,
        eventType: "leadgen",
        payload: payload as object,
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

function collectLeadgenIds(payload: unknown): string[] {
  const body = payload as {
    entry?: Array<{ changes?: Array<{ value?: { leadgen_id?: string } }> }>;
  };
  const ids: string[] = [];
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.value?.leadgen_id) ids.push(change.value.leadgen_id);
    }
  }
  return ids;
}

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueWebhook } from "@/lib/queue";
import { isWazzupPayload } from "@/lib/wazzup-inbound";

export async function GET() {
  return NextResponse.json({ ok: true, provider: "wazzup" });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  if (!isWazzupPayload(payload)) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  if ((payload as { test?: boolean }).test) {
    return NextResponse.json({ success: true, test: true });
  }
  const eventId = crypto.createHash("sha256").update(raw).digest("hex");
  try {
    const saved = await prisma.webhookEvent.create({
      data: {
        provider: "wazzup",
        eventId,
        eventType: "wazzup.messages",
        payload: payload as object,
      },
    });
    await enqueueWebhook({ webhookEventId: saved.id, provider: "wazzup" });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ success: true, duplicate: true });
    }
    throw err;
  }
  return NextResponse.json({ success: true });
}

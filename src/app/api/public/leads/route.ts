import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { capturePublicLead } from "@/lib/public-leads";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(5).max(32),
  comment: z.string().trim().max(500).optional(),
  campaign: z.string().trim().max(80).optional(),
  website: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = await rateLimit(`public-lead:${ip}`, 8, 15 * 60);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_FIELDS" }, { status: 400 });
  }
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  try {
    const ingest = await capturePublicLead(prisma, parsed.data);
    return NextResponse.json({ ok: true, duplicate: ingest.duplicate });
  } catch (err) {
    const message = (err as Error).message;
    if (message === "PHONE_REQUIRED") {
      return NextResponse.json({ error: "PHONE_REQUIRED" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "ERROR" }, { status: 500 });
  }
}

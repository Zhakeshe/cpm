import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const attempts = new Map<string, { count: number; ts: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.ts > 15 * 60 * 1000) {
    attempts.set(ip, { count: 1, ts: now });
    return true;
  }
  rec.count += 1;
  return rec.count <= 20;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }
  const body = schema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: "ACCOUNT_DISABLED" }, { status: 403 });
  }
  const ok = await verifyPassword(body.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }
  await setSessionCookie({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "auth.login",
      entityType: "User",
      entityId: user.id,
      ip,
    },
  });
  await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

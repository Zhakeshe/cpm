import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { verifyTotp } from "@/lib/totp";
import { z } from "zod";

const schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  totp: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const body = schema.parse(await req.json());
  const perIp = await rateLimit(`login:ip:${ip}`, 20, 15 * 60);
  const perAccount = await rateLimit(`login:email:${body.email.toLowerCase()}`, 10, 15 * 60);
  if (!perIp.ok || !perAccount.ok) {
    return tooManyRequests(Math.max(perIp.retryAfter, perAccount.retryAfter));
  }
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
  if (user.totpEnabled) {
    if (!body.totp) {
      return NextResponse.json({ totpRequired: true }, { status: 401 });
    }
    if (!user.totpSecret || !verifyTotp(user.totpSecret, body.totp)) {
      return NextResponse.json({ error: "INVALID_TOTP" }, { status: 401 });
    }
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

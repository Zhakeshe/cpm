import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { generateTotpSecret, otpauthUrl, verifyTotp } from "@/lib/totp";

export async function GET() {
  try {
    const user = await requireUser();
    const live = await prisma.user.findUnique({ where: { id: user.id }, select: { totpEnabled: true } });
    return NextResponse.json({ enabled: Boolean(live?.totpEnabled) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = z.object({ action: z.enum(["start", "confirm", "disable"]), code: z.string().optional() }).parse(await req.json());
    if (body.action === "start") {
      const secret = generateTotpSecret();
      await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret, totpEnabled: false } });
      return NextResponse.json({ secret, url: otpauthUrl(user.email, secret) });
    }
    const live = await prisma.user.findUnique({ where: { id: user.id } });
    if (!live?.totpSecret) return NextResponse.json({ error: "NO_SECRET" }, { status: 400 });
    if (!verifyTotp(live.totpSecret, body.code || "")) {
      return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
    }
    if (body.action === "disable") {
      await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: false, totpSecret: null } });
      return NextResponse.json({ enabled: false });
    }
    await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
    return NextResponse.json({ enabled: true });
  } catch (err) {
    return jsonError(err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const { token, password } = schema.parse(await req.json());
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return NextResponse.json({ ok: true });
}

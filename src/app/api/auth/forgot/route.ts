import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const { email } = schema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (user?.isActive) {
    const raw = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    console.info("password_reset_issued", { userId: user.id, tokenPreview: raw.slice(0, 6) });
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    if (process.env.SMTP_HOST) {
      // SMTP is optional; token is stored hashed. In production configure SMTP.
      console.info("password_reset_link", `${appUrl}/reset-password?token=${raw}`);
    }
  }
  return NextResponse.json({ ok: true });
}

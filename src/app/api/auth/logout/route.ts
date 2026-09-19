import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (session) {
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: "auth.logout",
        entityType: "User",
        entityId: session.id,
      },
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

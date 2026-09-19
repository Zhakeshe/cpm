import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      sipExtension: true,
      acceptsNewLeads: true,
      isOnline: true,
    },
  });
  if (!user?.isActive) return NextResponse.json({ error: "ACCOUNT_DISABLED" }, { status: 403 });
  return NextResponse.json(user);
}

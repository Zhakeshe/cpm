import { NextResponse } from "next/server";
import { jsonError, requireRole } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPERVISOR"]);
    const logs = await prisma.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return NextResponse.json(logs);
  } catch (err) {
    return jsonError(err);
  }
}

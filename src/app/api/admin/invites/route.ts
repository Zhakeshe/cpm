import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const role = searchParams.get("role")?.trim() ?? "";
  const sort = searchParams.get("sort") === "asc" ? "asc" : "desc";

  const rows = await prisma.teamInvite.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { social: { contains: q, mode: "insensitive" } },
                { grade: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        role ? { role: { equals: role } } : {},
      ],
    },
    orderBy: { createdAt: sort },
  });

  return NextResponse.json({ invites: rows });
}

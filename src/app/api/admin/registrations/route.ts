import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const school = searchParams.get("school")?.trim() ?? "";
  const sort = searchParams.get("sort") === "asc" ? "asc" : "desc";

  const rows = await prisma.scrimmageRegistration.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { teamName: { contains: q, mode: "insensitive" } },
                { teamNumber: { contains: q, mode: "insensitive" } },
                { captainName: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        school ? { school: { equals: school, mode: "insensitive" } } : {},
      ],
    },
    orderBy: { createdAt: sort },
  });

  const schools = await prisma.scrimmageRegistration.findMany({
    distinct: ["school"],
    select: { school: true },
    orderBy: { school: "asc" },
  });

  return NextResponse.json({
    registrations: rows,
    schools: schools.map((item) => item.school),
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.scrimmageRegistration.findMany({
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Team",
    "FTC Number",
    "School",
    "Captain",
    "Phone",
    "Email",
    "Members",
    "Date",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.teamName,
        row.teamNumber ?? "",
        row.school,
        row.captainName,
        row.phone,
        row.email ?? "",
        String(row.memberCount),
        row.createdAt.toISOString(),
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  const filename = `kern-ftc-scrimmage-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

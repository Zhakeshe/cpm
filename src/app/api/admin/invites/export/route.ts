import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { inviteRoleLabel } from "@/lib/constants";

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

  const rows = await prisma.teamInvite.findMany({
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Name",
    "Grade",
    "School",
    "City",
    "Languages",
    "Availability",
    "Heard from",
    "Superpower",
    "Phone",
    "Social",
    "Role",
    "Why",
    "Skills",
    "Portfolio",
    "Date",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.fullName,
        row.grade,
        row.school,
        row.city,
        row.languages,
        row.availability,
        row.heardFrom,
        row.superpower,
        row.phone,
        row.social,
        inviteRoleLabel(row.role),
        row.whyJoin,
        row.skills,
        row.portfolio ?? "",
        row.createdAt.toISOString(),
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  const filename = `kern-ftc-invites-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

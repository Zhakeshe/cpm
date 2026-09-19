import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { csvFilename, toCsv } from "@/lib/csv";
import { exportLeads } from "@/lib/export-data";
import { scopeManagerId } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await exportLeads(scopeManagerId(user.role, user.id));
    const csv = toCsv(rows, [
      { key: "createdAt", label: "created_at" },
      { key: "processedAt", label: "processed_at" },
      { key: "firstName", label: "first_name" },
      { key: "lastName", label: "last_name" },
      { key: "phone", label: "phone" },
      { key: "email", label: "email" },
      { key: "source", label: "source" },
      { key: "manager", label: "manager" },
      { key: "stage", label: "stage" },
      { key: "dealAmount", label: "deal_amount" },
      { key: "comment", label: "comment" },
    ]);
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${csvFilename("leads")}"`,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}

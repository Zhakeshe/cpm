import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { csvFilename, toCsv } from "@/lib/csv";
import { exportCalls } from "@/lib/export-data";
import { scopeManagerId } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await exportCalls(user, scopeManagerId(user.role, user.id));
    const csv = toCsv(rows, [
      { key: "startedAt", label: "started_at" },
      { key: "client", label: "client" },
      { key: "from", label: "from" },
      { key: "to", label: "to" },
      { key: "direction", label: "direction" },
      { key: "status", label: "status" },
      { key: "result", label: "result" },
      { key: "duration", label: "duration_sec" },
      { key: "manager", label: "manager" },
      { key: "recording", label: "recording_url" },
    ]);
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${csvFilename("calls")}"`,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { canManageSettings } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { mapLeadImportRows, parseCsv } from "@/lib/csv";
import { importLeadRows } from "@/lib/import-leads";

const MAX_BYTES = 200 * 1024;
const MAX_ROWS = 500;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!canManageSettings(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const contentType = req.headers.get("content-type") || "";
    let text = "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
      if (file.size > MAX_BYTES) return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
      text = await file.text();
    } else {
      const body = (await req.json()) as { csv?: string };
      text = body.csv || "";
    }
    if (!text.trim()) return NextResponse.json({ error: "EMPTY_CSV" }, { status: 400 });
    if (Buffer.byteLength(text) > MAX_BYTES) return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });

    const mapped = mapLeadImportRows(parseCsv(text));
    if (mapped.error) return NextResponse.json({ error: mapped.error }, { status: 400 });
    if (mapped.rows.length > MAX_ROWS) return NextResponse.json({ error: "TOO_MANY_ROWS" }, { status: 400 });

    const result = await importLeadRows(prisma, mapped.rows, user);
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "leads.import",
        entityType: "Contact",
        entityId: "bulk",
        newValue: { created: result.created, duplicates: result.duplicates, errors: result.errors.length },
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err);
  }
}

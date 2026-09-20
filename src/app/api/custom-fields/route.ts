import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canManageSettings } from "@/lib/rbac";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json(await prisma.customFieldDef.findMany({ orderBy: { name: "asc" } }));
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  key: z.string().min(1).regex(/^[a-z0-9_]+$/),
  fieldType: z.enum(["text", "number", "select"]).default("text"),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!canManageSettings(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const body = schema.parse(await req.json());
    const row = body.id
      ? await prisma.customFieldDef.update({
          where: { id: body.id },
          data: { name: body.name, fieldType: body.fieldType, options: body.options || [], required: body.required ?? false },
        })
      : await prisma.customFieldDef.create({
          data: {
            name: body.name,
            key: body.key,
            fieldType: body.fieldType,
            options: body.options || [],
            required: body.required ?? false,
          },
        });
    return NextResponse.json(row);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!canManageSettings(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
    await prisma.customFieldDef.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

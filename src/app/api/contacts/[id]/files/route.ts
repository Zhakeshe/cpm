import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { putObject, storageConfigured } from "@/lib/storage";

async function loadContact(id: string, userId: string, role: Parameters<typeof scopeManagerId>[0]) {
  const scoped = scopeManagerId(role, userId);
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact || (scoped && contact.managerId !== scoped)) return null;
  return contact;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    if (!(await loadContact(id, user.id, user.role))) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const files = await prisma.contactFile.findMany({
      where: { contactId: id },
      select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(files);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    if (!(await loadContact(id, user.id, user.role))) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const key = `contacts/${id}/${Date.now()}-${file.name}`;
    let storageKey: string | null = null;
    let inlineData: Buffer | null = buf;
    if (storageConfigured()) {
      storageKey = await putObject(key, buf, file.type);
      inlineData = null;
    }
    const row = await prisma.contactFile.create({
      data: {
        contactId: id,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storageKey,
        inlineData: inlineData ? new Uint8Array(inlineData) : null,
      },
    });
    await prisma.activity.create({
      data: { contactId: id, managerId: user.id, type: "NOTE", title: `Файл: ${file.name}`, payload: { fileId: row.id } },
    });
    return NextResponse.json({ id: row.id, fileName: row.fileName, size: row.size });
  } catch (err) {
    return jsonError(err);
  }
}

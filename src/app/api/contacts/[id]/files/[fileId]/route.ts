import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { getObject } from "@/lib/storage";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string; fileId: string }> }) {
  try {
    const user = await requireUser();
    const { id, fileId } = await ctx.params;
    const scoped = scopeManagerId(user.role, user.id);
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact || (scoped && contact.managerId !== scoped)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const file = await prisma.contactFile.findFirst({ where: { id: fileId, contactId: id } });
    if (!file) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    let body: Buffer | null = file.inlineData ? Buffer.from(file.inlineData) : null;
    if (!body && file.storageKey) {
      const obj = await getObject(file.storageKey);
      body = obj?.body || null;
    }
    if (!body) return NextResponse.json({ error: "EMPTY" }, { status: 404 });
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}

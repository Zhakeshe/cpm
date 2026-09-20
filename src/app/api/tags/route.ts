import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canManageSettings } from "@/lib/rbac";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json(await prisma.tag.findMany({ orderBy: { name: "asc" } }));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = z.object({ name: z.string().min(1), color: z.string().optional() }).parse(await req.json());
    if (!canManageSettings(user.role) && user.role !== "SUPERVISOR" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const tag = await prisma.tag.upsert({
      where: { name: body.name.trim() },
      update: { color: body.color || "#2563eb" },
      create: { name: body.name.trim(), color: body.color || "#2563eb" },
    });
    return NextResponse.json(tag);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = z.object({ contactId: z.string(), tagId: z.string(), remove: z.boolean().optional() }).parse(await req.json());
    if (body.remove) {
      await prisma.contactTag.deleteMany({ where: { contactId: body.contactId, tagId: body.tagId } });
      return NextResponse.json({ ok: true });
    }
    await prisma.contactTag.upsert({
      where: { contactId_tagId: { contactId: body.contactId, tagId: body.tagId } },
      create: { contactId: body.contactId, tagId: body.tagId },
      update: {},
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

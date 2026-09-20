import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await prisma.savedView.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = z.object({ name: z.string().min(1), filters: z.record(z.string(), z.unknown()) }).parse(await req.json());
    const view = await prisma.savedView.create({ data: { userId: user.id, name: body.name, filters: body.filters as object } });
    return NextResponse.json(view);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
    await prisma.savedView.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

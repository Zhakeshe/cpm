import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireAdmin, requireUser } from "@/lib/api";
import { canManageSettings } from "@/lib/rbac";
import { z } from "zod";

export async function GET() {
  try {
    const user = await requireUser();
    const where = canManageSettings(user.role) ? {} : { isActive: true };
    const replies = await prisma.quickReply.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    return NextResponse.json(replies);
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAdmin();
    const body = schema.parse(await req.json());
    const reply = await prisma.quickReply.create({
      data: {
        title: body.title,
        body: body.body,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "quick_reply.create",
        entityType: "QuickReply",
        entityId: reply.id,
        newValue: { title: reply.title },
      },
    });
    return NextResponse.json(reply);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireAdmin();
    const body = await req.json();
    const id = z.string().parse(body.id);
    const data: { title?: string; body?: string; isActive?: boolean; sortOrder?: number } = {};
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.body === "string") data.body = body.body;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
    const reply = await prisma.quickReply.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "quick_reply.update",
        entityType: "QuickReply",
        entityId: reply.id,
        newValue: data,
      },
    });
    return NextResponse.json(reply);
  } catch (err) {
    return jsonError(err);
  }
}

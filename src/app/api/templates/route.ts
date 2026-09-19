import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireAdmin, requireUser } from "@/lib/api";
import { placeholdersOf } from "@/lib/templates";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    await requireUser();
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(templates);
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  name: z.string().min(1),
  metaName: z.string().min(1),
  language: z.string().min(2).default("ru"),
  category: z.string().default("MARKETING"),
  body: z.string().min(1),
  status: z.enum(["APPROVED", "PENDING", "REJECTED"]).default("PENDING"),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAdmin();
    const body = schema.parse(await req.json());
    const template = await prisma.messageTemplate.create({
      data: { ...body, placeholders: placeholdersOf(body.body) },
    });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "template.create",
        entityType: "MessageTemplate",
        entityId: template.id,
        newValue: { metaName: template.metaName, status: template.status },
      },
    });
    return NextResponse.json(template);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireAdmin();
    const body = await req.json();
    const id = z.string().parse(body.id);
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.metaName === "string") data.metaName = body.metaName;
    if (typeof body.language === "string") data.language = body.language;
    if (typeof body.category === "string") data.category = body.category;
    if (typeof body.body === "string") {
      data.body = body.body;
      data.placeholders = placeholdersOf(body.body);
    }
    if (body.status) data.status = body.status;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    const template = await prisma.messageTemplate.update({
      where: { id },
      data: data as Prisma.MessageTemplateUpdateInput,
    });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "template.update",
        entityType: "MessageTemplate",
        entityId: template.id,
        newValue: { status: template.status, isActive: template.isActive },
      },
    });
    return NextResponse.json(template);
  } catch (err) {
    return jsonError(err);
  }
}

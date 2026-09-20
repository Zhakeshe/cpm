import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canManageSettings } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await requireUser();
    if (!canManageSettings(user.role) && user.role !== "SUPERVISOR") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(await prisma.automationRule.findMany({ orderBy: { createdAt: "desc" } }));
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  enabled: z.boolean().optional(),
  staleDays: z.number().int().min(1).max(30),
  action: z.enum(["CREATE_TASK", "NOTIFY"]),
  taskType: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!canManageSettings(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const body = schema.parse(await req.json());
    const data = {
      name: body.name,
      enabled: body.enabled ?? true,
      staleDays: body.staleDays,
      action: body.action,
      taskType: body.taskType || "FOLLOW_UP",
    };
    const row = body.id
      ? await prisma.automationRule.update({ where: { id: body.id }, data })
      : await prisma.automationRule.create({ data });
    return NextResponse.json(row);
  } catch (err) {
    return jsonError(err);
  }
}

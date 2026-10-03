import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { requestedManagerId, scopeManagerId } from "@/lib/rbac";
import { countFollowUpQueue, FOLLOW_UP_PRESETS, listFollowUpQueue, scheduleFollowUp } from "@/lib/follow-ups";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const managerId = requestedManagerId(user.role, user.id, req.nextUrl.searchParams.get("manager"));
    const [items, count] = await Promise.all([
      listFollowUpQueue(prisma, managerId),
      countFollowUpQueue(prisma, managerId),
    ]);
    return NextResponse.json({ items, count });
  } catch (err) {
    return jsonError(err);
  }
}

const createSchema = z.object({
  contactId: z.string().min(1),
  preset: z.enum(FOLLOW_UP_PRESETS),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());
    const managerScope = scopeManagerId(user.role, user.id);
    const contact = await prisma.contact.findUnique({ where: { id: body.contactId } });
    if (!contact || (managerScope && contact.managerId !== managerScope)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const managerId = contact.managerId || user.id;
    const task = await scheduleFollowUp(prisma, {
      contactId: contact.id,
      managerId,
      creatorId: user.id,
      preset: body.preset,
      description: body.description,
    });
    return NextResponse.json(task);
  } catch (err) {
    return jsonError(err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canReassignManager, scopeManagerId } from "@/lib/rbac";
import { reassignContact } from "@/lib/contacts";
import { applyContactStage } from "@/lib/outcomes";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  pipelineStageId: z.string().optional(),
  managerId: z.string().optional(),
  tagId: z.string().optional(),
  archive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const scoped = scopeManagerId(user.role, user.id);
    const contacts = await prisma.contact.findMany({
      where: { id: { in: body.ids }, ...(scoped ? { managerId: scoped } : {}) },
    });
    let updated = 0;
    for (const contact of contacts) {
      if (body.managerId) {
        if (!canReassignManager(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
        await reassignContact(prisma, { contactId: contact.id, toUserId: body.managerId, actorId: user.id, reason: "bulk" });
      }
      if (body.pipelineStageId && body.pipelineStageId !== contact.pipelineStageId) {
        await applyContactStage(prisma, {
          contactId: contact.id,
          fromStageId: contact.pipelineStageId,
          toStageId: body.pipelineStageId,
          actorId: user.id,
          contactForRules: contact,
        });
      }
      if (body.tagId) {
        await prisma.contactTag.upsert({
          where: { contactId_tagId: { contactId: contact.id, tagId: body.tagId } },
          create: { contactId: contact.id, tagId: body.tagId },
          update: {},
        });
      }
      if (body.archive) {
        await prisma.contact.update({ where: { id: contact.id }, data: { archivedAt: new Date() } });
      }
      updated += 1;
    }
    return NextResponse.json({ updated });
  } catch (err) {
    return jsonError(err);
  }
}

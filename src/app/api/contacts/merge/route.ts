import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canSeeAllRecords, scopeManagerId } from "@/lib/rbac";
import { mergeContacts } from "@/lib/merge-contacts";

const schema = z.object({
  primaryId: z.string(),
  secondaryId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!canSeeAllRecords(user.role) && user.role !== "MANAGER") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const body = schema.parse(await req.json());
    const scoped = scopeManagerId(user.role, user.id);
    if (scoped) {
      const pair = await prisma.contact.findMany({ where: { id: { in: [body.primaryId, body.secondaryId] } } });
      if (pair.some((c) => c.managerId !== scoped) || pair.length !== 2) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
    }
    const result = await prisma.$transaction((tx) => mergeContacts(tx, { ...body, actorId: user.id }));
    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canListenAllRecordings, scopeManagerId } from "@/lib/rbac";
import { addContactNote } from "@/lib/outcomes";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const managerId = scopeManagerId(user.role, user.id);
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true, role: true } },
        pipelineStage: true,
        conversations: { include: { messages: { orderBy: { sentAt: "asc" }, take: 200 } } },
        calls: { orderBy: { startedAt: "desc" }, take: 50, include: { recordings: true } },
        tasks: { orderBy: { dueAt: "desc" } },
        meetings: { orderBy: { startsAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" }, take: 200 },
      },
    });
    if (!contact || (managerId && contact.managerId !== managerId)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (!canListenAllRecordings(user.role)) {
      contact.calls = contact.calls.filter((c) => c.managerId === user.id);
    }
    return NextResponse.json(contact);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const managerId = scopeManagerId(user.role, user.id);
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact || (managerId && contact.managerId !== managerId)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const body = z.object({ text: z.string().min(1).max(2000) }).parse(await req.json());
    const note = await addContactNote(prisma, { contactId: id, managerId: user.id, text: body.text });
    return NextResponse.json(note);
  } catch (err) {
    return jsonError(err);
  }
}

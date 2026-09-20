import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { z } from "zod";
import { bookDemo, SlotTakenError, SlotUnavailableError, updateMeeting } from "@/lib/meetings";

export async function GET() {
  try {
    const user = await requireUser();
    const managerId = scopeManagerId(user.role, user.id);
    const meetings = await prisma.meeting.findMany({
      where: managerId ? { managerId } : {},
      include: { contact: true, manager: { select: { id: true, name: true } } },
      orderBy: { startsAt: "asc" },
      take: 300,
    });
    return NextResponse.json(meetings);
  } catch (err) {
    return jsonError(err);
  }
}

const createSchema = z.object({
  contactId: z.string().optional(),
  managerId: z.string().optional(),
  startsAt: z.string().optional(),
  auto: z.boolean().optional(),
  format: z.enum(["ONLINE", "OFFLINE", "PHONE"]).optional(),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());
    if (!body.auto && !body.startsAt) {
      return NextResponse.json({ error: "STARTS_AT_REQUIRED" }, { status: 400 });
    }
    const managerId = body.managerId || user.id;
    const scoped = scopeManagerId(user.role, user.id);
    if (scoped && managerId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const meeting = await bookDemo(prisma, {
      managerId,
      creatorId: user.id,
      contactId: body.contactId,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      auto: body.auto,
      format: body.format,
      comment: body.comment,
    });
    return NextResponse.json(meeting);
  } catch (err) {
    if (err instanceof SlotTakenError || err instanceof SlotUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return jsonError(err);
  }
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  startsAt: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = patchSchema.parse(await req.json());
    const meeting = await updateMeeting(prisma, {
      id: body.id,
      managerScope: scopeManagerId(user.role, user.id),
      status: body.status,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    });
    return NextResponse.json(meeting);
  } catch (err) {
    if (err instanceof SlotTakenError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return jsonError(err);
  }
}

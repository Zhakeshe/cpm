import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

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

const schema = z.object({
  contactId: z.string().optional(),
  managerId: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  format: z.enum(["ONLINE", "OFFLINE", "PHONE"]).optional(),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const managerId = body.managerId || user.id;
    const meeting = await prisma.meeting.create({
      data: {
        contactId: body.contactId,
        managerId,
        startsAt: new Date(body.startsAt),
        endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
        format: body.format || "ONLINE",
        comment: body.comment || "",
      },
    });
    if (body.contactId) {
      await prisma.activity.create({
        data: {
          contactId: body.contactId,
          managerId,
          type: "MEETING_CREATED",
          title: "Назначена встреча / демо",
          payload: { meetingId: meeting.id },
        },
      });
    }
    await notifyUser(prisma, {
      userId: managerId,
      type: "MEETING_ASSIGNED",
      title: "Назначена встреча",
      body: body.comment || "",
      data: { meetingId: meeting.id },
    });
    return NextResponse.json(meeting);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const meeting = await prisma.meeting.update({
      where: { id: body.id },
      data: { status: body.status },
    });
    return NextResponse.json(meeting);
  } catch (err) {
    return jsonError(err);
  }
}

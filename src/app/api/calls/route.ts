import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canListenAllRecordings, requestedManagerId, scopeManagerId } from "@/lib/rbac";
import { originateCall } from "@/lib/telephony";
import { z } from "zod";
import { resolveOutboundSipAccount } from "@/lib/sip-config";
import { ZadarmaError } from "@/lib/zadarma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const managerId = requestedManagerId(user.role, user.id, req.nextUrl.searchParams.get("manager"));
    const calls = await prisma.call.findMany({
      where: managerId ? { managerId } : {},
      include: { contact: true, manager: { select: { id: true, name: true } }, recordings: true },
      orderBy: { startedAt: "desc" },
      take: 200,
    });
    if (!canListenAllRecordings(user.role)) {
      for (const c of calls) {
        if (c.managerId !== user.id) c.recordingUrl = null;
      }
    }
    return NextResponse.json(calls);
  } catch (err) {
    return jsonError(err);
  }
}

const originateSchema = z.object({
  contactId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = originateSchema.parse(await req.json());
    const contact = await prisma.contact.findUnique({ where: { id: body.contactId } });
    if (!contact) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const manager = await prisma.user.findUnique({ where: { id: user.id } });
    if (scopeManagerId(user.role, user.id) && contact.managerId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    if (!manager?.isActive) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const account = resolveOutboundSipAccount(manager);
    const result = await originateCall({ managerId: user.id, ...account, toNumber: contact.phoneNormalized });
    return NextResponse.json(result, { status: 202 });
  } catch (err) {
    if (err instanceof ZadarmaError || (err as Error).message === "SIP_ACCOUNT_NOT_CONFIGURED") {
      return NextResponse.json({ error: (err as Error).message }, { status: (err as { status?: number }).status || 502 });
    }
    return jsonError(err);
  }
}

const resultSchema = z.object({
  callId: z.string(),
  result: z.enum(["CONTACTED", "NO_ANSWER", "CALLBACK", "INTERESTED", "DEMO_BOOKED", "THINKING", "REJECTED", "SALE"]),
  callbackAt: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = resultSchema.parse(await req.json());
    const call = await prisma.call.findUnique({ where: { id: body.callId } });
    if (!call) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (scopeManagerId(user.role, user.id) && call.managerId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const updated = await prisma.call.update({
      where: { id: body.callId },
      data: { result: body.result, status: body.result === "NO_ANSWER" ? "NO_ANSWER" : call.status },
    });
    if (body.result === "CALLBACK" && body.callbackAt && call.contactId) {
      await prisma.task.create({
        data: {
          contactId: call.contactId,
          managerId: user.id,
          creatorId: user.id,
          type: "CALL",
          description: "Перезвонить",
          dueAt: new Date(body.callbackAt),
        },
      });
    }
    return NextResponse.json(updated);
  } catch (err) {
    return jsonError(err);
  }
}
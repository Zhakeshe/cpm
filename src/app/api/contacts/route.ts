import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { ingestContact, reassignContact } from "@/lib/contacts";
import { searchContacts } from "@/lib/search";
import { canReassignManager, scopeManagerId } from "@/lib/rbac";
import { assertStageRequirements, MissingStageFieldsError } from "@/lib/pipeline-rules";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const q = req.nextUrl.searchParams.get("q") || "";
    const managerId = scopeManagerId(user.role, user.id);
    if (q) {
      return NextResponse.json(await searchContacts(q, managerId));
    }
    const contacts = await prisma.contact.findMany({
      where: managerId ? { managerId } : {},
      include: {
        manager: { select: { id: true, email: true, name: true, role: true, sipExtension: true } },
        pipelineStage: true,
        tasks: { where: { status: "OPEN" }, take: 1, orderBy: { dueAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return NextResponse.json(contacts);
  } catch (err) {
    return jsonError(err);
  }
}

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().min(5),
  email: z.string().email().optional().or(z.literal("")),
  source: z.enum([
    "WHATSAPP",
    "INSTAGRAM",
    "FACEBOOK",
    "PHONE_CALL",
    "MANUAL",
    "WEBSITE",
    "REFERRAL",
    "OTHER",
    "META_LEAD_ADS",
  ]),
  comment: z.string().optional(),
  dealAmount: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());
    const ingest = await ingestContact(prisma, {
      phone: body.phone,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || undefined,
      source: body.source,
      comment: body.comment,
      actorId: user.id,
      createLeadOnDuplicate: false,
    });
    if (user.role === "MANAGER" && ingest.createdContact) {
      await prisma.contact.update({
        where: { id: ingest.contactId },
        data: { managerId: user.id },
      });
    }
    if (body.dealAmount) {
      await prisma.contact.update({
        where: { id: ingest.contactId },
        data: { dealAmount: body.dealAmount },
      });
    }
    const contact = await prisma.contact.findUnique({
      where: { id: ingest.contactId },
      include: { manager: { select: { id: true, name: true, email: true, role: true } }, pipelineStage: true },
    });
    return NextResponse.json({ contact, ingest });
  } catch (err) {
    return jsonError(err);
  }
}

const reassignSchema = z.object({
  contactId: z.string(),
  managerId: z.string(),
  reason: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    if (body.managerId && body.contactId) {
      if (!canReassignManager(user.role)) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }
      const parsed = reassignSchema.parse(body);
      await reassignContact(prisma, {
        contactId: parsed.contactId,
        toUserId: parsed.managerId,
        actorId: user.id,
        ip: req.headers.get("x-forwarded-for") || undefined,
        reason: parsed.reason,
      });
      return NextResponse.json({ ok: true });
    }
    const id = z.string().parse(body.id);
    const managerId = scopeManagerId(user.role, user.id);
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing || (managerId && existing.managerId !== managerId)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (body.pipelineStageId && body.pipelineStageId !== existing.pipelineStageId) {
      // validate against the values the contact will have after this update
      await assertStageRequirements(prisma, body.pipelineStageId, {
        ...existing,
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.comment !== undefined ? { comment: body.comment } : {}),
        ...(body.dealAmount !== undefined ? { dealAmount: body.dealAmount } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
        ...(body.whatsappNumber !== undefined ? { whatsappNumber: body.whatsappNumber } : {}),
        ...(body.customFields !== undefined ? { customFields: body.customFields } : {}),
      });
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        comment: body.comment,
        dealAmount: body.dealAmount,
        status: body.status,
        pipelineStageId: body.pipelineStageId,
        customFields: body.customFields,
        whatsappNumber: body.whatsappNumber,
      },
    });
    if (body.pipelineStageId && body.pipelineStageId !== existing.pipelineStageId) {
      const [from, to] = await Promise.all([
        existing.pipelineStageId
          ? prisma.pipelineStage.findUnique({ where: { id: existing.pipelineStageId } })
          : null,
        prisma.pipelineStage.findUnique({ where: { id: body.pipelineStageId } }),
      ]);
      await prisma.activity.create({
        data: {
          contactId: id,
          managerId: user.id,
          type: "STAGE_CHANGED",
          title: `Статус изменён: «${from?.name || "—"}» → «${to?.name || "—"}»`,
          payload: { from: existing.pipelineStageId, to: body.pipelineStageId },
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "contact.stage",
          entityType: "Contact",
          entityId: id,
          oldValue: { stage: existing.pipelineStageId },
          newValue: { stage: body.pipelineStageId },
        },
      });
      if (to?.isWon) {
        await prisma.contact.update({ where: { id }, data: { status: "WON" } });
      }
      if (to?.isLost) {
        await prisma.contact.update({ where: { id }, data: { status: "LOST" } });
      }
      await prisma.lead.updateMany({
        where: { contactId: id, processedAt: null },
        data: { processedAt: new Date(), pipelineStageId: body.pipelineStageId },
      });
      // won/lost stages rewrite the status, so re-read before answering
      return NextResponse.json(await prisma.contact.findUnique({ where: { id } }));
    }
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof MissingStageFieldsError) {
      return NextResponse.json({ error: err.message, fields: err.fields }, { status: 400 });
    }
    return jsonError(err);
  }
}

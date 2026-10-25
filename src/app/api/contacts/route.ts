import { idempotent } from "@/lib/idempotency";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { ingestContact, reassignContact } from "@/lib/contacts";
import { canReassignManager, scopeManagerId } from "@/lib/rbac";
import { MissingStageFieldsError } from "@/lib/pipeline-rules";
import { applyContactStage, OutcomeReasonRequiredError } from "@/lib/outcomes";
import { contactWhere, parseContactFilters } from "@/lib/contact-filters";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const filters = parseContactFilters(req.nextUrl.searchParams);
    const managerId = scopeManagerId(user.role, user.id);
    const offset = Math.max(0, Number(req.nextUrl.searchParams.get("offset")) || 0);
    const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 200));
    const where = contactWhere(filters, managerId);
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        manager: { select: { id: true, email: true, name: true, role: true, sipExtension: true } },
        pipelineStage: true,
        company: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        tasks: { where: { status: "OPEN" }, take: 1, orderBy: { dueAt: "asc" } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: offset,
      take: limit,
    });
    if (req.nextUrl.searchParams.get("page") === "1") {
      const total = await prisma.contact.count({ where });
      return NextResponse.json({
        items: contacts,
        total,
        nextOffset: offset + contacts.length,
        hasMore: offset + contacts.length < total,
      });
    }
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
    "TIKTOK",
    "YOUTUBE",
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
    return NextResponse.json(await idempotent(prisma, user.id, "contacts", req.headers.get("Idempotency-Key"), body, async () => {
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
      return { contact, ingest };
    }));
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
    const updated = await prisma.contact.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        comment: body.comment,
        dealAmount: body.dealAmount,
        customFields: body.customFields,
        whatsappNumber: body.whatsappNumber,
        altPhone: body.altPhone,
        address: body.address,
        city: body.city,
        companyId: body.companyId === "" ? null : body.companyId,
        archivedAt: body.archived === true ? new Date() : body.archived === false ? null : undefined,
      },
    });
    if (body.pipelineStageId && body.pipelineStageId !== existing.pipelineStageId) {
      const afterStage = await applyContactStage(prisma, {
        contactId: id,
        fromStageId: existing.pipelineStageId,
        toStageId: body.pipelineStageId,
        actorId: user.id,
        outcomeReason: body.outcomeReason,
        contactForRules: {
          ...existing,
          ...updated,
        },
      });
      return NextResponse.json(afterStage);
    }
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof MissingStageFieldsError) {
      return NextResponse.json({ error: err.message, fields: err.fields }, { status: 400 });
    }
    if (err instanceof OutcomeReasonRequiredError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return jsonError(err);
  }
}

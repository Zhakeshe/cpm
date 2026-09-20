import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const contactId = req.nextUrl.searchParams.get("contactId");
    if (!contactId) return NextResponse.json([]);
    const scoped = scopeManagerId(user.role, user.id);
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact || (scoped && contact.managerId !== scoped)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(await prisma.payment.findMany({ where: { contactId }, orderBy: { paidAt: "desc" } }));
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  contactId: z.string(),
  amount: z.number().positive(),
  method: z.enum(["CASH", "CARD", "TRANSFER", "INSTALLMENT"]),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const scoped = scopeManagerId(user.role, user.id);
    const contact = await prisma.contact.findUnique({ where: { id: body.contactId } });
    if (!contact || (scoped && contact.managerId !== scoped)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const payment = await prisma.payment.create({
      data: { contactId: body.contactId, amount: body.amount, method: body.method, note: body.note || "" },
    });
    await prisma.activity.create({
      data: {
        contactId: body.contactId,
        managerId: user.id,
        type: "NOTE",
        title: `Төлем ${body.amount} ₸ (${body.method})`,
        payload: { paymentId: payment.id },
      },
    });
    return NextResponse.json(payment);
  } catch (err) {
    return jsonError(err);
  }
}

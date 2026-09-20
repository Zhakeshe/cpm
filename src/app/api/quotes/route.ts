import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { createQuote } from "@/lib/quotes";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const managerId = scopeManagerId(user.role, user.id);
    const contactId = req.nextUrl.searchParams.get("contactId") || undefined;
    return NextResponse.json(
      await prisma.quote.findMany({
        where: { ...(managerId ? { managerId } : {}), ...(contactId ? { contactId } : {}) },
        include: { items: true, contact: { select: { id: true, firstName: true, lastName: true, phoneDisplay: true } }, manager: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    );
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  contactId: z.string(),
  note: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().optional(),
      title: z.string().min(1),
      qty: z.number().int().positive(),
      unitPrice: z.number().nonnegative(),
    }),
  ).min(1),
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
    const quote = await createQuote(prisma, { ...body, managerId: user.id });
    return NextResponse.json(quote);
  } catch (err) {
    return jsonError(err);
  }
}

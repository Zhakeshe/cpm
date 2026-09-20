import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { scopeManagerId } from "@/lib/rbac";
import { setQuoteStatus } from "@/lib/quotes";
import type { QuoteStatus } from "@prisma/client";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const scoped = scopeManagerId(user.role, user.id);
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        items: true,
        contact: true,
        manager: { select: { name: true, email: true } },
      },
    });
    if (!quote || (scoped && quote.managerId !== scoped && quote.contact.managerId !== scoped)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(quote);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = z.object({ status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]) }).parse(await req.json());
    const scoped = scopeManagerId(user.role, user.id);
    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing || (scoped && existing.managerId !== scoped)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(await setQuoteStatus(prisma, id, body.status as QuoteStatus, user.id));
  } catch (err) {
    return jsonError(err);
  }
}

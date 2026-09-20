import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const q = req.nextUrl.searchParams.get("q") || "";
    return NextResponse.json(
      await prisma.company.findMany({
        where: q ? { name: { contains: q, mode: "insensitive" } } : {},
        include: { _count: { select: { contacts: true } } },
        orderBy: { name: "asc" },
        take: 100,
      }),
    );
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  name: z.string().min(1),
  bin: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = schema.parse(await req.json());
    const company = await prisma.company.create({
      data: {
        name: body.name,
        bin: body.bin || "",
        phone: body.phone || "",
        email: body.email || "",
        address: body.address || "",
        comment: body.comment || "",
      },
    });
    return NextResponse.json(company);
  } catch (err) {
    return jsonError(err);
  }
}

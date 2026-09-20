import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireUser } from "@/lib/api";
import { canManageSettings } from "@/lib/rbac";
import { seedVacuumCatalog } from "@/lib/catalog";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json(await prisma.product.findMany({ orderBy: { name: "asc" } }));
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  id: z.string().optional(),
  seed: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    if (body.seed) {
      if (!canManageSettings(user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      return NextResponse.json(await seedVacuumCatalog(prisma));
    }
    if (!canManageSettings(user.role) && user.role !== "SUPERVISOR") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const parsed = schema.parse(body);
    if (parsed.id) {
      const updated = await prisma.product.update({
        where: { id: parsed.id },
        data: {
          name: parsed.name,
          category: parsed.category || "vacuum",
          price: parsed.price,
          stock: parsed.stock ?? 0,
          description: parsed.description || "",
          isActive: parsed.isActive ?? true,
        },
      });
      return NextResponse.json(updated);
    }
    const created = await prisma.product.create({
      data: {
        sku: parsed.sku,
        name: parsed.name,
        category: parsed.category || "vacuum",
        price: parsed.price,
        stock: parsed.stock ?? 0,
        description: parsed.description || "",
      },
    });
    return NextResponse.json(created);
  } catch (err) {
    return jsonError(err);
  }
}

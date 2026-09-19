import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { z } from "zod";

const stageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  order: z.number(),
  isActive: z.boolean().optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
  requiredFields: z.array(z.string()).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const stages = z.array(stageSchema).parse(await req.json());
    const pipeline = await prisma.pipeline.findFirst({ where: { isDefault: true } });
    if (!pipeline) return NextResponse.json({ error: "NO_PIPELINE" }, { status: 400 });
    for (const s of stages) {
      if (s.id) {
        await prisma.pipelineStage.update({
          where: { id: s.id },
          data: {
            name: s.name,
            slug: s.slug,
            order: s.order,
            isActive: s.isActive ?? true,
            isWon: s.isWon ?? false,
            isLost: s.isLost ?? false,
            requiredFields: s.requiredFields || [],
          },
        });
      } else {
        await prisma.pipelineStage.create({
          data: {
            pipelineId: pipeline.id,
            name: s.name,
            slug: s.slug,
            order: s.order,
            isActive: s.isActive ?? true,
            isWon: s.isWon ?? false,
            isLost: s.isLost ?? false,
            requiredFields: s.requiredFields || [],
          },
        });
      }
    }
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "pipeline.update",
        entityType: "Pipeline",
        entityId: pipeline.id,
        newValue: stages as object,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

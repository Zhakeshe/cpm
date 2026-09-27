import type { PrismaClient } from "@prisma/client";

export type VacuumStageDef = {
  slug: string;
  name: string;
  order: number;
  isWon?: boolean;
  isLost?: boolean;
  requiredFields: string[];
};

/** Пелесос сату воронкасы — лид → байланыс нәтижесі → демо → төлем / бас тарту. */
export const VACUUM_PIPELINE_STAGES: VacuumStageDef[] = [
  { slug: "new", name: "Новый лид", order: 1, requiredFields: [] },
  { slug: "contacted", name: "Первый контакт", order: 2, requiredFields: [] },
  { slug: "callback", name: "Перезвонить", order: 3, requiredFields: [] },
  { slug: "demo", name: "Запись на демо", order: 4, requiredFields: [] },
  { slug: "demo_done", name: "Демо проведено", order: 5, requiredFields: [] },
  { slug: "disconnected", name: "Отключено!", order: 6, requiredFields: [] },
  { slug: "tnb", name: "ТНБ", order: 7, requiredFields: [] },
  { slug: "no_answer", name: "Телефон не берет", order: 8, requiredFields: [] },
  { slug: "paid", name: "Оплатил", order: 9, isWon: true, requiredFields: ["dealAmount"] },
  { slug: "lost", name: "Отказ", order: 10, isLost: true, requiredFields: [] },
];

export const MANAGER_BLOCKED_PATHS = [
  "/settings",
  "/audit",
  "/monitoring",
  "/managers",
  "/sla",
  "/catalog",
  "/companies",
  "/calls",
  "/analytics",
];

export function isManagerBlockedPath(pathname: string) {
  return MANAGER_BLOCKED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function ensureVacuumPipeline(db: PrismaClient) {
  const pipeline = await db.pipeline.upsert({
    where: { id: "default" },
    update: { name: "Пылесосы Quantum" },
    create: { id: "default", name: "Пылесосы Quantum", isDefault: true },
  });
  const keep = VACUUM_PIPELINE_STAGES.map((s) => s.slug);
  for (const s of VACUUM_PIPELINE_STAGES) {
    await db.pipelineStage.upsert({
      where: { pipelineId_slug: { pipelineId: pipeline.id, slug: s.slug } },
      update: {
        name: s.name,
        order: s.order,
        isWon: Boolean(s.isWon),
        isLost: Boolean(s.isLost),
        requiredFields: s.requiredFields,
        isActive: true,
      },
      create: {
        pipelineId: pipeline.id,
        slug: s.slug,
        name: s.name,
        order: s.order,
        isWon: Boolean(s.isWon),
        isLost: Boolean(s.isLost),
        requiredFields: s.requiredFields,
      },
    });
  }
  const stale = await db.pipelineStage.findMany({
    where: { pipelineId: pipeline.id, slug: { notIn: keep } },
  });
  const fallback = await db.pipelineStage.findFirst({
    where: { pipelineId: pipeline.id, slug: "demo_done" },
  });
  for (const old of stale) {
    if (fallback) {
      await db.contact.updateMany({
        where: { pipelineStageId: old.id },
        data: { pipelineStageId: fallback.id },
      });
    }
    await db.pipelineStage.update({
      where: { id: old.id },
      data: { isActive: false },
    });
  }
  return pipeline;
}

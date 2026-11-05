import { prisma } from "./db";
import { z } from "zod";

export const monitorReportSchema = z.object({
  checkedAt: z.string().datetime(),
  checks: z.record(z.string().max(50), z.object({ ok: z.boolean(), detail: z.string().max(200) })).refine((v) => Object.keys(v).length <= 20),
  incidents: z.array(z.object({ at: z.string().datetime(), issues: z.array(z.string().max(50)).max(20) })).max(30),
});
export type MonitorReport = z.infer<typeof monitorReportSchema>;
export function monitorIssues(report: MonitorReport) { return Object.entries(report.checks).filter(([, v]) => !v.ok).map(([k]) => k).sort(); }

export async function recordMonitorReport(input: unknown) {
  const report = monitorReportSchema.parse(input);
  const previous = await prisma.systemSetting.findUnique({ where: { key: "monitor:last-report" } });
  const old = previous?.value as MonitorReport | undefined;
  const issues = monitorIssues(report);
  // Persist the transition and its notifications atomically. Host flock ensures one reporter.
  await prisma.$transaction(async (tx) => {
    await tx.systemSetting.upsert({ where: { key: "monitor:last-report" }, create: { key: "monitor:last-report", value: report }, update: { value: report } });
    const lastDelivered = old?.incidents?.at(-1)?.at;
    const unseen = report.incidents.filter((i) => !lastDelivered || i.at > lastDelivered);
    if (unseen.length) {
      const admins = await tx.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
      await tx.notification.createMany({ data: admins.flatMap((a) => unseen.map((i) => ({ userId: a.id, type: "NEW_TASK" as const, title: i.issues.length ? "CRM: требуется внимание" : "CRM: работа восстановлена", body: i.issues.length ? i.issues.join(", ") : "Все проверки пройдены", data: { kind: "system-monitor", checkedAt: i.at, issues: i.issues } }))) });
    }
  });
  return { issues };
}

import { prisma } from "@/lib/db";
import { analytics, managerTable, type DateRange } from "@/lib/analytics";
import { canListenAllRecordings } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";

export async function exportLeads(managerId?: string | null) {
  const leads = await prisma.lead.findMany({
    where: managerId ? { managerId } : {},
    include: {
      contact: { include: { pipelineStage: true, manager: { select: { name: true } } } },
      manager: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  return leads.map((lead) => ({
    id: lead.id,
    createdAt: lead.createdAt.toISOString(),
    processedAt: lead.processedAt?.toISOString() || "",
    source: lead.contact.source,
    firstName: lead.contact.firstName,
    lastName: lead.contact.lastName,
    phone: lead.contact.phoneDisplay,
    email: lead.contact.email || "",
    manager: lead.contact.manager?.name || lead.manager?.name || "",
    stage: lead.contact.pipelineStage?.name || "",
    dealAmount: Number(lead.contact.dealAmount || 0),
    comment: lead.contact.comment || "",
  }));
}

export async function exportCalls(user: { id: string; role: Role }, managerId?: string | null) {
  const calls = await prisma.call.findMany({
    where: managerId ? { managerId } : {},
    include: { contact: true, manager: { select: { name: true } } },
    orderBy: { startedAt: "desc" },
    take: 2000,
  });
  const hideForeignRecording = !canListenAllRecordings(user.role);
  return calls.map((call) => ({
    id: call.id,
    startedAt: call.startedAt.toISOString(),
    direction: call.direction,
    status: call.status,
    result: call.result || "",
    from: call.fromNumber,
    to: call.toNumber,
    duration: call.duration,
    manager: call.manager?.name || "",
    client: call.contact ? `${call.contact.firstName} ${call.contact.lastName}`.trim() : "",
    recording: hideForeignRecording && call.managerId !== user.id ? "" : call.recordingUrl || "",
  }));
}

export async function exportAnalytics(range: DateRange, managerId?: string, includeManagers = false) {
  const stats = await analytics(range, managerId);
  const summary = [
    { metric: "newLeads", value: stats.newLeads },
    { metric: "processed", value: stats.processed },
    { metric: "calls", value: stats.calls },
    { metric: "missed", value: stats.missed },
    { metric: "conversations", value: stats.conversations },
    { metric: "demos", value: stats.demos },
    { metric: "sales", value: stats.sales },
    { metric: "conversion", value: Number(stats.conversion.toFixed(4)) },
    { metric: "salesAmount", value: stats.salesAmount },
    { metric: "avgCheck", value: Math.round(stats.avgCheck) },
    { metric: "avgTalk", value: Math.round(stats.avgTalk) },
    { metric: "avgResponseSeconds", value: stats.avgResponseSeconds },
  ];
  const managers = includeManagers ? await managerTable(range) : [];
  return { summary, managers };
}

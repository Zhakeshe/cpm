import { prisma } from "./db";
import { ingestContact } from "./contacts";

export { ingestContact };

export async function markLeadProcessed(leadId: string) {
  return prisma.lead.update({
    where: { id: leadId },
    data: { processedAt: new Date() },
  });
}

export async function searchContacts(query: string, managerId?: string) {
  const q = query.trim();
  if (!q) return [];
  const digits = q.replace(/\D/g, "");
  return prisma.contact.findMany({
    where: {
      AND: [
        managerId ? { managerId } : {},
        {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { id: { equals: q } },
            { comment: { contains: q, mode: "insensitive" } },
            ...(digits ? [{ phoneNormalized: { contains: digits } }] : []),
          ],
        },
      ],
    },
    include: { manager: { select: { id: true, name: true, email: true } }, pipelineStage: true },
    take: 30,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireRole } from "@/lib/api";
import { enqueueWebhook } from "@/lib/queue";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPERVISOR"]);
    const status = req.nextUrl.searchParams.get("status");
    const [events, counts, failedJobs] = await Promise.all([
      prisma.webhookEvent.findMany({
        where: status ? { processingStatus: status as "FAILED" } : {},
        orderBy: { receivedAt: "desc" },
        take: 100,
        select: {
          id: true,
          provider: true,
          eventType: true,
          processingStatus: true,
          receivedAt: true,
          processedAt: true,
          error: true,
        },
      }),
      prisma.webhookEvent.groupBy({ by: ["provider", "processingStatus"], _count: true }),
      prisma.webhookEvent.count({ where: { processingStatus: "FAILED" } }),
    ]);
    return NextResponse.json({ events, counts, failedJobs });
  } catch (err) {
    return jsonError(err);
  }
}

const retrySchema = z.object({ id: z.string().optional(), retryAllFailed: z.boolean().optional() });

export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole(["ADMIN"]);
    const body = retrySchema.parse(await req.json());
    const events = body.retryAllFailed
      ? await prisma.webhookEvent.findMany({ where: { processingStatus: "FAILED" }, take: 200 })
      : await prisma.webhookEvent.findMany({ where: { id: body.id }, take: 1 });
    if (events.length === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    for (const event of events) {
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: { processingStatus: "PENDING", error: null },
      });
      await enqueueWebhook({ webhookEventId: event.id, provider: event.provider });
    }
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "webhook.retry",
        entityType: "WebhookEvent",
        entityId: body.id || "bulk",
        newValue: { count: events.length },
      },
    });
    return NextResponse.json({ requeued: events.length });
  } catch (err) {
    return jsonError(err);
  }
}

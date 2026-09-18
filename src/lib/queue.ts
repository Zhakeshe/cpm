import { Queue, Worker, type JobsOptions } from "bullmq";
import IORedis from "ioredis";

const connection = () =>
  new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
  });

let webhookQueue: Queue | null = null;

export function getWebhookQueue() {
  if (!webhookQueue) {
    webhookQueue = new Queue("webhooks", { connection: connection() });
  }
  return webhookQueue;
}

export async function enqueueWebhook(data: {
  webhookEventId: string;
  provider: string;
}) {
  const opts: JobsOptions = {
    attempts: 8,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  };
  try {
    await getWebhookQueue().add("process", data, opts);
  } catch (err) {
    console.error("queue_unavailable", (err as Error).message);
    const { processWebhookJob } = await import("./jobs/process-webhook");
    await processWebhookJob(data);
  }
}

export function createWebhookWorker() {
  return new Worker(
    "webhooks",
    async (job) => {
      const { processWebhookJob } = await import("./jobs/process-webhook");
      await processWebhookJob(job.data);
    },
    { connection: connection(), concurrency: 8 },
  );
}

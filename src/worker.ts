import { createWebhookWorker } from "./lib/queue";
import { prisma } from "./lib/db";
import { applyLeadSla } from "./lib/sla";
import { runReminders } from "./lib/reminders";

const worker = createWebhookWorker();
worker.on("failed", (job, err) => {
  console.error("job_failed", job?.id, err.message);
});

setInterval(() => {
  applyLeadSla(prisma).catch((err) => console.error("sla_error", err.message));
  runReminders(prisma).catch((err) => console.error("reminder_error", err.message));
}, 60_000);

console.log("crm worker started");

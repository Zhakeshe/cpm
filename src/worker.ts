import { createWebhookWorker } from "./lib/queue";
import { prisma } from "./lib/db";
import { applyLeadSla } from "./lib/sla";
import { runReminders } from "./lib/reminders";
import { runAutomations } from "./lib/automations";
import { syncWabaFromMeta } from "./lib/meta-waba";
import { whatsappCredentials } from "./lib/meta-graph";

const worker = createWebhookWorker();
worker.on("failed", (job, err) => {
  console.error("job_failed", job?.id, err.message);
});

const WABA_SYNC_MS = 60 * 60 * 1000;
let lastWabaSync = 0;

setInterval(() => {
  applyLeadSla(prisma).catch((err) => console.error("sla_error", err.message));
  runReminders(prisma).catch((err) => console.error("reminder_error", err.message));
  runAutomations(prisma).catch((err) => console.error("automation_error", err.message));
  if (whatsappCredentials().configured && Date.now() - lastWabaSync >= WABA_SYNC_MS) {
    lastWabaSync = Date.now();
    syncWabaFromMeta(prisma).catch((err) => console.error("waba_sync_error", err.message));
  }
}, 60_000);

console.log("crm worker started");

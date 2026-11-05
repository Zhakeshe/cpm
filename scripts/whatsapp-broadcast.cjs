const { readFileSync } = require('node:fs');
const { PrismaClient } = require('@prisma/client');
const { prepareBroadcast, startBroadcast, sendNextBroadcastRecipient, getBroadcastStatus, pauseBroadcast } = require('../dist/lib/whatsapp-broadcast');
const db = new PrismaClient();
const [action, id, textPath] = process.argv.slice(2);
let stopping = false;
process.on('SIGTERM', () => { stopping = true; });
process.on('SIGINT', () => { stopping = true; });
function print(status) {
  const { campaign, counts, delivery } = status;
  console.log(JSON.stringify({ id: campaign.id, state: campaign.state, audience: campaign.audience, textHash: campaign.textHash, exclusions: campaign.exclusions, counts, delivery, reason: campaign.reason }));
}
(async () => {
  if (!id || !['prepare', 'run', 'status', 'pause'].includes(action)) throw Error('Usage: whatsapp-broadcast.cjs prepare|run|status|pause campaign-id [text-file]');
  if (action === 'prepare') {
    if (!textPath) throw Error('TEXT_FILE_REQUIRED');
    const admin = await db.user.findFirstOrThrow({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    print(await prepareBroadcast(db, { id, text: readFileSync(textPath, 'utf8').trim(), actorId: admin.id }));
  } else if (action === 'status') print(await getBroadcastStatus(db, id));
  else if (action === 'pause') { await pauseBroadcast(db, id, 'OPERATOR_PAUSED'); print(await getBroadcastStatus(db, id)); }
  else {
    await startBroadcast(db, id);
    let attempts = 0;
    for (;;) {
      const row = await db.systemSetting.findUniqueOrThrow({ where: { key: 'broadcast:campaign:' + id } });
      if (stopping) { await pauseBroadcast(db, id, 'RUNNER_STOPPED'); break; }
      if (row.value.state !== 'RUNNING') break;
      if (await sendNextBroadcastRecipient(db, id)) attempts++;
      if (attempts && attempts % 20 === 0) print(await getBroadcastStatus(db, id));
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    const status = await getBroadcastStatus(db, id); print(status);
    if (status.campaign.state !== 'COMPLETED') process.exitCode = 2;
  }
})().catch(async error => {
  console.error('broadcast_runner_failed', /^[A-Z_]{1,80}$/.test(error.message) ? error.message : 'RUNNER_ERROR');
  if (action === 'run') await pauseBroadcast(db, id, 'RUNNER_ERROR').catch(() => undefined);
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
  // The shared realtime publisher has an open Redis socket after a send.
  // This is a dedicated one-shot CLI process, so exit after flushing its report.
  process.stdout.write('', () => process.exit(process.exitCode || 0));
});

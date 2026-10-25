# CRM stability operations

Work on `cursor/no-wa-autogreet-29f9`. Keep `.env`, SIP secrets, recovery exports and database dumps outside Git.

## Deploy

1. Save a fresh database backup outside the repository, with mode 0600.
2. Build `app` and `worker` with `docker compose build app worker`.
3. Apply the additive `OperationRequest` migration with `docker compose run --rm --no-deps app npx prisma migrate deploy`. Do not run the seed job.
4. Restart only those services: `docker compose up -d --no-deps --no-build app worker`.
5. Install `ops/crm-monitor.service` and `ops/crm-monitor.timer` to `/etc/systemd/system/`, run `systemctl daemon-reload` and `systemctl enable --now crm-monitor.timer`.
6. Run `systemctl start crm-monitor.service`; check `/monitoring`, app health, worker heartbeat, and the monitoring report age.

The host timer checks HTTPS, container state, PostgreSQL queries, Redis, worker heartbeat, free disk (more than 10%), and the last nonempty backup (under 30 hours). Reports and up to 30 incident transitions stay in `/var/lib/crm-monitor/status.json`. They are delivered to active administrators as CRM notifications when the database/app become available. A report older than three minutes is shown as stale.

For an external outage alert, set `CRM_ALERT_WEBHOOK_URL` in a root-owned mode-0600 `/etc/crm-monitor.env`. It must be a trusted HTTPS endpoint accepting JSON with `text` and `incidents`. This is optional; without a configured recipient, alerts during a complete outage remain in the host journal and are delivered in CRM after recovery. Never put the secret URL in Git or command output.

## Safe requests

Clients must send a stable UUID `Idempotency-Key` for POST `/api/contacts`, `/api/messages/send`, `/api/calls`, `/api/users`. Concurrent requests receive `ACTION_IN_PROGRESS`; successful repeats return the stored result. Claims survive restart and Redis outages. A failed side effect remains `ACTION_UNCERTAIN`: inspect the provider and CRM history before starting a fresh action. The browser retains the key for a failed attempt until the page reloads. A reload starts a new key, so always check history first after an uncertain send. Operation records are retained; monitor their growth before introducing a retention policy.

Blocking an account requires `confirmDisable: true`. It changes access and lead-acceptance flags only. Existing leads, contacts and history remain assigned. Administrators can show blocked accounts and restore them. Restoring does not mark an offline manager online.

## SIP acceptance checks

The `/sip-phone` panel records registration/call state and safe error categories to `/api/sip/diagnostics`; administrators see current reports in `/monitoring`. Credentials are never part of telemetry.

A live browser and an authorised test destination are needed to verify incoming and outgoing calls, two-way audio, recording playback and network reconnection. The microphone button checks browser permission, not two-way audio. Verify the green registration state, make the test call, confirm both parties can hear, then check the call and its recording in CRM. Disconnect/reconnect the browser network and verify re-registration. Never describe these as passed based on a server HTTP or TCP probe alone.

## Rollback

Tag/save the previous app and worker images before deployment. If health fails, recreate only app/worker from those saved images. Leave the additive operation table in place so request claims are not lost; do not restore the whole production database over new CRM activity.

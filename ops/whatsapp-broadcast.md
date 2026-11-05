# One-time WhatsApp broadcast

The user explicitly authorized a one-time Kaspi Zhuma broadcast to all clients
on 5 November 2026. The exact copy is stored in
`scripts/campaigns/kaspi-zhuma-20261105.txt`. The automatic greeting is unchanged.

`scripts/whatsapp-broadcast.cjs prepare <id> <text-file>` takes one persistent
audience snapshot in SystemSetting. Archived contacts, invalid destinations,
the business number, opt-outs and duplicate destinations are excluded. The
campaign ID is permanent: preparing or starting it again never sends a second
campaign. Each destination has an individual QUEUED/SENDING/SENT/SKIPPED/FAILED/
UNCERTAIN record. Phone numbers and credentials are not printed in job logs.

`run <id>` starts a DRAFT campaign and sends one request at a time, with two
seconds between attempts and a 15-second provider timeout. Run it in one named
Docker container under the dedicated host systemd service. The container uses
the existing Compose worker environment without copying secrets into arguments.
No database migration or changes to the normal webhook worker are needed.

Opt-outs and destination changes are rechecked before each send. Broadcasts
preserve the unread counter and contact's lastContactAt, leadActivityAt, owner,
stage, status and creation date. Outgoing echoes cannot create new leads.
An echo arriving before the send response is merged into the same message.

UNKNOWN_ERROR, timeout, interrupted SENDING records, or other uncertain failures
pause the campaign. Do not automatically retry those destinations. BAD_CONTACT
is recorded as FAILED and does not block the rest. `crmMessageId` is stable but
the provider only deduplicates it for 60 seconds; the persistent local ledger
is the source of truth for preventing repeated sends.

`status <id>` reports campaign state, accepted sends, queued, skipped, failed,
uncertain and actual message delivery/read statuses. Accepted is not delivered.
`pause <id>` stops future recipients; an in-flight request may finish.

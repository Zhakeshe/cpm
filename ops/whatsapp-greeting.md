# WhatsApp one-time greeting for every sender

The admin controls the switch and message in Settings → WhatsApp автоприветствие,
using `GET/PUT /api/whatsapp/greeting`. It is off until explicitly enabled.
The active configuration is `SystemSetting.whatsapp:auto-greeting`, including
the server activation time. The production message includes the supplied
Instagram URL `https://www.instagram.com/quantumx_kz_/`; placeholder links are rejected.

Any fresh customer WhatsApp inbound after activation is eligible, including
customers with existing conversations and archived contacts who write again.
Each contact receives one greeting in total; an existing greeting claim is
preserved across later messages, deployments, and switch changes.
It works for organic and tracked advertising traffic, without changing source
attribution. Echoes, statuses, groups, other Wazzup channels,
and messages older than five minutes do not trigger a reply.
It uses the configured live transport and never falls back to a mock sender.
The reply is stored in the normal conversation, tagged with
`rawPayload.automation = whatsapp-welcome`. It preserves the manager's unread
count. No historical campaign or contact import is performed.

A unique `SystemSetting.whatsapp:welcome:<contactId>` claim is written before
the provider request. Concurrent callbacks can send once. A provider timeout or
interrupted send stays CLAIMED/UNCERTAIN and is never retried automatically;
verify delivery with the provider before any manual intervention.
The settings page shows the number of unconfirmed sends. Provider HTTP status,
error codes and request ID are retained on the claim, without response bodies,
tokens or recipient details. Automatic Wazzup text requests include a stable
`crmMessageId`, `clearUnanswered: false`, and a 15-second timeout. Wazzup only
deduplicates that ID for 60 seconds; this does not make an old uncertain send
safe to retry automatically.
`Тоқтату`, `Токтату`, `Стоп`, `Stop`, and `Отписаться` (case insensitive,
optional punctuation) persist `whatsapp:opt-out:<contactId>`, including while the
switch is off. Opt-out has no automatic expiry or re-subscription.

Deployment requires app and worker rebuild/recreation only, with `--no-deps`.
Do not run the compose migrate service: this feature has no schema migrations.
Unit tests cover eligibility, opt-out, concurrency, and uncertain sends.
Integration tests run against an isolated database with all provider fetches
intercepted; they exercise both Wazzup and Meta inbound through persisted reply,
notification and unread handling. No real recipient is contacted by tests.

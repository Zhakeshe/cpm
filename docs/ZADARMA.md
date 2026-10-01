# Zadarma: configuration, rollout and live acceptance

## Documented provider contract

Verified on 2026-10-01 against:

- https://zadarma.com/en/support/api/ — callback, signatures, SIP CallerID and NOTIFY_*.
- https://zadarma.com/en/support/instructions/crm-zadarma/ — callback first rings the manager's registered phone; the manager answers to connect the client. WebRTC widget uses `/v1/webrtc/get_key/`, not a raw SIP password.

`GET /v1/request/callback/`: `from` is the manager endpoint (real SIP account or verified PBX routing extension), `to` is the client, `sip` selects the account/PBX extension whose CallerID, statistics and recording settings are used. This method does not document a `caller_id` parameter. The public corporate number is **not** the manager endpoint. Set the selected account's CallerID to `77172696753` in Zadarma; the code does not mutate provider settings or secrets. Destinations use international country-code digits, e.g. `+7 776 201 07 02` -> `77762010702`. Calling the configured corporate number is rejected locally.

For account 158925 the request is `from=158925&sip=158925&to=77762010702`. Passing the same real SIP account in `from` and `sip` is intentional: those fields have different documented purposes. A corporate/client number is never substituted for a SIP account. API failures, including "to cannot be equal to Callerid", remain failures and are not suppressed. If CallerID configured at Zadarma differs from the env corporate number, a provider rejection remains possible; inspect the selected account's settings.

The documented callback response contains status/from/to/time, **no provider call ID**. `POST /api/calls` returns 202 only for provider `status=success`; it does not create a Call. Webhooks create/update the unique `externalCallId=pbx_call_id`. No automatic HTTP retry on timeout: first check whether a callback actually started.

## Server env and explicit ownership

Required for callback: `ZADARMA_USER_KEY`, `ZADARMA_SECRET`, `SIP_CORPORATE_NUMBER=+77172696753`, and a real current-manager SIP login from `user.sipUsername` or explicit `SIP_ACCOUNTS_JSON` mapping. No shared `ZADARMA_OUTBOUND_SIP` fallback: it would route unconfigured managers to somebody else's endpoint.

`SIP_ACCOUNTS_JSON` is keyed by the existing **logical CRM extension**. Values contain `username` (real authentication login), optional `password` (only for browser registration) and optional `pbxExtension` (verified provider PBX routing ID).

Structure, not an actual manager assignment:

```dotenv
SIP_ACCOUNTS_JSON='{"LOGICAL_EXTENSION":{"username":"REAL_SIP_LOGIN","password":"SIP_PASSWORD","pbxExtension":"VERIFIED_PBX_EXTENSION"}}'
SIP_USER_MAPPING_JSON='{"EXACT_DATABASE_USER_ID":"LOGICAL_EXTENSION"}'
```

Replace placeholders; omit `pbxExtension` for ordinary SIP accounts and omit `password` when using a native SIP phone. Numeric logins 158925/200223/943999 are supported. Neither `100/101/102/103` nor a `XXXXX-extension` login is inferred. `SIP_USER_MAPPING_JSON` is only for the optional setup command. Existing correct assignments need no setup. Query user IDs without passwords:

```bash
docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\''SELECT id, name, email, "sipExtension", "sipUsername" FROM "User" WHERE "isActive" = true ORDER BY name;'\'''
```

Decide the assignments explicitly. Three SIP accounts do not automatically configure four managers. An unconfigured manager receives `SIP_ACCOUNT_NOT_CONFIGURED`; no credentials are borrowed. Duplicate login/provider routing IDs and ownership conflicts are rejected. Setup never clears other users' assignments.

For browser JsSIP, configure a **provider-confirmed** `SIP_WS_URL=wss://...` and the matching `SIP_DOMAIN`. Ordinary accounts use `sip.zadarma.com` for native SIP; PBX credentials can require a different domain. Leave WebSocket URL empty if unsupported. There is no guessed default WebSocket endpoint. Existing server Integration transport settings may also be used; explicit env has priority. The official widget is a separate integration and is not silently mixed with JsSIP.

`GET /api/sip/credentials` requires authentication, resolves only the current user, returns env credentials only and always sets `Cache-Control: no-store`. Browser registration inherently needs its own SIP password in runtime memory; it is never embedded in the JS bundle. Settings API rejects SIP credentials and strips legacy password-containing settings from reads/audit input. Old stored credentials are not automatically deleted; move them to env before rollout. Do not include real secrets in git, terminal output, screenshots or logs.

## Provider and webhook prerequisites

Register each manager's endpoint on a SIP phone/softphone, set corporate CallerID on **each selected account**, and verify the accounts belong to the API credentials' Zadarma account. In Zadarma enable all PBX notifications and set:

`https://quantum.ushqn.com/api/webhooks/telephony`

```bash
curl --fail 'https://quantum.ushqn.com/api/webhooks/telephony?zd_echo=1234567'
```

Expected body: `1234567`. Both app and worker must have the same API secret and SIP mapping. Unsigned requests are rejected. Generic non-Zadarma webhook support requires a separate `SIP_WEBHOOK_SECRET`; it is not a Zadarma signing secret.

**Important:** NOTIFY_* documented here are PBX events. Standalone SIP accounts at `sip.zadarma.com` do not by themselves establish PBX membership/event delivery. Confirm the callback actually traverses the configured PBX and its events identify the manager through `internal`. For real PBX credentials, explicitly supply their verified `pbxExtension`. Do not equate CRM logical extensions with provider extensions. If no PBX events are delivered, do not mark the live acceptance complete.

| Notification | Handling |
| --- | --- |
| NOTIFY_START / NOTIFY_INTERNAL | Inbound; contact by caller_id; internal resolves real SIP login or explicit PBX mapping. Both transport events are retained. |
| NOTIFY_OUT_START | Outbound; contact by destination; outbound realtime event only. |
| NOTIFY_ANSWER | Direction/phone identity from existing pbx_call_id; never inferred from internal presence. If START has not arrived, queue retries. |
| NOTIFY_END / NOTIFY_OUT_END | Inbound/outbound respectively; persist duration/disposition; late START cannot resurrect an ended Call. |
| NOTIFY_RECORD | Update existing Call's recording without changing direction or creating a contact. Queue retries if START/END has not arrived. |

Transport deduplication retains event type/internal/recording ID. A PostgreSQL transaction lock scoped to the single provider call prevents concurrent deliveries from duplicating Call/activities/notifications. It does not lock outbound requests or other calls. Five provider channels are not five numbers; Zadarma enforces account/PBX line limits. Unresolved ANSWER/RECORD after queue retries remains visible as FAILED in monitoring and can be replayed once its start/end exists.

## Deployment (no schema migration or seed required)

After review, deploy the fix branch/commit. These commands update app and worker only; `--no-deps` intentionally avoids the compose migrate service, which also runs the seed script.

```bash
cd /opt/crm
git status --short
git fetch origin
git switch --track origin/fix/zadarma-production-flow
# Edit the existing server .env with the explicit configuration above.
# Keep existing API credentials and other production settings.
docker compose build app worker
# Optional only when explicit ownership changes are needed:
docker compose run --rm --no-deps app npm run zadarma:setup -- --dry-run
# Inspect that preview, then run only for those explicitly selected assignments:
docker compose run --rm --no-deps app npm run zadarma:setup
# Existing matching assignments: skip both setup commands.
docker compose up -d --no-deps --force-recreate app worker
docker compose ps app worker
docker compose logs --since=5m app worker
```

If branch already exists locally use `git switch fix/zadarma-production-flow` then `git pull --ff-only`. Do not overwrite a dirty checkout. Prisma model storage is unchanged; only comments clarify identity fields. No migration, db push, reset, seed or data deletion is required.

Rollback: switch to the previously deployed commit, rebuild app/worker and recreate them with the same `--no-deps` commands. Take care that older code may use legacy DB credentials; it is not compatible with the new env-only credentials flow without its old configuration.

## Manual live acceptance

1. Confirm manager-to-SIP mapping in a setup dry run (if setup is needed), accounts registered, corporate CallerID set to 77172696753, PBX notification delivery enabled. Test each configured manager separately.
2. Open an assigned contact with `+7 776 201 07 02` (use only an authorized test recipient). Click **Позвонить (Zadarma)** once. Button says **Соединяем…**. Network POST must return 202/accepted only after Zadarma success; logs show requested/accepted with masked destination, no credentials. No local Call or incoming-client popup is created by this POST.
3. Manager's native SIP phone receives the callback. Answer it, then client rings with corporate CallerID. The manager leg is a real incoming SIP session (answering it is required); it is not an incoming customer event in CRM. For a browser JsSIP session, its remote INVITE still requires answering; do not confuse this transport label with the CRM customer direction.
4. Deliver/observe NOTIFY_OUT_START: CRM shows **Исходящий звонок / Звонок начат**, one Call with OUTBOUND and correct manager/contact. NOTIFY_ANSWER updates the same ID; NOTIFY_OUT_END records actual disposition/duration. Pending button returns to available after 45s if no provider start arrives; that timeout does not claim the callback was cancelled. Check the phone/provider before retrying.
5. Call corporate number from an authorized external test phone. START and INTERNAL must create one Call; CRM incoming popup identifies the caller contact and the routed manager. ANSWER remains INBOUND even when internal/destination are present. END updates the same Call. RECORD attaches to it.
6. Replay identical **signed captured test** notifications; Call/activity/notifications counts must not grow. START then INTERNAL must still route the correct manager. Replay a late START after END: final status/duration remain completed. Never replay production calls casually or publish signing material.
7. In a controlled test, use a manager without SIP mapping: 503/SIP_ACCOUNT_NOT_CONFIGURED, no Call, no API callback. Use invalid/corporate destination: 400/INVALID_DESTINATION, no provider request. Simulate provider API error in automated tests; UI error must leave button available. Do not alter production secrets to simulate errors.
8. Two or more explicitly configured managers call distinct authorized test recipients concurrently: distinct pbx_call_id records and correct ownership. Provider channel/line limits govern further parallel calls; CRM imposes no global originate mutex. Five-channel behavior needs provider-side acceptance testing and enough configured endpoints.
9. Authenticated credentials GET contains only the current user's env account and no-store; unauthenticated GET is 401/no-store. `/api/settings` does not expose legacy SIP passwords. Verify logs and compiled browser assets do not contain configured credentials.

Automated checks: `npm test`, `npm run typecheck`, `npm run build`. Unit tests use stubbed provider responses; live ringing, audio, CallerID, PBX membership and channel capacity require this manual acceptance plan and are not proven by build success.

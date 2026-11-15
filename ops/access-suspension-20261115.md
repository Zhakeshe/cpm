# CRM access suspension — 15 November 2026

At the owner's request, Caddy serves a static Russian notice for all CRM pages,
login/logout and other auth endpoints, private APIs, downloads, assets and
WebSocket transports. The notice wording was supplied by the owner; it is not a
diagnostic finding about Zadarma. The response is HTTP 503 with no-store headers.
Existing session cookies do not bypass this rule. No passwords, user flags,
database records, application code or worker configuration are changed.

Exact health and inbound webhook endpoints continue to reach the application:
`/api/health` and `/api/webhooks/{wazzup,whatsapp,meta-leads,telephony}` (GET/POST).
No wildcard proxy route remains. Application/worker/database containers continue
running, so inbound integrations and internal health checks remain available.

The Caddy container must be recreated with `--no-deps` after changing the file:
its single-file bind mount can retain the old inode after an atomic replacement.
Recreation also closes pre-existing proxied WebSocket connections. Do not run
the migrate/seed service for this change.

To restore access on the owner's instruction, restore only `Caddyfile` from
commit `0f9557b7b66ba9885d01a3590a028f648f980a40` (or the pre-change host backup
`/root/crm-access-before-20261115.Caddyfile`), validate the candidate with the
deployed Caddy image, then recreate only Caddy:

```sh
cd /opt/crm
docker compose up -d --no-deps --force-recreate caddy
```

Verify `/login` is available, private APIs require authentication and inbound
webhook/health endpoints still work. Restoration needs no account or data reset.

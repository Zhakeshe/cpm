# Observer access — 15 November 2026

OBSERVER can read business records across managers, including leads, pipeline,
tasks, conversations, call records and analytics. It cannot create, modify or
delete records, assign staff, send messages/media, initiate calls, obtain SIP
credentials, export reports or access integration/operational secrets.

Middleware rejects unsafe observer requests except normal authentication flows.
Authenticated mutation handlers independently use a live-database write guard;
an old MANAGER/ADMIN cookie cannot bypass a subsequent change to OBSERVER.
Existing administrative guards continue excluding observers. Reading a chat
does not clear its unread count. Observer sessions do not emit staff presence
updates, accept new leads or have a SIP extension. Creation and role changes
enforce these account defaults on the server.

The shared access provider hides/disables editing, sending, booking, call and
pipeline-drag controls while preserving navigation, search, pagination and
reading. The interface displays a Russian/Kazakh observer banner. Staff roles
retain their previous controls and permissions.

The additive migration `20261115150000_observer_role` adds one PostgreSQL enum
value only. Build both app and worker so their generated Prisma clients know
the new role. Apply only migrations using `prisma migrate deploy`, never the
Compose migrate service (which also runs seed). Recreate app and worker with
`--no-deps`; create observer accounts only after both are running the new image.

Account email/name are supplied by the owner. The desired password is handed
off via Gateway stored value `crm-observer-password-20261115`, then used only
on the VPS. Do not print, commit or reset existing credentials. Verify a real
password login and demonstrate both successful reads and rejected write/call
requests before reporting account creation complete.

Validation: both production images built and all 128 unit tests passed. The
additive migration was applied without seed. On the public HTTPS site a temporary
OBSERVER completed a real browser password login, read business APIs and browsed
leads, contact details, pipeline and chat history. Creation/composer controls
were hidden, contact fields/call controls disabled and pipeline dragging disabled.
35 write requests returned 403, repeated successfully with a stale ADMIN claim
against the same live observer record. SIP/bootstrap, exports and settings reads
were denied. A separate focused manager check confirmed the enabled create form,
phone iframe and real SIP bootstrap 200. The temporary observer was removed.

The requested permanent account is still pending its Gateway password handoff;
the proposed default login is `observer@quantum.ushqn.com`, name `Наблюдатель`.
The root-only creation/verification script is
`/root/crm-observer-account-20261115.cjs`; it takes the password only from
`CRM_OBSERVER_PASSWORD`, supplied by the stored-value name above, and refuses to
overwrite another account. The script verifies password login, a successful read,
and denied write/SIP requests. Do not report the permanent account as created
until that script succeeds.

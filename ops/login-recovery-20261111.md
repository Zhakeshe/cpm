# Password-login investigation — 11 November 2026

The production database and authenticated CRM APIs were healthy. Account rows
and bcrypt hashes were intact. The three manager credentials saved during the
authorized October recovery matched their current hashes; real password POSTs
and subsequent session GETs returned 200 for all three. An actual manager login
was also recorded independently in the production audit log during diagnosis.
No login counters were blocked at inspection. Inactive legacy accounts stay
inactive; no manager password was reset.

The login form used React state rather than submitted DOM values, so browser
autofill could submit stale credentials. It did not trim pasted email, did not
prevent concurrent submits, and presented rate-limit/server errors as an invalid
password. The fix reads named form fields, normalizes only email and TOTP,
preserves password whitespace, guards duplicate submits, bounds network wait,
and shows separate validation, 429, connection, server and credential errors.
Successful login refreshes the router's authenticated state. Invalid request
JSON now returns a JSON 400; infrastructure errors remain JSON 500. Existing
IP/account limits, account blocking and TOTP checks are unchanged.

The sole admin login is `admin@crm.local`. Its hash does not match the seed
credential, so the seed password must not be restored or guessed. If a password
reset is needed, the owner supplies a new value through Gateway's secure stored
value handoff. Preserve the previous admin record in a root-only recovery file,
update only this active ADMIN's hash transactionally with an audit event, and
verify a real password login and protected session before reporting success.
Never print credentials, hashes, session cookies or recovery tokens.

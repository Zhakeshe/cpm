# SIP browser validation — 2026-10-25

Runtime change: `0ce5633` on `cursor/no-wa-autogreet-29f9`. Only app was rebuilt/recreated; no database migration was run for this SIP fix. The built image passed 91 automated tests.

Real Chromium ran in a temporary container on the CRM VPS. It loaded the public HTTPS site with the existing account roles (extensions 100 and 104). Credentials and cookies stayed inside the VPS/browser process. They were never emitted in logs or saved in Git.

Verified:

- Public `/sip-phone` rendered **Софтфон готов** for both accounts.
- The backend browser-bootstrap response contained an account key and no SIP password; Chromium fetched the datacenter credentials directly from the provider using CORS.
- SIP registration completed with an authenticated 200. The initial 401 challenge is normal digest authentication.
- Closing each test WebSocket caused the UI to show reconnecting, then return to ready with authenticated 200.
- Both accounts remained ready for five minutes after reconnect; natural registration renewal also completed with 200.
- The same initial registration and reconnect checks were repeated from the actual `/leads` page, inside its `/sip-phone` iframe.
- The microphone permission button worked with Chromium's **fake** media device. This checks the UI path only.

Browser telemetry requests from the probes were intercepted so test state would not overwrite staff diagnostics. At the last production diagnostic read, staff's already-open frames were still posting the older payload without `clientVersion`; those frames had not loaded `browser-auth-v1` yet.

Limits: the browser ran from the VPS network, not a staff workstation. No PSTN call was placed because a test destination was not supplied. Real incoming/outgoing calls, physical microphone audio, two-way provider media and recording playback are still unverified. Do not claim them based on registration, fake media permission or HTTP health checks.

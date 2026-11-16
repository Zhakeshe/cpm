# Zadarma connection repair — 15 November 2026

Five active CRM users had extensions 105–109 but no full SIP authentication
login. The provider's registry initially contained only extensions 100–107.
Extensions 108 and 109 were created through the documented PBX API with
`buy=false` and `return_password=false`; the provider returned HTTP 201 and
confirmed both numbers. No paid extensions were purchased.

Full SIP usernames were set only for the five existing active CRM assignments,
after confirming each extension in the provider registry. The five established
assignments 100–104, CRM passwords, roles, leads and application code were
unchanged. Previous mappings and provider creation summaries are stored in the
root-only directory `/root/crm-sip-repair-20261115`. Updates have audit events.

Real Chromium on the VPS loaded the public HTTPS CRM. All ten extensions
100–109 reached `ready` with authenticated SIP 200 after the normal 401 digest
challenge. Extensions 100 and 105 were tested inside the actual `/leads` phone
iframe; the others used `/sip-phone`. Forced disconnect/reconnect on 105 also
returned SIP 200. Bootstrap/provider HTTP requests returned 200 and no page or
provider network errors were observed. Test telemetry and unrelated mutations
were intercepted, so the probe did not replace staff diagnostics or alter CRM
records. The temporary browser container was removed on completion.

After browser verification, the TELEPHONY integration status is set to CONNECTED.
Existing staff pages with a failed bootstrap must refresh or press reconnect to
load their repaired account mapping.

Limits: registration was tested from the VPS network. The provider balance was
0 KZT. No external test destination was supplied and no PSTN call was placed;
physical microphones, two-way call audio, inbound call routing and recording
playback are not established by successful SIP registration. Check balance and
price-plan allowances before diagnosing an external call failure.

API reference: https://zadarma.com/en/support/api/ (`/v1/pbx/internal/`,
`/v1/pbx/internal/create/`, `/v1/webrtc/get_key/`). API keys, permanent/temporary
SIP passwords, provider bootstrap keys and session cookies stayed on the VPS
and were never printed or committed.

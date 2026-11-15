# Zadarma parameter alignment and call test — 15 November 2026

Using the existing authenticated provider API, extensions 108–109 were assigned
the same corporate Caller ID already used by 100–107. Cloud recording was
enabled for 105–109 with speech recognition off. Read-back confirmed the shared
Caller ID and enabled recording for all five. Existing 100–104 settings and
PBX inbound/IVR routing were preserved. No tariff, paid extension or transcription
purchase was made. Pre-change provider settings are stored root-only in
`/root/crm-zadarma-full-setup-20261115/before.json`; an integration audit records
the changes without credentials.

The owner first supplied a destination ending 0702, then replaced it with a
destination ending 9188. Only the latter was used for test attempts. No call
was placed to the superseded number.

The existing CRM callback helper accepted an API request from extension 100 but
delivered no inbound INVITE to a ready WebRTC phone during the 30-second wait.
A separate direct JsSIP diagnostic registered extension 100, confirmed provider
online status and received SIP 200 on an outbound INVITE. Provider PBX statistics
describe a five-second answered PBX leg; that is not proof the external callee
answered. General external-call statistics report hangup cause 34, zero billed
seconds and zero cost. The actual test destination's quoted rate was 56 KZT/min;
the balance was zero and the Office price plan was active.

CRM received and processed the test's call-recording webhook. Its outbound call
row has a four-second ANSWERED PBX leg and a recording reference. This confirms
event/recording ingestion, not a successful PSTN connection; external cause 34
and zero billed seconds remain the relevant limitation.

The probe attempted a generated Russian test announcement through a synthetic
microphone. Media statistics were collected only after the peer connection had
closed; their zero counters do not establish whether RTP ever flowed. No
successful external conversation, physical microphone audio or two-way media
was confirmed. Do not label this call test successful based on the SIP 200 or
PBX-leg disposition. Review provider outbound routing/limits and funding, then
repeat with the owner's test destination. Do not retry another destination.

The selected Cloud environment has no shared desktop/browser-control tools.
Provider setup used API calls and repeatable Chromium diagnostics on the VPS,
not the owner's personal browser or a signed-in provider GUI. Secrets stayed
within remote processes. Temporary diagnostic containers exited and were removed.

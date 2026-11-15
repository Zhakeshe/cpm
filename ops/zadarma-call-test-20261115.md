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
seconds and zero cost. A quote without Caller ID returned 56 KZT/min, but the
same destination with the owned Kazakhstan Caller ID returned 0 KZT. The paid
Office Kazakhstan plan (tariff 53) is active and includes 1,000 minutes. Its
used-seconds counters remain zero. A zero cash balance does not establish that
additional funding is necessary; the earlier top-up advice was unsupported.

CRM received and processed the test's call-recording webhook. Its outbound call
row has a four-second ANSWERED PBX leg and a recording reference. This confirms
event/recording ingestion, not a successful PSTN connection; external cause 34
and zero billed seconds remain the relevant limitation.

The probe attempted a generated Russian test announcement through a synthetic
microphone. Media statistics were collected only after the peer connection had
closed; their zero counters do not establish whether RTP ever flowed. No
successful external conversation, physical microphone audio or two-way media
was confirmed. Do not label this call test successful based on the SIP 200 or
PBX-leg disposition. Review provider outbound routing and account restrictions,
then repeat with the owner's test destination. Do not retry another destination.

## Follow-up after checking the paid package

The owned Kazakhstan DID ending 6753 was reassigned from standalone SIP 158925
to the PBX parent SIP 321096. PUT without `test_mode` succeeded and read-back
confirmed the new binding. An earlier attempt with `test_mode=off` failed.
Both parent SIP Caller IDs were aligned to that owned DID and read back
successfully. Pre-change snapshots are root-only under the existing setup
directory (`did-binding-before.json`, `parent-sip-before.json`). An integration
audit records the changes without the full DID or credentials. An attempted
forwarding activation was not confirmed: parent 321096 still reports status
off, destination PBX 593615. That status alone does not establish a PBX defect.

A direct PBX call using the national 8 prefix and explicit STUN reached SIP 200
and a connected ICE peer. Live samples showed 33,760 bytes sent and 33,120 bytes
received before the remote party terminated the approximately five-second leg.
The external CDR still reports cause 34, zero billed seconds and zero cost.
A separate direct WebRTC call through standalone SIP 158925, using international
7 format and the same owned Caller ID, also carried RTP in both directions
(29,920 bytes each) and ended with external cause 34 and zero billed seconds.
These results establish media transport to Zadarma, not a conversation with the
owner. No production user was switched to the standalone SIP.

Callback was retried after provider API confirmed extension 100 online. Both
documented short extension 100 and a diagnostic full login 593615-100 request
were accepted, but neither delivered an inbound INVITE within 30 seconds. No
callback implementation change was deployed without evidence of a working
replacement. The existing external KTS line reports active but Disabled; it
was not reset, deleted, reconfigured or assumed to be the cause. No API
statistics field established that these test calls traversed KTS.

The failed PBX recording was retrieved without exposing its signed URL.
Local offline speech recognition produced inconsistent, unintelligible text;
no diagnosis relies on that transcript. No provider transcription was purchased.
At the end of the probes, temporary call containers had exited, no test call
was left running, the app/database were healthy and the public login returned
HTTP 200. External calling remains unverified and blocked by the observed
provider-side call failure; the precise cause requires further provider/account
routing inspection. Do not report telephony as fully fixed.

The selected Cloud environment has no shared desktop/browser-control tools.
Provider setup used API calls and repeatable Chromium diagnostics on the VPS,
not the owner's personal browser or a signed-in provider GUI. Secrets stayed
within remote processes. Temporary diagnostic containers exited and were removed.

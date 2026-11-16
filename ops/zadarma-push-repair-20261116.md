# Zadarma incoming WebRTC repair — 16 November 2026

The CRM had registered a JsSIP user agent but did not subscribe to Zadarma's
WebRTC push channel. Registration alone does not announce incoming webphone
calls. The official v8 client subscribes to the Socket.IO namespace
/webrtc_pushes and starts a fresh SIP connection when the user answers.

The phone now subscribes to that provider channel with the authenticated user's
temporary bootstrap key. An incoming notification opens the phone panel. Answer
and decline request fresh provider-selected SIP connection parameters. The
temporary user agent is stopped after the call, while the push subscription
remains available for the next call. Reconnect, heartbeat and disposal handling
are included. Static SIP configuration remains supported. No passwords, tariffs,
PBX routing, KTS settings or unrelated CRM functions were changed.

Official reference:
https://zadarma.com/en/support/instructions/crm-zadarma/
Implementation behavior was compared with the provider's v8 widget-api library.

## Validation

- Eleven relevant unit tests and TypeScript checking passed; production image built.
- Before repair, internal 100-to-109 calls received SIP 603 and no incoming UI.
- With the candidate served under the real HTTPS origin, actual CRM extension
  109 received the internal call, answered from the normal button and exchanged
  audio RTP in both directions: caller 40,000 sent / 39,680 received bytes,
  receiver 42,400 sent / 40,000 received bytes. Synthetic microphones were used.
- Hangup, cancellation before answer and decline all returned the actual CRM
  phone to ready. A declined caller received a normal rejection.
- All ten assignments 100–109 reached ready with the new push client. The actual
  leads iframe was used for 100 and 105; forced reconnection of 105 also passed.
  Ready now means the incoming notification channel is connected; it does not
  falsely require a permanent SIP registration while idle.
- A real, non-mocked POST through the existing CRM calls API for the authorized
  destination ending 9188 delivered its callback to the browser. Answering
  established media with Zadarma (68,480 sent / 31,520 received bytes).

## External-call limit

The callback's external CDR 6afb061de9ba23760433e0a9 at provider API time
2026-11-16 18:33:17 still reports cause 34 and zero billed seconds. This does not
establish a successful PSTN conversation with the authorized destination.
Synthetic media and PBX-leg answer status do not establish physical microphone
or end-to-end external audio.

Other provider CDRs from the same day contain successful external calls through
parent SIP 321096 and standalone 158925 to other destinations. Therefore the
earlier blanket conclusion that external SIP does not work was too broad.
Those other destinations were not dialed by this investigation. No new test
destination was assumed authorized.

No provider passwords or API secrets are stored in this report or source.
The Docker build context contained tracked
source plus the two new source/test files, without server environment files.
Temporary candidate browsers did not replace staff SIP diagnostic records.

## Deployment

The validated candidate was deployed to the app service only. Its image is
crm-app:sip-push-20261116; the prior running image is retained as
crm-app:before-zadarma-push-20261116. Database, worker and other services were
not recreated.

The actual public site was tested again after deployment: internal 100-to-109
incoming delivery and answer passed, with caller 39,680 sent / 39,520 received
bytes and receiver 42,560 sent / 39,680 received bytes. Hangup, remote
cancellation before answer and decline again returned the phone to ready.
These are synthetic internal audio tests, not a verified PSTN conversation.
Existing open CRM pages need a refresh to load client browser-push-v2.

# Incoming lead priority and the Kaspi message draft

Outgoing WhatsApp messages are saved in the chat history. They do not create
contacts or leads from Wazzup echoes, change incoming lead priority, or reassign
the contact's owner. Outgoing echoes for numbers outside the CRM are ignored;
the first actual customer inbound creates their contact and lead normally.

The lead list and pipeline use `Contact.leadActivityAt` with an ID tie-breaker.
It starts at contact creation and advances only on customer WhatsApp inbound.
Old webhook deliveries cannot move it backwards; future timestamps are clamped.
The messages list sorts by `Conversation.lastCustomerMessageAt`, with outgoing-only
chats last. The original creation date, owner, deal status and pipeline stage
are preserved when a customer replies; no second lead is created.

Migration `20261105090000_customer_inbound_priority` adds and backfills the
priority timestamp from contact creation and actual inbound messages. Outgoing
history is not used. Before deploying, run the migration guard with only this
migration allowed. Back up first; do not run the compose seed/migrate service.

The exact requested copy is in
`scripts/campaigns/kaspi-zhuma-20261105.txt`. It is a draft, not an instruction
to start sending. The user subsequently confirmed a one-time broadcast;
preparation and execution are described in `ops/whatsapp-broadcast.md`.
At inspection on 5 November the CRM had 2,930 active contacts, one archived
contact, and zero recorded WhatsApp opt-outs. Destination validation excluded
five invalid phone numbers, leaving 2,925 eligible destinations and no duplicate
or business-number destinations at the time of the preview. Final preparation must
deduplicate destination numbers, exclude the business's own number, recheck
opt-outs, and report invalid numbers before starting any campaign.

The full integration run exposed two stale test fixtures: the Meta service-window
suite used permissive mock transport rather than Meta policy, and the phone-routing
test referenced a callback stage absent from its seed. Tests now explicitly use
the Meta transport and an existing seeded stage. No telephony runtime behavior
was changed.

# Wazzup rejects live WhatsApp auto replies — 25 October 2026

Status: **unresolved provider rejection; live delivery has not succeeded**.

The CRM receives the customer's test messages, processes the webhook, and
attempts the configured greeting through the selected Wazzup channel. The
selected channel matches the business number ending 3016 and reports `active`.
The outgoing recipient matches the incoming WhatsApp sender; it is not the
business account itself. No outbound greeting record was created.

The live `POST https://api.wazzup24.com/v3/message` responses were HTTP 400:

- `POST_MESSAGE_ERROR`, nested `UNKNOWN_ERROR`.
- Request `d31462aece52a21448bfc5dd463d5ae2` at 12:34:15 UTC.
- Request `a3de57caaa853b76ae2262a3d89eb97a` at 12:34:52 UTC.
- One bounded recovery attempt, with `crmMessageId` and
  `clearUnanswered: false`, was also rejected. Request
  `8a3c8a481bff5dcce3da7e5c2357e734` at 12:42:55 UTC.

The documented required request format matches the CRM implementation:
channelId, chatType=whatsapp, numeric chatId, and text. The message is 567
characters. The exact cause behind the provider's `UNKNOWN_ERROR` is unknown.
Do not infer successful delivery from channel state or passing mocked tests.
Do not clear uncertain claims or repeatedly resend. Two affected claims remain
blocked to avoid duplicate deliveries.

Next diagnosis: check manual sending from the same chat inside Wazzup. If that
fails too, inspect the channel session in the Wazzup account. Wazzup's official
error reference directs UNKNOWN_ERROR cases to their support; provide the
request IDs above. No support message has been sent by the agent.

Sources:
- https://wazzup24.com/help/api-en/sending-messages/
- https://wazzup24.com/help/api-en/common-errors/

Prepared support text (for the account holder to send):

> Здравствуйте. Через активный WhatsApp-канал с номером, оканчивающимся на 3016,
> запрос POST /v3/message с корректными channelId, chatType=whatsapp, chatId
> и text возвращает HTTP 400, POST_MESSAGE_ERROR, data.code=UNKNOWN_ERROR.
> Входящие webhook приходят. Повтор 25.10.2026 в 12:42:55 UTC тоже отклонён.
> RequestId: 8a3c8a481bff5dcce3da7e5c2357e734. Просьба проверить причину
> отказа отправки на вашей стороне. Другие requestId указаны выше.

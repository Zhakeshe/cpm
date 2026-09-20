# Production deploy

Сервер поднимается Docker Compose: Postgres, Redis, MinIO (`quay.io/minio/*`), app, worker, Caddy (HTTPS `quantum.ushqn.com`).

CRM открывать только как `https://quantum.ushqn.com`. Адрес `https://31.77.12.47` даёт ошибку SSL: сертификат Let's Encrypt выписан на домен, не на IP. `http://31.77.12.47` редиректит на домен.

```bash
git clone <repo> /opt/crm && cd /opt/crm
APP_URL=http://YOUR_SERVER_IP bash scripts/bootstrap-env.sh .
docker compose up -d --build
```

После старта:

- CRM: `http://YOUR_SERVER_IP`
- Health: `http://YOUR_SERVER_IP/api/health`
- Локальный seed: `admin@crm.local` / `Admin123!` — на проде сразу смените
- Менеджеры (seed): `manager1@crm.local` … `manager5@crm.local` / `Manager123!`

Внутренние порты Postgres/Redis/MinIO наружу не публикуются.

## Wazzup (пока Meta не верифицирует)

В `.env` на сервере:

- `WAZZUP_API_KEY` — ключ из кабинета Wazzup → API
- `WAZZUP_CHANNEL_ID` — UUID WhatsApp-канала (QR), либо выбрать в Настройки → Wazzup

Webhook: `https://quantum.ushqn.com/api/webhooks/wazzup`

В кабинете Wazzup нажмите «Подписать вебхук» в CRM или `PATCH /v3/webhooks`. Пока ключ задан, исходящие идут в Wazzup, не в Graph.

Прямой Meta WABA **не удаляем** (см. `docs/META_WABA.md`). Код и `WHATSAPP_*` в `.env` остаются. Сейчас `WHATSAPP_TRANSPORT=wazzup`. После верификации: `WHATSAPP_TRANSPORT=meta`, ключ Wazzup убрать.

## WhatsApp Cloud API (WABA)

В `.env` на сервере заполните:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_VERIFY_TOKEN` (уже сгенерирован скриптом)

В Meta App укажите:

- Callback: `https://quantum.ushqn.com/api/webhooks/whatsapp`
- Verify token: `quantum_waba_verify_2026` (`WHATSAPP_VERIFY_TOKEN`)
- Подписка: `messages`

Для Lead Ads:

- Callback: `http://YOUR_SERVER_IP/api/webhooks/meta-leads`
- `META_LEADS_ACCESS_TOKEN` (можно тот же permanent token)

После правок `.env`: `docker compose up -d app worker`.

Те же URL видны в CRM: Настройки → Вебхуки интеграций.

## SIP / АТС

В `.env`: `SIP_WEBHOOK_SECRET`, при необходимости `SIP_ORIGINATE_URL`, `SIP_WS_URL`, `SIP_DOMAIN`.

Webhook АТС: `POST http://YOUR_SERVER_IP/api/webhooks/telephony` с заголовком `x-sip-secret`.

Софтфон: Настройки → SIP / софтфон — WebSocket URL, домен, JSON паролей внутренних номеров (`101`–`105`).

## HTTPS

Перед Nginx поставьте TLS (Caddy / certbot / балансировщик), выставьте `APP_URL=https://crm.example.com` и `COOKIE_SECURE=true`.

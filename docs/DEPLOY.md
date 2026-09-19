# Production deploy

Сервер поднимается Docker Compose: Postgres, Redis, MinIO (`quay.io/minio/*`), app, worker, Nginx на `:80`.

```bash
git clone <repo> /opt/crm && cd /opt/crm
APP_URL=http://YOUR_SERVER_IP bash scripts/bootstrap-env.sh .
docker compose up -d --build
```

После старта:

- CRM: `http://YOUR_SERVER_IP`
- Health: `http://YOUR_SERVER_IP/api/health`
- Admin: `admin@crm.local` / `Admin123!` — смените пароль сразу
- Менеджеры: `manager1@crm.local` … `manager5@crm.local` / `Manager123!`

Внутренние порты Postgres/Redis/MinIO наружу не публикуются.

## WhatsApp Cloud API (WABA)

В `.env` на сервере заполните:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_VERIFY_TOKEN` (уже сгенерирован скриптом)

В Meta App укажите:

- Callback: `http://YOUR_SERVER_IP/api/webhooks/whatsapp`
- Verify token: значение `WHATSAPP_VERIFY_TOKEN`
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

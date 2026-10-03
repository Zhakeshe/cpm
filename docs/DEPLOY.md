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
- Локальный seed: `admin@crm.local` / `<LOCAL_DEMO_PASSWORD>` — на проде сразу смените
- Менеджеры (seed): `manager1@crm.local` … `manager5@crm.local` / `<LOCAL_DEMO_PASSWORD>`

Внутренние порты Postgres/Redis/MinIO наружу не публикуются.

## Wazzup (пока Meta не верифицирует)

В `.env` на сервере:

- `WAZZUP_API_KEY` — ключ из кабинета Wazzup → API
- `WAZZUP_CHANNEL_ID` — UUID WhatsApp-канала (QR), либо выбрать в Настройки → Wazzup

Webhook: `https://quantum.ushqn.com/api/webhooks/wazzup`

Публичный номер для ссылок соцсетей: `WHATSAPP_PUBLIC_NUMBER=77765079188` (цифры без +). Ссылки: `https://quantum.ushqn.com/w/instagram`, `/w/tiktok`, `/w/facebook`, `/w/youtube`, `/w/site`, `/w/ads`. Клик пишет только `qc:токен` в WhatsApp (без авто-текста); когда клиент пишет, источник карточки = сеть, не WhatsApp. CRM сам в чат не отвечает.

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
- Verify token: `<server WHATSAPP_VERIFY_TOKEN>` (`WHATSAPP_VERIFY_TOKEN`)
- Подписка: `messages`

Для Lead Ads:

- Callback: `http://YOUR_SERVER_IP/api/webhooks/meta-leads`
- `META_LEADS_ACCESS_TOKEN` (можно тот же permanent token)

После правок `.env`: `docker compose up -d app worker`.

Те же URL видны в CRM: Настройки → Вебхуки интеграций.

## SIP / Zadarma

См. [ZADARMA.md](ZADARMA.md): явное назначение реальных SIP accounts, server-only credentials, настройки provider CallerID/PBX, безопасное развёртывание и тесты. Legacy `SIP_EXTENSIONS_JSON`, `SIP_ORIGINATE_URL`, `SIP_API_TOKEN` не используются. Ранее сохранённые в Integration пароли не читаются и не возвращаются через настройки; перенесите необходимые credentials в server env. Данные БД автоматически не удаляются.

## HTTPS

Перед Nginx поставьте TLS (Caddy / certbot / балансировщик), выставьте `APP_URL=https://crm.example.com` и `COOKIE_SECURE=true`.

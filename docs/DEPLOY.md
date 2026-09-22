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

Публичный номер для ссылок соцсетей: `WHATSAPP_PUBLIC_NUMBER=77765079188` (цифры без +). Ссылки: `https://quantum.ushqn.com/w/instagram`, `/w/tiktok`, `/w/facebook`, `/w/youtube`, `/w/site`, `/w/ads`. Клик пишет уникальный `qc:токен` в WhatsApp; когда клиент пишет, источник карточки = сеть, не WhatsApp, и уходит авто-приветствие канала.

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

## SIP / Zadarma

Виртуальная АТС — **Zadarma**. WhatsApp остаётся на Wazzup до верификации Meta.

В `.env` на сервере (ключи из кабинета Zadarma → Настройки → Интеграции и API):

- `ZADARMA_USER_KEY`
- `ZADARMA_SECRET`
- `SIP_WS_URL=wss://pbx.zadarma.com:8089/ws`
- `SIP_DOMAIN=pbx.zadarma.com`

В АТС заведите внутренние **101–105**, включите **WebRTC**, пароли вставьте в CRM: Настройки → Zadarma SIP (JSON).

Уведомления PBX: `https://quantum.ushqn.com/api/webhooks/telephony`  
(в кабинете Zadarma поле «Уведомления о звонках АТС», должен открываться `zd_echo`).

Click-to-call с карточки клиента идёт через `GET /v1/request/callback/`. Софтфон в браузере регистрируется по WebSocket.

После правок `.env`: `docker compose up -d app worker`.

## HTTPS

Перед Nginx поставьте TLS (Caddy / certbot / балансировщик), выставьте `APP_URL=https://crm.example.com` и `COOKIE_SECURE=true`.

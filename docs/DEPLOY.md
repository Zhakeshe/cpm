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

Для АТС `593615` используйте внутренние **100–102** с SIP-логинами `593615-100`, `593615-101`, `593615-102`. Внутренний номер нужен для маршрутизации и callback, полный логин — для регистрации софтфона. Включите **WebRTC** в кабинете Zadarma.

После смены тарифа Zadarma может выдать прямые SIP-логины без дефиса (`158925`, `200223` и т. п.). Оставьте ключи `101–104` как логические номера менеджеров, а новый SIP-логин укажите в `username`. Click-to-call использует `username`, webhook принимает и логический номер, и прямой SIP-логин.

В CRM: Настройки → Zadarma SIP (JSON) поддерживается формат:

```json
{
  "100": { "username": "593615-100", "password": "<пароль внутреннего 100>" },
  "101": { "username": "593615-101", "password": "<пароль внутреннего 101>" },
  "102": { "username": "593615-102", "password": "<пароль внутреннего 102>" }
}
```

Добавьте этот JSON одной строкой в `SIP_EXTENSIONS_JSON` в серверном `.env` (не в git). Скрипт сохраняет текущих владельцев логических номеров, включая администратора; свободные номера назначает активным пользователям по порядку. Он также сохраняет настройки софтфона и снимает конфликтующие прежние назначения. Остальные настройки интеграций сохраняются. При нехватке пользователей изменения не выполняются.

После сборки нового образа:

```bash
docker compose run --rm --no-deps app npm run zadarma:setup -- --dry-run
docker compose run --rm --no-deps app npm run zadarma:setup
```

Обновите страницу CRM у менеджеров и проверьте регистрацию софтфона. Скрипт не проверяет подключение к АТС. Для click-to-call и уведомлений нужны API-ключи ниже; SIP-пароль не заменяет `ZADARMA_SECRET`.

Уведомления PBX: `https://quantum.ushqn.com/api/webhooks/telephony`  
(в кабинете Zadarma поле «Уведомления о звонках АТС», должен открываться `zd_echo`).

Click-to-call с карточки клиента идёт через `GET /v1/request/callback/`. Софтфон в браузере регистрируется по WebSocket.

После правок `.env`: `docker compose up -d app worker`.

## HTTPS

Перед Nginx поставьте TLS (Caddy / certbot / балансировщик), выставьте `APP_URL=https://crm.example.com` и `COOKIE_SECURE=true`.

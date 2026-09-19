# Amanat CRM

Production CRM для отдела продаж: клиенты, лиды, WhatsApp Cloud API, SIP-телефония, воронка, задачи, демо, аналитика и аудит.

## Стек

Next.js 15 · TypeScript · Prisma · PostgreSQL · Redis/BullMQ · Socket.IO · Docker

## Быстрый старт (dev)

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
npm install
npx prisma migrate dev
npx prisma db seed
npm test
npm run dev
```

Откройте http://localhost:3000

Демо-пользователи:

| Роль | Email | Пароль |
| --- | --- | --- |
| Руководитель | admin@crm.local | Admin123! |
| Менеджеры 1–5 | manager1@crm.local … manager5@crm.local | Manager123! |

SIP-внутренние номера: 101–105.

## Production

Пошаговая инструкция: [docs/DEPLOY.md](docs/DEPLOY.md).

```bash
APP_URL=http://YOUR_SERVER_IP bash scripts/bootstrap-env.sh .
docker compose up -d --build
```

Caddy слушает `:80`/`:443` для `quantum.ushqn.com` и ставит Let's Encrypt. Postgres, Redis и MinIO наружу не открываются. В production выставьте `COOKIE_SECURE=true`.

Отдельные окружения: `development` / `staging` / `production` — разные `DATABASE_URL`, `REDIS_URL` и секреты. Реальные WABA/SIP credentials не использовать в local development.

## Интеграции

### WhatsApp Cloud API (Direct WABA, без посредников)

Что нужно завести в Meta: App, Business Portfolio, WhatsApp Business Account, Business Phone Number. Из них взять `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, permanent token системного пользователя (`WHATSAPP_ACCESS_TOKEN`), `META_APP_SECRET` (или `WHATSAPP_APP_SECRET`) и `WHATSAPP_VERIFY_TOKEN`. Все они живут только в backend `.env`; во фронтенд не попадает ничего.

- Verify: `GET /api/webhooks/whatsapp` — plain text `hub.challenge`
- Inbound: `POST /api/webhooks/whatsapp` (подпись `X-Hub-Signature-256` по raw body, если секрет задан)

## WHATSAPP CLOUD API SETUP

1. Deploy backend на HTTPS-домен (не localhost и не private IP).

2. В Meta Developers открыть:

   WhatsApp → Настройка рабочей среды → Настроить Webhooks

3. Callback URL:

   `https://quantum.ushqn.com/api/webhooks/whatsapp`

4. Verify Token:

   `quantum_waba_verify_2026`

   Он должен совпадать с `WHATSAPP_VERIFY_TOKEN` в `.env`.

5. Нажать **Подтвердить и сохранить**. Meta шлёт GET с `hub.mode`, `hub.verify_token`, `hub.challenge`. Backend отвечает `200` и телом `hub.challenge` (`text/plain`).

6. После успешной verification подписаться на field: **messages**.

7. Отправить сообщение на WhatsApp test number.

8. Проверить backend logs / таблицу `WebhookEvent` / инбокс CRM.

Запуск и проверка локально:

```bash
cp .env.example .env
npm test -- tests/whatsapp-webhook.test.ts
npm run test:integration
```

Проверка verification без UI:

```bash
curl -sS "https://quantum.ushqn.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=quantum_waba_verify_2026&hub.challenge=123456"
# ожидается: 123456
```
- Исходящие: `POST /api/messages/send`
- Загрузка файла перед отправкой: `POST /api/messages/upload`
- Отдача медиа с проверкой прав: `GET /api/media/:messageId`

**Окно 24 часа.** Для каждого диалога хранятся `lastCustomerMessageAt` и `serviceWindowExpiresAt`. Пока окно открыто, менеджер пишет свободный текст и шлёт файлы. После закрытия сервер отвечает `SERVICE_WINDOW_CLOSED`, поле ввода блокируется, доступны только шаблоны со статусом APPROVED. Ответ клиента открывает окно заново.

**Шаблоны.** Раздел «Настройки → Шаблоны WhatsApp»: имя в Meta, язык, категория, текст с переменными `{{1}}`, статус. Менеджер выбирает шаблон в инбоксе и заполняет переменные.

**Медиа.** Входящие файлы скачиваются из Graph API и складываются в S3 (`Meta → backend → S3`), в чате показывается превью изображений, аудио и видео. Исходящие файлы сначала грузятся в Meta media API, копия сохраняется в S3.

### SIP / виртуальная АТС

Универсальный webhook:

`POST /api/webhooks/telephony`  
заголовок `x-sip-secret`

Пример события:

```json
{
  "event": "call.started",
  "callId": "abc",
  "direction": "INBOUND",
  "from": "77471234567",
  "to": "77270000000",
  "managerExtension": "101",
  "status": "RINGING"
}
```

Click-to-call: `POST /api/calls` с `contactId`. Если `SIP_ORIGINATE_URL` не задан, создаётся локальное событие звонка (dev).

**WebRTC-софтфон.** Менеджер говорит из браузера через гарнитуру. Креды не зашиты в фронтенд: `GET /api/sip/credentials` отдаёт залогиненному пользователю WebSocket-URL, SIP URI и пароль его внутреннего номера. Настраивается в Integration `TELEPHONY`:

```json
{
  "wsUrl": "wss://pbx.example.com:8089/ws",
  "domain": "pbx.example.com",
  "extensions": { "101": "secret-101", "102": "secret-102" }
}
```

Пока настройки нет, виджет софтфона просто не показывается.

### Meta Lead Ads

- Verify: `GET /api/webhooks/meta-leads` (`META_LEADS_VERIFY_TOKEN`, по умолчанию берётся WABA-токен)
- Inbound: `POST /api/webhooks/meta-leads`, подпись проверяется тем же `WHATSAPP_APP_SECRET`

Meta присылает только `leadgen_id`, поэтому ответы формы дочитываются из Graph API токеном `META_LEADS_ACCESS_TOKEN`. Из заявки сохраняются имя, телефон, email, кампания, объявление и форма; дальше работает обычный round-robin и дедупликация по телефону. Если токена нет, событие помечается FAILED и остаётся в очереди — его можно повторить из «Мониторинга» после настройки.

## Мониторинг и эксплуатация

Раздел «Мониторинг» (ADMIN, SUPERVISOR): состояние базы и Redis, счётчики событий по интеграциям и таблица вебхуков с ошибками. Упавшее событие повторяется кнопкой поштучно или все сразу; повтор пишется в audit log.

## Защита

- Rate limit на Redis: вход по IP и по аккаунту, общий бюджет API на пользователя (`API_RATE_LIMIT`, по умолчанию 600/мин)
- Мутации с чужого Origin отклоняются (`CROSS_ORIGIN_BLOCKED`), сессия в httpOnly-cookie SameSite=Lax
- Заголовки: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (микрофон только для софтфона), HSTS в production
- Подписи вебхуков Meta и секрет SIP, RBAC на каждом эндпоинте, audit log

## CI

`.github/workflows/ci.yml` поднимает PostgreSQL и Redis и прогоняет lint, typecheck, модульные тесты, миграции, интеграционные тесты и сборку.

## Ключевые правила

- Клиент идентифицируется по `phone_normalized` (unique).
- Повторный номер не создаёт второй контакт и не перераспределяет менеджера.
- Новые лиды — round-robin только по активным менеджерам с «Принимает новые лиды».
- Webhook: validate → сохранить событие → очередь → worker.
- Менеджер видит только свои записи; ADMIN — все.

## Backup и мониторинг

- Backup Postgres: сервис `backup` в compose, хранение 14 дней.
- Health: `GET /api/health`
- Логи не должны содержать access tokens.

## Тесты

- `npm test` — модульные: нормализация телефонов, round-robin, RBAC, подписи webhook.
- `npm run test:integration` — сценарии ТЗ на реальном PostgreSQL: создание клиента, duplicate detection, round-robin, вернувшийся клиент, менеджер OFF, WABA inbound и статусы, идемпотентность, SIP inbound/outbound, маршрутизация на ответственного, пропущенный звонок, SLA, поиск и права доступа.
- `npm run test:all` — всё сразу.

Интеграционные тесты используют отдельную схему `crm_test` в той же базе, поэтому данные разработки не затрагиваются.

## Работа менеджера

Быстрые действия доступны и в карточке клиента, и в правой панели инбокса: написать в WhatsApp, позвонить, создать задачу с напоминанием и назначить демо — не уходя от клиента. Ссылка `/messages?contact=<id>` открывает нужный диалог сразу.

Напоминания шлёт воркер раз в минуту: задача с `reminderAt`, однократное уведомление о просрочке и предупреждение за 30 минут до демо.

Стадия воронки может требовать заполненные поля (`dealAmount`, `email`, `comment`, свои поля из custom fields). Список задаётся в «Настройках», а перенос карточки без них отклоняется с ответом `STAGE_FIELDS_REQUIRED` и перечнем недостающих полей.

## Языки

Тексты интерфейса живут в `src/i18n/ru.json` и `src/i18n/kk.json`, компонент читает их через `useI18n()`. Язык переключается в сайдбаре и на странице входа, выбор хранится в cookie `crm_locale`. Если ключа нет в казахском словаре, подставляется русский, поэтому перевод можно доливать частями.

Экраны CRM читают `src/i18n/ru.json` и `src/i18n/kk.json`. Экспорт CSV: кнопки на страницах лидов, звонков и аналитики, эндпоинты `/api/export/leads`, `/api/export/calls`, `/api/export/analytics`.

## Real-time

Один Socket.IO-канал на вкладку (`/ws`). Без перезагрузки страницы обновляются: входящие WhatsApp-сообщения и список диалогов, новые лиды в списке, воронке и на дашборде, статусы звонков, уведомления и всплывающая карточка входящего звонка.

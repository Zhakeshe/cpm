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

```bash
docker compose up -d --build
```

Nginx слушает `:8080`. Для HTTPS поставьте TLS-терминацию перед Nginx (Let's Encrypt / cloud load balancer).

Отдельные окружения: `development` / `staging` / `production` — разные `DATABASE_URL`, `REDIS_URL` и секреты. Реальные WABA/SIP credentials не использовать в local development.

## Интеграции

### WhatsApp Cloud API

- Verify: `GET /api/webhooks/whatsapp`
- Inbound: `POST /api/webhooks/whatsapp`
- Исходящие: `POST /api/messages/send`

Секреты только на backend: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`.

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

### Meta Lead Ads

`POST /api/webhooks/meta-leads`

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

## Real-time

Один Socket.IO-канал на вкладку (`/ws`). Без перезагрузки страницы обновляются: входящие WhatsApp-сообщения и список диалогов, новые лиды в списке, воронке и на дашборде, статусы звонков, уведомления и всплывающая карточка входящего звонка.

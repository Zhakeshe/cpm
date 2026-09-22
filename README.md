# K.E.R.N FTC Scrimmage

Сайт регистрации школьных FTC-команд на scrimmage, который проводит **K.E.R.N School** в Астане.

Стек: Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma, PostgreSQL.

## Установка

```bash
npm install
```

## Настройка PostgreSQL

Локально можно поднять базу через Docker:

```bash
docker compose up -d
```

Либо создайте базу вручную:

```sql
CREATE DATABASE kern_scrimmage;
```

## Переменные окружения

Скопируйте пример и заполните значения:

```bash
cp .env.example .env
```

| Переменная | Описание |
| --- | --- |
| `DATABASE_URL` | Строка подключения PostgreSQL |
| `ADMIN_PASSWORD` | Пароль входа на `/admin` |
| `ADMIN_SESSION_SECRET` | Секрет подписи admin-cookie |
| `NEXT_PUBLIC_SITE_URL` | Публичный URL сайта |
| `NEXT_PUBLIC_INSTAGRAM_URL` | Instagram организаторов |
| `NEXT_PUBLIC_WHATSAPP_URL` | WhatsApp организаторов |

## Prisma migrate

```bash
npx prisma migrate dev
```

Для production:

```bash
npx prisma migrate deploy
```

`postinstall` автоматически выполняет `prisma generate`.

## Запуск dev

```bash
npm run dev
```

Сайт: [http://localhost:3000](http://localhost:3000)  
Админка: [http://localhost:3000/admin](http://localhost:3000/admin)

Полный цикл с нуля:

```bash
npm install
npx prisma migrate dev
npm run dev
```

## Production build

```bash
npm run build
npm start
```

## Деплой на VPS через PM2

1. Установите Node.js 20+, PostgreSQL и PM2.
2. Склонируйте репозиторий, создайте `.env`, выполните миграции.
3. Соберите проект и запустите процесс:

```bash
npm install
npx prisma migrate deploy
npm run build
pm2 start npm --name kern-ftc-scrimmage -- start
pm2 save
pm2 startup
```

Перед nginx/Caddy проксируйте на `http://127.0.0.1:3000`.

Для Vercel задайте те же переменные окружения и подключите PostgreSQL (например Neon, Supabase или свой VPS).

## Страницы

- `/` — лендинг и регистрация команды
- `/admin` — заявки организатора (закрыто паролем)
- `POST /api/register` — приём заявок

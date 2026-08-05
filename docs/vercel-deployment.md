# Deployment на Vercel

Приложение разворачивается целиком на Vercel: Vite SPA и Express API работают в одном проекте, данные находятся в Neon Postgres, изображения — в Vercel Blob.

## Настройка проекта

1. Импортируйте GitHub repository в Vercel.
2. Выберите Node.js `22.x`. Оставьте настройки из `vercel.json`: Install Command `npm ci`, Build Command `npm run vercel:build`, Output Directory `dist`.
3. В Marketplace подключите Neon к этому проекту. Интеграция должна добавить `DATABASE_URL`.
4. В Storage создайте Blob store и подключите его к проекту. Интеграция должна добавить `BLOB_READ_WRITE_TOKEN`.
5. Добавьте переменные для Production и Preview:

```text
APP_ENV=production
TELEGRAM_BOT_TOKEN=<BotFather token>
TELEGRAM_INIT_DATA_MAX_AGE_SECONDS=3600
SESSION_SECRET=<random string, минимум 32 символа>
RATE_LIMIT_HASH_SECRET=<random string, минимум 24 символа>
ALLOWED_ORIGINS=https://<ваш-домен>
VITE_APP_BASE_URL=https://<ваш-домен>
VITE_TELEGRAM_BOT_USERNAME=<bot username без @>
VITE_TELEGRAM_APP_SHORT_NAME=<short name Mini App>
VITE_DEMO_MODE=false
VITE_DEFAULT_LOCALE=ru
```

`DATABASE_URL` и `BLOB_READ_WRITE_TOKEN` не копируйте вручную, если они управляются интеграциями Vercel. Все значения `VITE_*` доступны браузеру; остальные переменные должны оставаться server-only.

## Схема базы

При первом запросе API схема создаётся автоматически. Для явной подготовки базы из локального окружения выполните:

```bash
npm run db:setup
```

Для этого локально должен быть доступен `DATABASE_URL`. Скрипт идемпотентен и использует `CREATE TABLE IF NOT EXISTS`.

## Проверка после deploy

- Откройте `/api/health` — ответ должен содержать `ok: true`, `storage: "vercel"`.
- Откройте Mini App из Telegram Menu Button и проверьте вход, autosave, загрузку аватара, публикацию и публичный `/c/<slug>`.
- Проверьте refresh вложенного маршрута, Preview deployment и Function Logs.
- После изменения env выполните Redeploy: существующий deployment не получает новые значения автоматически.
- После получения стабильного HTTPS URL установите его как URL Mini App в BotFather и добавьте домен в `ALLOWED_ORIGINS`.

`vercel.json` исключает `/api/*` из SPA fallback и задаёт CSP/security headers. Rollback выполняется из раздела Deployments.

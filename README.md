# Cardly

Telegram Mini App для создания профессиональной цифровой визитки. Владелец проходит onboarding, редактирует профиль, контакты, навыки, услуги и проекты, выбирает Clean/Dark/Editorial, публикует slug и видит статистику/leads. Посетитель открывает обычный HTTPS URL, делится карточкой, сохраняет vCard и отправляет заявку.

## Stack и устройство

React 19, strict TypeScript, Vite 8, Tailwind CSS 4, React Router, TanStack Query, React Hook Form/Zod, i18next, Express Vercel Function, Neon Postgres, Vercel Blob, Vitest/RTL и Playwright. Подробности: [архитектура](docs/architecture.md), [security](docs/security.md), [дизайн-карта](docs/design-implementation-map.md).

Требуется Node.js 22.x.

## Запуск

```bash
npm ci
npm run dev
```

Demo работает без Telegram/Postgres на `http://127.0.0.1:5173`, хранит draft в localStorage и никогда не включается в production build.

Полный локальный stack:

```bash
Copy-Item .env.example .env.local
npm run dev:full
```

Отдельно: `npm run dev:api`, `npm run db:setup`, `npm run dev:vercel` (последняя требует `vercel link`). API health: `GET /api/health`.

## Проверки

```bash
npm run check
npm run test:e2e
```

`check` запускает formatting, lint, оба typecheck, unit/component/API tests, production build и boundary checks. Playwright поднимает изолированный demo Vite server.

## Переменные окружения

Полный шаблон находится в `.env.example`.

Frontend: `VITE_APP_BASE_URL`, `VITE_TELEGRAM_BOT_USERNAME`, `VITE_TELEGRAM_APP_SHORT_NAME`, `VITE_DEMO_MODE`, `VITE_DEFAULT_LOCALE`.

Server-only: `APP_ENV`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS`, `DATABASE_URL`, `SESSION_SECRET`, `BLOB_READ_WRITE_TOKEN`, `ALLOWED_ORIGINS`, `RATE_LIMIT_HASH_SECRET`.

## Подготовка production

- [Vercel через GitHub](docs/vercel-deployment.md)
- [BotFather и Mini App](docs/telegram-setup.md)
- [Visual QA](docs/visual-qa.md)

Vercel settings: `npm ci`, `npm run vercel:build`, output `dist`, Node 22.x. Neon подключается через Vercel Marketplace и передаёт `DATABASE_URL`; Blob store подключается к проекту и передаёт `BLOB_READ_WRITE_TOKEN`.

## Troubleshooting и ограничения

- Пустой `initData`: owner route открыт не из Telegram; используйте demo локально или Menu Button.
- `Missing server environment variables`: проверьте Neon/Blob integrations и server-only env в Vercel.
- SPA refresh 404: убедитесь, что корневой `vercel.json` попал в deployment.
- Изменили env: выполните Redeploy; существующий deployment не получит новое значение автоматически.

MVP поддерживает одну визитку, три темы и агрегированную аналитику; без оплат, команд, custom domains per-card и полноценной CRM. Перед production проверьте актуальные тарифы и billing requirements Telegram, Neon, Vercel Blob и Vercel.

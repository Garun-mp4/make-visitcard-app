# Архитектура Cardly

Cardly — однодоменное приложение: Vite собирает React SPA в `dist`, а `api/[...path].ts` экспортирует Express-приложение как Vercel Function. Клиент обращается только к относительным `/api/*`.

## Потоки данных

- Владелец открывает Mini App, клиент передаёт неизменённый `initData` в `/api/auth/telegram`, сервер проверяет HMAC и возраст данных, затем выдаёт Firebase custom token.
- После `signInWithCustomToken` draft читается и сохраняется в `cards/{uid}` через Firebase Web SDK. Firestore Rules разрешают доступ только владельцу.
- Публикация идёт через API. Сервер атомарно резервирует `slugs/{slug}`, формирует очищенный `publicCards/{slug}` и обновляет draft.
- Публичный `/c/:slug` читает только snapshot. В нём нет UID, Telegram ID и приватных ссылок.
- Leads и analytics принимаются API, проходят Zod validation и персистентный Firestore rate limit. Клиент не может писать в эти коллекции напрямую.

## Границы модулей

- `shared/` — Zod-схемы, типы и demo fixtures без browser/server зависимости.
- `src/` — UI, owner/public flows, adapters и Firebase Web SDK.
- `server/` — Firebase Admin, Telegram validation/Bot API, publication и rate limiting.
- `api/[...path].ts` — минимальный deployment entry point.

Route-level lazy imports разделяют owner/editor/public chunks. `scripts/check-client-boundary.ts` проверяет отсутствие Admin SDK и маркеров server secrets в исходниках и production bundle.

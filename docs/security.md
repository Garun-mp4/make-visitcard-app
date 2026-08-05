# Security

## Модель угроз

Основные риски: подмена Telegram-пользователя, кража service credentials, доступ к чужому draft, гонка slug reservation, XSS через пользовательские ссылки/текст, lead spam и обход аналитических лимитов.

- Сервер проверяет Telegram HMAC через Node `crypto`, сравнивает 32-byte hashes constant-time и ограничивает возраст `auth_date`. `initDataUnsafe` не является доказательством личности.
- После Telegram HMAC сервер выдаёт подписанную HttpOnly cookie. Защищённые API проверяют подпись, срок действия, Secure/SameSite и UID владельца.
- `DATABASE_URL`, `SESSION_SECRET`, Blob token и bot token — только server env; они никогда не попадают в Vite bundle.
- Postgres repository всегда фильтрует owner UID, а public snapshot не содержит owner UID/Telegram ID. Blob upload token разрешает только `users/{uid}/{avatar|project}/` и изображения до 5 MB.
- Slug резервируется transaction; публикация и snapshot меняются атомарно.
- Zod ограничивает длины, URL protocol и структуры. React экранирует текст; `dangerouslySetInnerHTML` не используется. Telegram Bot HTML отдельно экранируется.
- Rate limit хранится в Postgres с HMAC-псевдонимизированным ключом, поэтому не зависит от памяти function instance. Honeypot и лимиты снижают lead spam.
- Origin middleware, JSON size/type limits и CSP уменьшают поверхность атак. Analytics содержит агрегированные события без raw IP.
- Demo bypass компилируется только для development и принудительно выключен при `import.meta.env.PROD`.

Ограничения MVP: нет CAPTCHA/moderation dashboard, удаления аккаунта, malware scanning изображений и полного audit log. Перед production рекомендуется настроить alerting, retention policy и отдельную миграционную процедуру схемы.

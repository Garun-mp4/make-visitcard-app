# Security

## Модель угроз

Основные риски: подмена Telegram-пользователя, кража service credentials, доступ к чужому draft, гонка slug reservation, XSS через пользовательские ссылки/текст, lead spam и обход аналитических лимитов.

- Сервер проверяет Telegram HMAC через Node `crypto`, сравнивает 32-byte hashes constant-time и ограничивает возраст `auth_date`. `initDataUnsafe` не является доказательством личности.
- Firebase custom token создаётся только Admin SDK. Защищённые API требуют проверенный Firebase ID token.
- Admin credentials и bot token — только server env. Private key newline нормализуется; секреты не логируются.
- Firestore/Storage Rules используют deny-by-default. Draft доступен только `request.auth.uid`; public snapshot записывает только Admin SDK и не содержит owner UID/Telegram ID.
- Slug резервируется transaction; публикация и snapshot меняются атомарно.
- Zod ограничивает длины, URL protocol и структуры. React экранирует текст; `dangerouslySetInnerHTML` не используется. Telegram Bot HTML отдельно экранируется.
- Rate limit хранится в Firestore с HMAC-псевдонимизированным ключом, поэтому не зависит от памяти function instance. Honeypot и лимиты снижают lead spam.
- Origin middleware, JSON size/type limits и CSP уменьшают поверхность атак. Analytics содержит агрегированные события без raw IP.
- Demo bypass компилируется только для development и принудительно выключен при `import.meta.env.PROD`.

Ограничения MVP: нет CAPTCHA/moderation dashboard, удаления аккаунта, malware scanning изображений и полного audit log. Перед production рекомендуется настроить alerting, App Check feasibility review и retention policy.

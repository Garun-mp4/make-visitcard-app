# Настройка Telegram

1. Создайте бота через `@BotFather` (`/newbot`) и сохраните token только в `TELEGRAM_BOT_TOKEN` Vercel.
2. Создайте Mini App, задайте short name и HTTPS Web App URL. Значения username/short name внесите в `VITE_TELEGRAM_BOT_USERNAME` и `VITE_TELEGRAM_APP_SHORT_NAME`.
3. Настройте Menu Button на тот же URL.
4. Публичный deep link имеет вид `https://t.me/<bot>/<short-name>?startapp=<slug>`.
5. Откройте приложение из Telegram, проверьте профиль, авторизацию и start parameter. `initDataUnsafe` используется только для preview UX; сервер доверяет исключительно подписанному `initData`.

Типовые ошибки: устаревший `auth_date`, несовпадающий bot token, домен не обновлён после deployment, неверный short name, пустой `initData` при открытии owner URL в браузере. Bot token нельзя коммитить, помещать в `VITE_*` или отправлять в клиент.

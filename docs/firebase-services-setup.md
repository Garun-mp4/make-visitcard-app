# Настройка Firebase

1. Создайте Firebase project и Web App в Firebase Console.
2. Скопируйте Web App config в переменные `VITE_FIREBASE_*` из `.env.example`.
3. В Authentication включите провайдера Anonymous только для локального тестирования Rules при необходимости. Production-пользователи входят custom token, который создаёт сервер.
4. Создайте Firestore Database и Storage bucket в подходящем регионе.
5. Добавьте production/preview домены Vercel в Authentication → Authorized domains.
6. В Project settings → Service accounts создайте ключ. Не сохраняйте JSON в проект: перенесите `project_id`, `client_email` и `private_key` в server-only Vercel env.
7. Private key храните с экранированными `\n`; сервер нормализует их при старте.

Локально установите JDK 21+, Firebase CLI уже находится в dev dependencies, затем запустите:

```bash
npm run emulators
npm run test:rules
```

Rules и indexes разворачиваются вручную после выбора проекта:

```bash
npx firebase use <project-id>
npx firebase deploy --only firestore:rules
npx firebase deploy --only firestore:indexes
npx firebase deploy --only storage
```

Cardly не использует Firebase Hosting, Cloud Functions или Functions Emulator. Перед production проверьте актуальные тарифы и billing requirements Firebase.

# Deployment на Vercel

Deployment в этой рабочей сессии не выполнялся.

1. Создайте GitHub repository, добавьте remote, commit и push своей feature/main ветки.
2. В Vercel выберите Import Git Repository и Vite preset.
3. Settings: Install Command `npm ci`, Build Command `npm run vercel:build`, Output Directory `dist`, Node.js `22.x`.
4. Добавьте все переменные из `.env.example`; `VITE_*` — frontend, остальные — server-only. Задайте их отдельно для Development, Preview и Production. В production `APP_ENV=production`, `VITE_DEMO_MODE=false`.
5. Выполните первый deployment через UI. Проверьте `/api/health`, `/c/<slug>`, `/app/card`, refresh вложенного маршрута и Function Logs.
6. После изменения env сделайте Redeploy. Push/PR создаёт preview deployment, push в production branch — production deployment согласно настройкам проекта.
7. Rollback выполняется из Deployments. Custom domain добавляется в Domains и затем в Firebase Authorized domains/`ALLOWED_ORIGINS`.
8. После получения стабильного HTTPS URL обновите Menu Button/Mini App URL в BotFather.

`vercel.json` исключает `/api/*` из SPA fallback и задаёт security headers. Для локальной полной проверки используйте `npm run dev:vercel` после `vercel link`; базовый `npm run check` связи с Vercel не требует.

Перед запуском проверьте текущие тарифы и billing requirements Vercel и Firebase; бесплатность не гарантируется.

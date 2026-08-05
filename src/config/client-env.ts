import { z } from 'zod'

const optionalString = z.string().trim().optional().default('')

const clientEnvSchema = z.object({
  VITE_APP_BASE_URL: optionalString,
  VITE_TELEGRAM_BOT_USERNAME: optionalString,
  VITE_TELEGRAM_APP_SHORT_NAME: optionalString,
  VITE_DEMO_MODE: z.enum(['true', 'false']).optional().default('false'),
  VITE_DEFAULT_LOCALE: z.enum(['ru', 'en']).optional().default('ru'),
})

const parsed = clientEnvSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const names = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(`Invalid client environment variables: ${names}`)
}

const raw = parsed.data

export const clientEnv = {
  appBaseUrl: raw.VITE_APP_BASE_URL,
  telegramBotUsername: raw.VITE_TELEGRAM_BOT_USERNAME,
  telegramAppShortName: raw.VITE_TELEGRAM_APP_SHORT_NAME,
  demoMode: import.meta.env.PROD ? false : raw.VITE_DEMO_MODE === 'true',
  defaultLocale: raw.VITE_DEFAULT_LOCALE,
} as const

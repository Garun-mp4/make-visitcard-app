import { z } from 'zod'

const optionalString = z.string().trim().optional().default('')

const clientEnvSchema = z.object({
  VITE_FIREBASE_API_KEY: optionalString,
  VITE_FIREBASE_AUTH_DOMAIN: optionalString,
  VITE_FIREBASE_PROJECT_ID: optionalString,
  VITE_FIREBASE_STORAGE_BUCKET: optionalString,
  VITE_FIREBASE_MESSAGING_SENDER_ID: optionalString,
  VITE_FIREBASE_APP_ID: optionalString,
  VITE_APP_BASE_URL: optionalString,
  VITE_TELEGRAM_BOT_USERNAME: optionalString,
  VITE_TELEGRAM_APP_SHORT_NAME: optionalString,
  VITE_DEMO_MODE: z.enum(['true', 'false']).optional().default('false'),
  VITE_USE_FIREBASE_EMULATORS: z.enum(['true', 'false']).optional().default('false'),
  VITE_DEFAULT_LOCALE: z.enum(['ru', 'en']).optional().default('ru'),
})

const parsed = clientEnvSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const names = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(`Invalid client environment variables: ${names}`)
}

const raw = parsed.data

export const clientEnv = {
  firebase: {
    apiKey: raw.VITE_FIREBASE_API_KEY,
    authDomain: raw.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: raw.VITE_FIREBASE_PROJECT_ID,
    storageBucket: raw.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: raw.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: raw.VITE_FIREBASE_APP_ID,
  },
  appBaseUrl: raw.VITE_APP_BASE_URL,
  telegramBotUsername: raw.VITE_TELEGRAM_BOT_USERNAME,
  telegramAppShortName: raw.VITE_TELEGRAM_APP_SHORT_NAME,
  demoMode: import.meta.env.PROD ? false : raw.VITE_DEMO_MODE === 'true',
  useFirebaseEmulators: !import.meta.env.PROD && raw.VITE_USE_FIREBASE_EMULATORS === 'true',
  defaultLocale: raw.VITE_DEFAULT_LOCALE,
} as const

export function assertFirebaseClientConfig(): void {
  const missing = Object.entries(clientEnv.firebase)
    .filter(([, value]) => !value)
    .map(([key]) => key)
  if (missing.length > 0) {
    throw new Error(`Missing Firebase client config: ${missing.join(', ')}`)
  }
}

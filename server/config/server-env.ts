import { z } from 'zod'

const serverEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'preview', 'production']).default('development'),
  TELEGRAM_BOT_TOKEN: z.string().min(20).optional(),
  TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: z.coerce.number().int().positive().max(86400).default(3600),
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1).optional(),
  FIREBASE_ADMIN_STORAGE_BUCKET: z.string().min(1).optional(),
  ALLOWED_ORIGINS: z.string().default('http://127.0.0.1:5173,http://localhost:5173'),
  RATE_LIMIT_HASH_SECRET: z.string().min(24).optional(),
  USE_FIREBASE_EMULATORS: z.enum(['true', 'false']).default('false'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | null = null

export function normalizePrivateKey(value: string): string {
  return value.replaceAll('\\n', '\n')
}

export function getServerEnv(): ServerEnv {
  if (cached) return cached
  const result = serverEnvSchema.safeParse(process.env)
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error(`Invalid server environment variables: ${names}`)
  }
  cached = result.data
  return cached
}

export function requireServerEnv<K extends keyof ServerEnv>(
  ...keys: K[]
): ServerEnv & Required<Pick<ServerEnv, K>> {
  const env = getServerEnv()
  const missing = keys.filter((key) => !env[key])
  if (missing.length) throw new Error(`Missing server environment variables: ${missing.join(', ')}`)
  return env as ServerEnv & Required<Pick<ServerEnv, K>>
}

export function resetServerEnvForTests(): void {
  cached = null
}

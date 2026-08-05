import { z } from 'zod'

const serverEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'preview', 'production']).default('development'),
  TELEGRAM_BOT_TOKEN: z.string().min(20).optional(),
  TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: z.coerce.number().int().positive().max(86400).default(3600),
  DATABASE_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().min(20).optional(),
  ALLOWED_ORIGINS: z.string().default('http://127.0.0.1:5173,http://localhost:5173'),
  RATE_LIMIT_HASH_SECRET: z.string().min(24).optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | null = null

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

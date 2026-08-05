import { createHmac } from 'node:crypto'
import type { Request } from 'express'

import { requireServerEnv } from '../config/server-env.js'
import { database } from '../db/client.js'
import { AppError } from '../utils/app-error.js'

export function rateLimitHash(
  secret: string,
  action: string,
  identity: string,
  bucket: number,
): string {
  return createHmac('sha256', secret).update(`${action}\n${identity}\n${bucket}`).digest('hex')
}

function requestIdentity(req: Request): string {
  const forwarded = req.header('x-forwarded-for')?.split(',')[0]?.trim()
  const host = req.header('host') ?? 'unknown-host'
  const agent = req.header('user-agent')?.slice(0, 180) ?? 'unknown-agent'
  return `${forwarded || req.ip || 'unknown-ip'}|${host}|${agent}`
}

export async function enforceRateLimit(
  req: Request,
  action: string,
  limit: number,
  windowSeconds: number,
) {
  const { RATE_LIMIT_HASH_SECRET } = requireServerEnv('RATE_LIMIT_HASH_SECRET')
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds)
  const key = rateLimitHash(RATE_LIMIT_HASH_SECRET, action, requestIdentity(req), bucket)
  const expiresAt = new Date((bucket + 2) * windowSeconds * 1000).toISOString()
  const sql = await database()
  const rows = (await sql`
    INSERT INTO cardly_rate_limits (key, action, count, expires_at, updated_at)
    VALUES (${key}, ${action}, 1, ${expiresAt}, NOW())
    ON CONFLICT (key) DO UPDATE SET
      count = cardly_rate_limits.count + 1,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
    RETURNING count
  `) as unknown as Array<{ count: number }>
  if (Number(rows[0]?.count ?? 0) > limit)
    throw new AppError(429, 'rate_limited', 'Слишком много запросов. Попробуйте позже.')
}

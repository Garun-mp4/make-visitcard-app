import { createHmac } from 'node:crypto'
import type { Request } from 'express'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

import { getAdminServices } from '../firebase/admin.js'
import { requireServerEnv } from '../config/server-env.js'
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
  const ref = getAdminServices().db.collection('rateLimits').doc(key)
  const expiresAt = Timestamp.fromMillis((bucket + 2) * windowSeconds * 1000)
  const count = await getAdminServices().db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref)
    const nextCount = ((snapshot.data()?.count as number | undefined) ?? 0) + 1
    transaction.set(
      ref,
      { action, count: nextCount, expiresAt, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    )
    return nextCount
  })
  if (count > limit)
    throw new AppError(429, 'rate_limited', 'Слишком много запросов. Попробуйте позже.')
}

import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Request } from 'express'

import { requireServerEnv } from '../config/server-env.js'
import { AppError } from '../utils/app-error.js'

const cookieName = 'cardly_session'
const sessionLifetimeSeconds = 7 * 24 * 60 * 60

interface SessionPayload {
  uid: string
  iat: number
  exp: number
}

function sign(value: string): string {
  const { SESSION_SECRET } = requireServerEnv('SESSION_SECRET')
  return createHmac('sha256', SESSION_SECRET).update(value).digest('base64url')
}

export function createSessionToken(uid: string, now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000)
  const body = Buffer.from(
    JSON.stringify({ uid, iat: issuedAt, exp: issuedAt + sessionLifetimeSeconds }),
  ).toString('base64url')
  return `${body}.${sign(body)}`
}

export function verifySessionToken(token: string, now = Date.now()): SessionPayload {
  const [body, signature, extra] = token.split('.')
  if (!body || !signature || extra)
    throw new AppError(401, 'invalid_session', 'Сессия недействительна')
  const expected = sign(body)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  )
    throw new AppError(401, 'invalid_session', 'Сессия недействительна')
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
    if (!payload.uid || !Number.isInteger(payload.exp) || payload.exp <= Math.floor(now / 1000))
      throw new Error('expired')
    return payload
  } catch {
    throw new AppError(401, 'invalid_session', 'Сессия недействительна')
  }
}

function readCookie(req: Request): string | null {
  const cookieHeader = req.header('cookie') ?? ''
  for (const part of cookieHeader.split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name === cookieName) return decodeURIComponent(value.join('='))
  }
  return null
}

function readBearerToken(req: Request): string | null {
  const authorization = req.header('authorization') ?? ''
  const [scheme, token, extra] = authorization.trim().split(/\s+/)
  if (scheme?.toLowerCase() !== 'bearer' || !token || extra) return null
  return token
}

export function requireSession(req: Request): SessionPayload {
  const token = readBearerToken(req) ?? readCookie(req)
  if (!token) throw new AppError(401, 'unauthorized', 'Требуется авторизация')
  return verifySessionToken(token)
}

export function sessionCookie(token: string, secure: boolean): string {
  return [
    `${cookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    secure ? 'SameSite=None' : 'SameSite=Lax',
    `Max-Age=${sessionLifetimeSeconds}`,
    ...(secure ? ['Secure'] : []),
  ].join('; ')
}

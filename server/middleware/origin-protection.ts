import type { NextFunction, Request, Response } from 'express'

import { getServerEnv } from '../config/server-env.js'
import { AppError } from '../utils/app-error.js'

function normalizeOrigin(value: string) {
  try {
    const url = new URL(value)
    return `${url.protocol}//${url.host}`
  } catch {
    return ''
  }
}

export function originProtection(req: Request, res: Response, next: NextFunction) {
  const origin = req.header('origin')
  if (!origin) return next()
  const normalized = normalizeOrigin(origin)
  const allowed = getServerEnv()
    .ALLOWED_ORIGINS.split(',')
    .map((item) => normalizeOrigin(item.trim()))
    .filter(Boolean)
  if (!allowed.includes(normalized))
    return next(new AppError(403, 'origin_not_allowed', 'Источник запроса не разрешён'))
  res.setHeader('Access-Control-Allow-Origin', normalized)
  res.setHeader('Vary', 'Origin')
  next()
}

import type { NextFunction, Request, Response } from 'express'

import { getAdminServices } from '../firebase/admin.js'
import { AppError } from '../utils/app-error.js'

declare global {
  namespace Express {
    interface Request {
      auth?: { uid: string }
    }
  }
}

export async function requireFirebaseAuth(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.header('authorization') ?? ''
  const match = /^Bearer ([^\s]+)$/.exec(authorization)
  if (!match?.[1]) return next(new AppError(401, 'unauthorized', 'Требуется авторизация'))
  try {
    const decoded = await getAdminServices().auth.verifyIdToken(match[1], true)
    req.auth = { uid: decoded.uid }
    next()
  } catch {
    next(new AppError(401, 'invalid_id_token', 'Сессия недействительна'))
  }
}

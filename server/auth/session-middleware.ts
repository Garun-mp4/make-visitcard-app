import type { NextFunction, Request, Response } from 'express'

import { requireSession } from './session.js'

declare global {
  namespace Express {
    interface Request {
      auth?: { uid: string }
    }
  }
}

export function requireSessionAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    req.auth = { uid: requireSession(req).uid }
    next()
  } catch (error) {
    next(error)
  }
}

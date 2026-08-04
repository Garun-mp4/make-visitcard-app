import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

declare global {
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  req.requestId = req.header('x-request-id')?.slice(0, 80) || randomUUID()
  res.setHeader('x-request-id', req.requestId)
  next()
}

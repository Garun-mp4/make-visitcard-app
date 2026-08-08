import express, { type ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

import { originProtection } from '../middleware/origin-protection.js'
import { requestContext } from '../middleware/request-context.js'
import { AppError } from '../utils/app-error.js'
import { logger } from '../utils/logger.js'
import { registerRoutes } from './routes.js'

const knownPaths = [
  '/api/auth/telegram',
  '/api/cards/me',
  '/api/cards/publish',
  '/api/cards/unpublish',
  '/api/owner/dashboard',
  '/api/owner/preferences',
  '/api/owner/stats',
  '/api/slugs/check',
  '/api/images/upload',
  '/api/images/delete',
  '/api/leads/:id',
  '/api/public/cards/:slug',
  '/api/public/cards/:slug/leads',
  '/api/public/cards/:slug/events',
  '/api/health',
]

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(requestContext)
  app.use(originProtection)
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Request-Id')
      res.status(204).end()
      return
    }
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
      next(new AppError(415, 'unsupported_media_type', 'Требуется Content-Type application/json'))
      return
    }
    next()
  })
  app.use(express.json({ limit: '32kb', strict: true }))
  registerRoutes(app)
  app.all(knownPaths, (_req, _res, next) =>
    next(new AppError(405, 'method_not_allowed', 'Метод не поддерживается')),
  )
  app.use('/api', (_req, _res, next) =>
    next(new AppError(404, 'api_not_found', 'API маршрут не найден')),
  )
  const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
    const appError =
      error instanceof AppError
        ? error
        : error instanceof ZodError
          ? new AppError(
              400,
              'validation_error',
              'Проверьте данные запроса',
              error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
            )
          : new AppError(500, 'internal_error', 'Внутренняя ошибка сервера')
    if (appError.status >= 500)
      logger.error('Unhandled API error', {
        requestId: req.requestId,
        route: req.path,
        status: appError.status,
        code: appError.code,
      })
    res.status(appError.status).json({
      code: appError.code,
      message: appError.message,
      requestId: req.requestId,
      ...(appError.details ? { details: appError.details } : {}),
    })
  }
  app.use(errorHandler)
  return app
}

export const app = createApp()

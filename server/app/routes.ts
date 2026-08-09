import { del } from '@vercel/blob'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import type { NextFunction, Request, Response, Router } from 'express'
import { z } from 'zod'

import {
  analyticsEventSchema,
  cardDraftSchema,
  leadSchema,
  ownerPreferencesPatchSchema,
  slugSchema,
} from '../../shared/schemas.js'
import { requireSession } from '../auth/session.js'
import { requireSessionAuth } from '../auth/session-middleware.js'
import { createSessionToken, sessionCookie } from '../auth/session.js'
import { validateTelegramInitData } from '../auth/telegram-init-data.js'
import { requireServerEnv } from '../config/server-env.js'
import {
  createLead,
  getCard,
  getOrCreateCard,
  getOwnerDashboard,
  getOwnerPreferences,
  getOwnerStats,
  getPublicCard,
  isSlugAvailable,
  publishCard,
  recordAnalyticsEvent,
  saveCard,
  unpublishCard,
  updateLeadStatus,
  updateOwnerPreferences,
  upsertTelegramUser,
} from '../db/repository.js'
import { enforceRateLimit } from '../rate-limit/database-rate-limit.js'
import { notifyLeadOwner } from '../telegram/bot.js'
import { AppError } from '../utils/app-error.js'
import { logger } from '../utils/logger.js'
import { loadPublicCardTemplate } from '../social/card-page-template.js'
import { renderOpenGraphImage } from '../social/open-graph-image.js'
import { renderQrPng } from '../social/qr-image.js'
import { buildSharePreviewMetadata, renderPublicCardHtml } from '../social/share-preview.js'

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>
const route = (handler: AsyncHandler) => (req: Request, res: Response, next: NextFunction) =>
  void handler(req, res, next).catch(next)

const initDataBody = z.object({ initData: z.string().min(1).max(16_384) })
const slugBody = z.object({ slug: slugSchema })
const leadStatusBody = z.object({ status: z.enum(['new', 'read', 'archived']) })
const imageDeleteBody = z.object({ url: z.string().url().max(2048) })

function appOrigin(req: Request): string {
  return new URL(`${req.protocol}://${req.get('host')}`).origin
}

export function registerRoutes(router: Router) {
  router.get('/api/health', (_req, res) =>
    res.json({
      ok: true,
      service: 'cardly-api',
      storage: 'vercel',
      timestamp: new Date().toISOString(),
    }),
  )

  router.post(
    '/api/auth/telegram',
    route(async (req, res) => {
      await enforceRateLimit(req, 'telegram-auth', 12, 60)
      const body = initDataBody.parse(req.body)
      const env = requireServerEnv('TELEGRAM_BOT_TOKEN', 'SESSION_SECRET')
      const result = validateTelegramInitData(
        body.initData,
        env.TELEGRAM_BOT_TOKEN,
        env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS,
      )
      const user = await upsertTelegramUser(result.user)
      const card = await getOrCreateCard(user)
      const dashboard = await getOwnerDashboard(user.uid)
      const preferences = await getOwnerPreferences(user.uid)
      const token = createSessionToken(user.uid)
      res.setHeader('Set-Cookie', sessionCookie(token, env.APP_ENV === 'production'))
      res.json({ user, sessionToken: token, card, dashboard, preferences })
    }),
  )

  router.get(
    '/api/cards/me',
    requireSessionAuth,
    route(async (req, res) => {
      res.json({ card: await getCard(req.auth!.uid) })
    }),
  )

  router.patch(
    '/api/owner/preferences',
    requireSessionAuth,
    route(async (req, res) => {
      const patch = ownerPreferencesPatchSchema.parse(req.body)
      res.json({ preferences: await updateOwnerPreferences(req.auth!.uid, patch) })
    }),
  )

  router.get(
    '/api/owner/stats',
    requireSessionAuth,
    route(async (req, res) => {
      const period = z.enum(['7', '30', 'all']).parse(req.query.period ?? '7')
      res.json({ stats: await getOwnerStats(req.auth!.uid, period) })
    }),
  )

  router.put(
    '/api/cards/me',
    requireSessionAuth,
    route(async (req, res) => {
      const input = cardDraftSchema.parse(req.body)
      res.json(await saveCard(req.auth!.uid, input))
    }),
  )

  router.get(
    '/api/owner/dashboard',
    requireSessionAuth,
    route(async (req, res) => {
      res.json(await getOwnerDashboard(req.auth!.uid))
    }),
  )

  router.patch(
    '/api/leads/:id',
    requireSessionAuth,
    route(async (req, res) => {
      const id = z.string().uuid().parse(req.params.id)
      const { status } = leadStatusBody.parse(req.body)
      await updateLeadStatus(req.auth!.uid, id, status)
      res.json({ ok: true })
    }),
  )

  router.post(
    '/api/slugs/check',
    route(async (req, res) => {
      await enforceRateLimit(req, 'slug-check', 30, 60)
      const { slug } = slugBody.parse(req.body)
      let uid: string | undefined
      try {
        uid = requireSession(req).uid
      } catch {
        uid = undefined
      }
      res.json({ slug, available: await isSlugAvailable(slug, uid) })
    }),
  )

  router.post(
    '/api/cards/publish',
    requireSessionAuth,
    route(async (req, res) => {
      const { slug } = slugBody.parse(req.body)
      const card = await publishCard(req.auth!.uid, slug)
      const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME ?? 'cardly_bot'
      const shortName = process.env.VITE_TELEGRAM_APP_SHORT_NAME ?? 'app'
      res.json({
        published: true,
        card,
        publicSync: { state: 'synced', syncedAt: card.lastPublishedAt, invalidPaths: [] },
        slug,
        publicUrl: `${appOrigin(req)}/c/${slug}`,
        telegramUrl: `https://t.me/${botUsername}/${shortName}?startapp=${slug}`,
      })
    }),
  )

  router.post(
    '/api/cards/unpublish',
    requireSessionAuth,
    route(async (req, res) => {
      const result = await unpublishCard(req.auth!.uid)
      res.json({
        published: false,
        slugReserved: Boolean(result.slug),
        card: result.card,
        publicSync: { state: 'not_published', syncedAt: null, invalidPaths: [] },
      })
    }),
  )

  router.get(
    ['/api/public/page/:slug', '/c/:slug'],
    route(async (req, res) => {
      const slug = slugSchema.parse(req.params.slug)
      const card = await getPublicCard(slug)
      if (!card) throw new AppError(404, 'card_not_found', 'Визитка не найдена')
      const metadata = buildSharePreviewMetadata(card, appOrigin(req))
      const html = renderPublicCardHtml(await loadPublicCardTemplate(), metadata)
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
      res.setHeader('CDN-Cache-Control', 'max-age=0, stale-while-revalidate=30')
      res.setHeader('Vary', 'Accept-Encoding')
      res.status(200).send(html)
    }),
  )

  router.get(
    '/api/public/cards/:slug/og.png',
    route(async (req, res) => {
      const slug = slugSchema.parse(req.params.slug)
      const card = await getPublicCard(slug)
      if (!card) throw new AppError(404, 'card_not_found', 'Визитка не найдена')
      const image = await renderOpenGraphImage(card)
      image.headers.forEach((value, key) => res.setHeader(key, value))
      res.status(image.status).send(Buffer.from(await image.arrayBuffer()))
    }),
  )

  router.get(
    '/api/public/cards/:slug/qr.png',
    route(async (req, res) => {
      const slug = slugSchema.parse(req.params.slug)
      const card = await getPublicCard(slug)
      if (!card) throw new AppError(404, 'card_not_found', 'Визитка не найдена')
      const fileName = `cardly-${slug}-qr.png`
      const image = await renderQrPng(`${appOrigin(req)}/c/${slug}`)
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      res.setHeader('Access-Control-Allow-Origin', 'https://web.telegram.org')
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
      res.status(200).send(image)
    }),
  )

  router.get(
    '/api/public/cards/:slug',
    route(async (req, res) => {
      const slug = slugSchema.parse(req.params.slug)
      const card = await getPublicCard(slug)
      if (!card) throw new AppError(404, 'card_not_found', 'Визитка не найдена')
      res.json({ card })
    }),
  )

  router.post(
    '/api/public/cards/:slug/leads',
    route(async (req, res) => {
      await enforceRateLimit(req, 'lead-submit', 6, 600)
      const slug = slugSchema.parse(req.params.slug)
      const input = leadSchema.parse(req.body)
      if (input.website) throw new AppError(400, 'spam_detected', 'Не удалось отправить заявку')
      const lead = await createLead(slug, input)
      try {
        if (!lead.notifyOwner) {
          res.status(201).json({ ok: true, leadId: lead.id })
          return
        }
        await notifyLeadOwner({
          telegramId: lead.telegramId,
          slug,
          name: input.senderName,
          contact: input.senderContact,
          message: input.message,
          createdAt: new Date().toISOString(),
        })
      } catch {
        logger.warn('Telegram lead notification failed', {
          requestId: req.requestId,
          route: req.path,
        })
      }
      res.status(201).json({ ok: true, leadId: lead.id })
    }),
  )

  router.post(
    '/api/public/cards/:slug/events',
    route(async (req, res) => {
      await enforceRateLimit(req, 'analytics-event', 90, 60)
      const slug = slugSchema.parse(req.params.slug)
      await recordAnalyticsEvent(slug, analyticsEventSchema.parse(req.body))
      res.status(202).json({ ok: true })
    }),
  )

  router.post(
    '/api/images/upload',
    route(async (req, res) => {
      const body = req.body as HandleUploadBody
      const session = body.type === 'blob.generate-client-token' ? requireSession(req) : null
      const response = await handleUpload({
        request: req,
        body,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          if (!session) throw new AppError(401, 'unauthorized', 'Требуется авторизация')
          const payload = z
            .object({ kind: z.enum(['avatar', 'project']) })
            .parse(JSON.parse(clientPayload ?? '{}') as unknown)
          const prefix = `users/${session.uid}/${payload.kind}/`
          if (!pathname.startsWith(prefix))
            throw new AppError(403, 'invalid_blob_path', 'Недопустимый путь файла')
          return {
            allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
            maximumSizeInBytes: 5 * 1024 * 1024,
            addRandomSuffix: true,
            cacheControlMaxAge: 31_536_000,
            tokenPayload: JSON.stringify({ uid: session.uid, kind: payload.kind }),
          }
        },
        onUploadCompleted: async () => undefined,
      })
      res.json(response)
    }),
  )

  router.post(
    '/api/images/delete',
    requireSessionAuth,
    route(async (req, res) => {
      requireServerEnv('BLOB_READ_WRITE_TOKEN')
      const { url } = imageDeleteBody.parse(req.body)
      const parsed = new URL(url)
      if (
        !parsed.hostname.endsWith('.blob.vercel-storage.com') ||
        !parsed.pathname.startsWith(`/users/${req.auth!.uid}/`)
      )
        throw new AppError(403, 'invalid_blob_url', 'Этот файл нельзя удалить')
      await del(url)
      res.json({ ok: true })
    }),
  )
}

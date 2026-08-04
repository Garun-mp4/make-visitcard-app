import type { NextFunction, Request, Response, Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'

import { analyticsEventSchema, cardDraftSchema, leadSchema, slugSchema } from '@shared/schemas'
import { validateTelegramInitData } from '../auth/telegram-init-data.js'
import { requireFirebaseAuth } from '../auth/firebase-auth.js'
import { sanitizePublicSnapshot } from '../cards/public-snapshot.js'
import { getServerEnv, requireServerEnv } from '../config/server-env.js'
import { getAdminServices } from '../firebase/admin.js'
import { enforceRateLimit } from '../rate-limit/firestore-rate-limit.js'
import { notifyLeadOwner } from '../telegram/bot.js'
import { AppError } from '../utils/app-error.js'
import { logger } from '../utils/logger.js'

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>
const route = (handler: AsyncHandler) => (req: Request, res: Response, next: NextFunction) =>
  void handler(req, res, next).catch(next)

const initDataBody = z.object({ initData: z.string().min(1).max(16_384) })
const slugBody = z.object({ slug: slugSchema })

export function registerRoutes(router: Router) {
  router.get('/api/health', (_req, res) =>
    res.json({ ok: true, service: 'cardly-api', timestamp: new Date().toISOString() }),
  )

  router.post(
    '/api/auth/telegram',
    route(async (req, res) => {
      await enforceRateLimit(req, 'telegram-auth', 12, 60)
      const body = initDataBody.parse(req.body)
      const env = requireServerEnv('TELEGRAM_BOT_TOKEN')
      const result = validateTelegramInitData(
        body.initData,
        env.TELEGRAM_BOT_TOKEN,
        env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS,
      )
      const uid = `tg_${result.user.id}`
      const userRef = getAdminServices().db.collection('users').doc(uid)
      await userRef.set(
        {
          uid,
          telegramId: String(result.user.id),
          firstName: result.user.first_name,
          lastName: result.user.last_name ?? '',
          username: result.user.username ?? '',
          photoUrl: result.user.photo_url ?? '',
          languageCode: result.user.language_code ?? 'ru',
          isPremium: result.user.is_premium ?? false,
          updatedAt: FieldValue.serverTimestamp(),
          lastLoginAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      const customToken = await getAdminServices().auth.createCustomToken(uid)
      res.json({
        customToken,
        user: {
          uid,
          firstName: result.user.first_name,
          lastName: result.user.last_name ?? '',
          username: result.user.username ?? '',
          photoUrl: result.user.photo_url ?? '',
          languageCode: result.user.language_code ?? 'ru',
          isPremium: result.user.is_premium ?? false,
        },
      })
    }),
  )

  router.post(
    '/api/slugs/check',
    route(async (req, res) => {
      await enforceRateLimit(req, 'slug-check', 30, 60)
      const { slug } = slugBody.parse(req.body)
      const snapshot = await getAdminServices().db.collection('slugs').doc(slug).get()
      res.json({ slug, available: !snapshot.exists })
    }),
  )

  router.post(
    '/api/cards/publish',
    requireFirebaseAuth,
    route(async (req, res) => {
      const uid = req.auth!.uid
      const { slug } = slugBody.parse(req.body)
      const db = getAdminServices().db
      const cardRef = db.collection('cards').doc(uid)
      const cardSnapshot = await cardRef.get()
      if (!cardSnapshot.exists)
        throw new AppError(404, 'draft_not_found', 'Черновик визитки не найден')
      const card = cardDraftSchema.parse({ ...cardSnapshot.data(), ownerUid: uid })
      const now = new Date().toISOString()
      const nextCard = {
        ...card,
        publication: {
          ...card.publication,
          slug,
          published: true,
          publishedAt: card.publication.publishedAt ?? now,
          updatedAt: now,
        },
        lastPublishedAt: now,
      }
      const publicSnapshot = sanitizePublicSnapshot(nextCard)
      await db.runTransaction(async (transaction) => {
        const slugRef = db.collection('slugs').doc(slug)
        const slugRecord = await transaction.get(slugRef)
        const existingOwner = slugRecord.data()?.ownerUid as string | undefined
        if (slugRecord.exists && existingOwner !== uid)
          throw new AppError(409, 'slug_unavailable', 'Этот адрес уже занят')
        if (card.publication.slug && card.publication.slug !== slug) {
          const oldSlugRef = db.collection('slugs').doc(card.publication.slug)
          const oldSlug = await transaction.get(oldSlugRef)
          if (oldSlug.data()?.ownerUid === uid) transaction.delete(oldSlugRef)
          transaction.delete(db.collection('publicCards').doc(card.publication.slug))
        }
        transaction.set(
          slugRef,
          {
            ownerUid: uid,
            createdAt: slugRecord.data()?.createdAt ?? FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
        transaction.set(db.collection('publicCards').doc(slug), publicSnapshot)
        transaction.set(cardRef, nextCard, { merge: true })
      })
      const baseUrl =
        getServerEnv().APP_ENV === 'production'
          ? new URL(req.protocol + '://' + req.get('host')).origin
          : new URL(req.protocol + '://' + req.get('host')).origin
      const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME ?? 'cardly_bot'
      const shortName = process.env.VITE_TELEGRAM_APP_SHORT_NAME ?? 'app'
      res.json({
        published: true,
        slug,
        publicUrl: `${baseUrl}/c/${slug}`,
        telegramUrl: `https://t.me/${botUsername}/${shortName}?startapp=${slug}`,
      })
    }),
  )

  router.post(
    '/api/cards/unpublish',
    requireFirebaseAuth,
    route(async (req, res) => {
      const uid = req.auth!.uid
      const db = getAdminServices().db
      const cardRef = db.collection('cards').doc(uid)
      const cardSnapshot = await cardRef.get()
      if (!cardSnapshot.exists)
        throw new AppError(404, 'draft_not_found', 'Черновик визитки не найден')
      const slug = String(cardSnapshot.data()?.publication?.slug ?? '')
      await db.runTransaction(async (transaction) => {
        if (slug) transaction.delete(db.collection('publicCards').doc(slug))
        transaction.set(
          cardRef,
          {
            'publication.published': false,
            'publication.updatedAt': new Date().toISOString(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
      })
      res.json({ published: false, slugReserved: Boolean(slug) })
    }),
  )

  router.post(
    '/api/public/cards/:slug/leads',
    route(async (req, res) => {
      await enforceRateLimit(req, 'lead-submit', 6, 600)
      const slug = slugSchema.parse(req.params.slug)
      const input = leadSchema.parse(req.body)
      if (input.website) throw new AppError(400, 'spam_detected', 'Не удалось отправить заявку')
      const db = getAdminServices().db
      const [publicCard, slugRecord] = await Promise.all([
        db.collection('publicCards').doc(slug).get(),
        db.collection('slugs').doc(slug).get(),
      ])
      if (!publicCard.exists || publicCard.data()?.publication?.published === false)
        throw new AppError(404, 'card_not_found', 'Визитка не найдена')
      const ownerUid = slugRecord.data()?.ownerUid as string | undefined
      if (!ownerUid) throw new AppError(404, 'card_not_found', 'Визитка не найдена')
      const leadRef = db.collection('leads').doc()
      await db.runTransaction(async (transaction) => {
        transaction.set(leadRef, {
          ownerUid,
          cardSlug: slug,
          senderName: input.senderName,
          senderContact: input.senderContact,
          message: input.message,
          source: input.source,
          status: 'new',
          createdAt: FieldValue.serverTimestamp(),
        })
        transaction.set(
          db.collection('cardStats').doc(ownerUid),
          { totalLeads: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        )
      })
      const user = await db.collection('users').doc(ownerUid).get()
      const telegramId = user.data()?.telegramId as string | undefined
      if (telegramId) {
        try {
          await notifyLeadOwner({
            telegramId,
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
      }
      res.status(201).json({ ok: true, leadId: leadRef.id })
    }),
  )

  router.post(
    '/api/public/cards/:slug/events',
    route(async (req, res) => {
      await enforceRateLimit(req, 'analytics-event', 90, 60)
      const slug = slugSchema.parse(req.params.slug)
      const event = analyticsEventSchema.parse(req.body)
      const db = getAdminServices().db
      const slugRecord = await db.collection('slugs').doc(slug).get()
      const ownerUid = slugRecord.data()?.ownerUid as string | undefined
      if (!ownerUid) throw new AppError(404, 'card_not_found', 'Визитка не найдена')
      const fields: Record<typeof event.type, string> = {
        card_view: 'totalViews',
        primary_cta_click: 'totalPrimaryClicks',
        link_click: 'totalLinkClicks',
        project_open: 'totalProjectOpens',
        lead_submit: 'totalLeads',
        share: 'totalShares',
      }
      const day = new Date().toISOString().slice(0, 10)
      const batch = db.batch()
      batch.set(
        db.collection('cardStats').doc(ownerUid),
        { [fields[event.type]]: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
      batch.set(
        db.collection('cardStats').doc(ownerUid).collection('daily').doc(day),
        {
          date: day,
          [fields[event.type]]: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      await batch.commit()
      res.status(202).json({ ok: true })
    }),
  )
}

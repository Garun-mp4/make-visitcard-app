import { randomUUID } from 'node:crypto'

import { cardDraftSchema, publicCardSchema, publishableCardSchema } from '../../shared/schemas.js'
import { createInitialCard } from '../../shared/initial-card.js'
import type {
  AnalyticsEvent,
  CardDraft,
  CardSaveResult,
  CardStats,
  CardView,
  LeadInput,
  LeadRecord,
  OwnerProfile,
  OwnerPreferences,
  PeriodStats,
  StatsPeriod,
  TelegramUser,
} from '../../shared/types.js'
import { sanitizePublicSnapshot } from '../cards/public-snapshot.js'
import { prepareCardSave } from '../cards/card-save.js'
import { AppError } from '../utils/app-error.js'
import { database } from './client.js'

interface JsonRow {
  data: unknown
}

interface CardRecordRow extends JsonRow {
  slug: string | null
  published: boolean
  public_data: unknown
}

interface UserRow {
  uid: string
  telegram_id: string
  first_name: string
  last_name: string
  username: string
  photo_url: string
  language_code: string
  is_premium: boolean
  preferred_locale?: string | null
  lead_notifications_enabled?: boolean
}

export async function getOwnerPreferences(uid: string): Promise<OwnerPreferences> {
  const sql = await database()
  const rows = rowsOf<UserRow>(
    await sql`
    SELECT language_code, preferred_locale, lead_notifications_enabled
    FROM cardly_users WHERE uid = ${uid} LIMIT 1
  `,
  )
  const row = rows[0]
  if (!row) throw new AppError(404, 'owner_not_found', 'Профиль владельца не найден')
  return {
    locale:
      row.preferred_locale === 'en' || row.preferred_locale === 'ru'
        ? row.preferred_locale
        : row.language_code.toLowerCase().startsWith('en')
          ? 'en'
          : 'ru',
    leadNotificationsEnabled: row.lead_notifications_enabled ?? true,
  }
}

export async function updateOwnerPreferences(
  uid: string,
  patch: Partial<OwnerPreferences>,
): Promise<OwnerPreferences> {
  const current = await getOwnerPreferences(uid)
  const next = { ...current, ...patch }
  const sql = await database()
  await sql`
    UPDATE cardly_users SET
      preferred_locale = ${next.locale},
      lead_notifications_enabled = ${next.leadNotificationsEnabled},
      updated_at = NOW()
    WHERE uid = ${uid}
  `
  return next
}

function rowsOf<T>(value: unknown): T[] {
  return value as T[]
}

function mapOwner(row: UserRow): OwnerProfile {
  return {
    uid: row.uid,
    telegramId: row.telegram_id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    photoUrl: row.photo_url,
    languageCode: row.language_code,
    isPremium: row.is_premium,
    platform: 'Telegram Mini App',
  }
}

export async function upsertTelegramUser(user: TelegramUser): Promise<OwnerProfile> {
  const sql = await database()
  const uid = `tg_${user.id}`
  const rows = rowsOf<UserRow>(
    await sql`
    INSERT INTO cardly_users (
      uid, telegram_id, first_name, last_name, username, photo_url, language_code,
      is_premium, updated_at, last_login_at
    ) VALUES (
      ${uid}, ${String(user.id)}, ${user.first_name}, ${user.last_name ?? ''},
      ${user.username ?? ''}, ${user.photo_url ?? ''}, ${user.language_code ?? 'ru'},
      ${user.is_premium ?? false}, NOW(), NOW()
    )
    ON CONFLICT (uid) DO UPDATE SET
      telegram_id = EXCLUDED.telegram_id,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      username = EXCLUDED.username,
      photo_url = EXCLUDED.photo_url,
      language_code = EXCLUDED.language_code,
      is_premium = EXCLUDED.is_premium,
      updated_at = NOW(),
      last_login_at = NOW()
    RETURNING uid, telegram_id, first_name, last_name, username, photo_url, language_code, is_premium
  `,
  )
  return mapOwner(rows[0])
}

export async function getOwner(uid: string): Promise<OwnerProfile> {
  const sql = await database()
  const rows = rowsOf<UserRow>(
    await sql`
    SELECT uid, telegram_id, first_name, last_name, username, photo_url, language_code, is_premium
    FROM cardly_users WHERE uid = ${uid} LIMIT 1
  `,
  )
  if (!rows[0]) throw new AppError(404, 'owner_not_found', 'Профиль владельца не найден')
  return mapOwner(rows[0])
}

export async function getCard(uid: string): Promise<CardDraft | null> {
  const sql = await database()
  const rows = rowsOf<JsonRow>(
    await sql`SELECT data FROM cardly_cards WHERE owner_uid = ${uid} LIMIT 1`,
  )
  if (!rows[0]) return null
  return cardDraftSchema.parse(rows[0].data)
}

export async function getOrCreateCard(owner: OwnerProfile): Promise<CardDraft> {
  const current = await getCard(owner.uid)
  if (current) return current
  const sql = await database()
  const card = createInitialCard(owner)
  await sql`
    INSERT INTO cardly_cards (owner_uid, data, slug, published, public_data, updated_at)
    VALUES (${owner.uid}, ${JSON.stringify(card)}::jsonb, NULL, FALSE, NULL, NOW())
    ON CONFLICT (owner_uid) DO NOTHING
  `
  return (await getCard(owner.uid)) ?? card
}

export async function saveCard(uid: string, input: CardDraft): Promise<CardSaveResult> {
  const sql = await database()
  const parsedInput = cardDraftSchema.parse({ ...input, ownerUid: uid })

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const rows = rowsOf<CardRecordRow>(
      await sql`
        SELECT data, slug, published, public_data
        FROM cardly_cards WHERE owner_uid = ${uid} LIMIT 1
      `,
    )
    const row = rows[0]
    if (!row) throw new AppError(404, 'draft_not_found', 'Черновик визитки не найден')
    const current = cardDraftSchema.parse(row.data)
    const prepared = prepareCardSave(
      {
        card: current,
        slug: row.slug,
        published: row.published,
        publicData: row.public_data,
      },
      parsedInput,
      new Date().toISOString(),
    )

    try {
      const updated = rowsOf<{ owner_uid: string }>(
        await sql`
          UPDATE cardly_cards SET
            data = ${JSON.stringify(prepared.card)}::jsonb,
            slug = ${prepared.card.publication.slug || null},
            public_data = ${prepared.publicData === null ? null : JSON.stringify(prepared.publicData)}::jsonb,
            updated_at = NOW()
          WHERE owner_uid = ${uid}
            AND published = ${row.published}
            AND slug IS NOT DISTINCT FROM ${row.slug}
          RETURNING owner_uid
        `,
      )
      if (updated[0]) return { card: prepared.card, publicSync: prepared.publicSync }
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new AppError(409, 'slug_unavailable', 'Этот адрес уже занят')
      throw error
    }
  }

  throw new AppError(
    409,
    'card_state_changed',
    'Состояние визитки изменилось. Повторите сохранение',
  )
}

export async function isSlugAvailable(slug: string, uid?: string): Promise<boolean> {
  const sql = await database()
  const rows = uid
    ? await sql`SELECT owner_uid FROM cardly_cards WHERE slug = ${slug} AND owner_uid <> ${uid} LIMIT 1`
    : await sql`SELECT owner_uid FROM cardly_cards WHERE slug = ${slug} LIMIT 1`
  return rowsOf<Record<string, unknown>>(rows).length === 0
}

export async function publishCard(uid: string, slug: string): Promise<CardDraft> {
  const current = await getCard(uid)
  if (!current) throw new AppError(404, 'draft_not_found', 'Черновик визитки не найден')
  const now = new Date().toISOString()
  const card = publishableCardSchema.parse({
    ...current,
    publication: {
      ...current.publication,
      slug,
      published: true,
      publishedAt: current.publication.publishedAt ?? now,
      updatedAt: now,
    },
    lastPublishedAt: now,
    updatedAt: now,
  })
  const sql = await database()
  try {
    await sql`
      UPDATE cardly_cards SET
        data = ${JSON.stringify(card)}::jsonb,
        slug = ${slug},
        published = TRUE,
        public_data = ${JSON.stringify(sanitizePublicSnapshot(card))}::jsonb,
        updated_at = NOW()
      WHERE owner_uid = ${uid}
    `
  } catch (error) {
    if ((error as { code?: string }).code === '23505')
      throw new AppError(409, 'slug_unavailable', 'Этот адрес уже занят')
    throw error
  }
  return card
}

export async function unpublishCard(uid: string): Promise<{ card: CardDraft; slug: string }> {
  const current = await getCard(uid)
  if (!current) throw new AppError(404, 'draft_not_found', 'Черновик визитки не найден')
  const now = new Date().toISOString()
  const card = cardDraftSchema.parse({
    ...current,
    publication: { ...current.publication, published: false, updatedAt: now },
    updatedAt: now,
  })
  const sql = await database()
  await sql`
    UPDATE cardly_cards SET
      data = ${JSON.stringify(card)}::jsonb,
      published = FALSE,
      public_data = NULL,
      updated_at = NOW()
    WHERE owner_uid = ${uid}
  `
  return { card, slug: current.publication.slug }
}

export async function getPublicCard(slug: string): Promise<CardView | null> {
  const sql = await database()
  const rows = rowsOf<JsonRow>(
    await sql`
    SELECT public_data AS data FROM cardly_cards
    WHERE slug = ${slug} AND published = TRUE AND public_data IS NOT NULL LIMIT 1
  `,
  )
  if (!rows[0]) return null
  const parsed = publicCardSchema.safeParse(rows[0].data)
  return parsed.success ? parsed.data : null
}

export async function createLead(slug: string, input: LeadInput) {
  const sql = await database()
  const owners = rowsOf<{
    owner_uid: string
    telegram_id: string
    lead_notifications_enabled: boolean
  }>(
    await sql`
    SELECT c.owner_uid, u.telegram_id, u.lead_notifications_enabled
    FROM cardly_cards c JOIN cardly_users u ON u.uid = c.owner_uid
    WHERE c.slug = ${slug} AND c.published = TRUE LIMIT 1
  `,
  )
  const owner = owners[0]
  if (!owner) throw new AppError(404, 'card_not_found', 'Визитка не найдена')
  const id = randomUUID()
  await sql.transaction([
    sql`
      INSERT INTO cardly_leads (
        id, owner_uid, card_slug, sender_name, sender_contact, message, source
      ) VALUES (
        ${id}, ${owner.owner_uid}, ${slug}, ${input.senderName}, ${input.senderContact},
        ${input.message}, ${input.source}
      )
    `,
    sql`
      INSERT INTO cardly_stats (owner_uid, total_leads, updated_at)
      VALUES (${owner.owner_uid}, 1, NOW())
      ON CONFLICT (owner_uid) DO UPDATE SET
        total_leads = cardly_stats.total_leads + 1,
        updated_at = NOW()
    `,
    sql`
      INSERT INTO cardly_daily_stats (owner_uid, day, leads)
      VALUES (${owner.owner_uid}, CURRENT_DATE, 1)
      ON CONFLICT (owner_uid, day) DO UPDATE SET
        leads = cardly_daily_stats.leads + 1,
        updated_at = NOW()
    `,
  ])
  return {
    id,
    ownerUid: owner.owner_uid,
    telegramId: owner.telegram_id,
    notifyOwner: owner.lead_notifications_enabled,
  }
}

type MetricColumn =
  | 'total_views'
  | 'total_primary_clicks'
  | 'total_link_clicks'
  | 'total_project_opens'
  | 'total_leads'
  | 'total_shares'

export async function recordAnalyticsEvent(slug: string, event: AnalyticsEvent): Promise<void> {
  const sql = await database()
  const rows = rowsOf<{ owner_uid?: string }>(
    await sql`
    SELECT owner_uid FROM cardly_cards WHERE slug = ${slug} AND published = TRUE LIMIT 1
  `,
  )
  const uid = rows[0]?.owner_uid
  if (!uid) throw new AppError(404, 'card_not_found', 'Визитка не найдена')
  const column = {
    card_view: 'total_views',
    primary_cta_click: 'total_primary_clicks',
    link_click: 'total_link_clicks',
    project_open: 'total_project_opens',
    lead_submit: 'total_leads',
    share: 'total_shares',
  }[event.type] as MetricColumn
  const overallQueries = {
    total_views: sql`INSERT INTO cardly_stats (owner_uid, total_views) VALUES (${uid}, 1) ON CONFLICT (owner_uid) DO UPDATE SET total_views = cardly_stats.total_views + 1, updated_at = NOW()`,
    total_primary_clicks: sql`INSERT INTO cardly_stats (owner_uid, total_primary_clicks) VALUES (${uid}, 1) ON CONFLICT (owner_uid) DO UPDATE SET total_primary_clicks = cardly_stats.total_primary_clicks + 1, updated_at = NOW()`,
    total_link_clicks: sql`INSERT INTO cardly_stats (owner_uid, total_link_clicks) VALUES (${uid}, 1) ON CONFLICT (owner_uid) DO UPDATE SET total_link_clicks = cardly_stats.total_link_clicks + 1, updated_at = NOW()`,
    total_project_opens: sql`INSERT INTO cardly_stats (owner_uid, total_project_opens) VALUES (${uid}, 1) ON CONFLICT (owner_uid) DO UPDATE SET total_project_opens = cardly_stats.total_project_opens + 1, updated_at = NOW()`,
    total_leads: sql`INSERT INTO cardly_stats (owner_uid, total_leads) VALUES (${uid}, 1) ON CONFLICT (owner_uid) DO UPDATE SET total_leads = cardly_stats.total_leads + 1, updated_at = NOW()`,
    total_shares: sql`INSERT INTO cardly_stats (owner_uid, total_shares) VALUES (${uid}, 1) ON CONFLICT (owner_uid) DO UPDATE SET total_shares = cardly_stats.total_shares + 1, updated_at = NOW()`,
  }
  const dailyQueries = {
    total_views: sql`INSERT INTO cardly_daily_stats (owner_uid, day, views) VALUES (${uid}, CURRENT_DATE, 1) ON CONFLICT (owner_uid, day) DO UPDATE SET views = cardly_daily_stats.views + 1, updated_at = NOW()`,
    total_primary_clicks: sql`INSERT INTO cardly_daily_stats (owner_uid, day, primary_clicks) VALUES (${uid}, CURRENT_DATE, 1) ON CONFLICT (owner_uid, day) DO UPDATE SET primary_clicks = cardly_daily_stats.primary_clicks + 1, updated_at = NOW()`,
    total_link_clicks: sql`INSERT INTO cardly_daily_stats (owner_uid, day, link_clicks) VALUES (${uid}, CURRENT_DATE, 1) ON CONFLICT (owner_uid, day) DO UPDATE SET link_clicks = cardly_daily_stats.link_clicks + 1, updated_at = NOW()`,
    total_project_opens: sql`INSERT INTO cardly_daily_stats (owner_uid, day, project_opens) VALUES (${uid}, CURRENT_DATE, 1) ON CONFLICT (owner_uid, day) DO UPDATE SET project_opens = cardly_daily_stats.project_opens + 1, updated_at = NOW()`,
    total_leads: sql`INSERT INTO cardly_daily_stats (owner_uid, day, leads) VALUES (${uid}, CURRENT_DATE, 1) ON CONFLICT (owner_uid, day) DO UPDATE SET leads = cardly_daily_stats.leads + 1, updated_at = NOW()`,
    total_shares: sql`INSERT INTO cardly_daily_stats (owner_uid, day, shares) VALUES (${uid}, CURRENT_DATE, 1) ON CONFLICT (owner_uid, day) DO UPDATE SET shares = cardly_daily_stats.shares + 1, updated_at = NOW()`,
  }
  await sql.transaction([overallQueries[column], dailyQueries[column]])
}

interface StatsRow {
  total_views: number
  total_primary_clicks: number
  total_link_clicks: number
  total_project_opens: number
  total_leads: number
  total_shares: number
}

export async function getOwnerDashboard(uid: string): Promise<{
  owner: OwnerProfile
  stats: CardStats
  leads: LeadRecord[]
}> {
  const sql = await database()
  const [owner, statsRowsRaw, dailyRowsRaw, leadRowsRaw] = await Promise.all([
    getOwner(uid),
    sql`SELECT * FROM cardly_stats WHERE owner_uid = ${uid} LIMIT 1`,
    sql`SELECT TO_CHAR(day, 'DD.MM') AS date, views FROM cardly_daily_stats WHERE owner_uid = ${uid} ORDER BY day DESC LIMIT 30`,
    sql`SELECT id, owner_uid, card_slug, sender_name, sender_contact, message, source, status, created_at FROM cardly_leads WHERE owner_uid = ${uid} ORDER BY created_at DESC LIMIT 100`,
  ])
  const statsRows = rowsOf<StatsRow>(statsRowsRaw)
  const dailyRows = rowsOf<{ date: string; views: number }>(dailyRowsRaw)
  const leadRows = rowsOf<Record<string, unknown>>(leadRowsRaw)
  const row = statsRows[0] ?? {
    total_views: 0,
    total_primary_clicks: 0,
    total_link_clicks: 0,
    total_project_opens: 0,
    total_leads: 0,
    total_shares: 0,
  }
  const daily = [...dailyRows]
    .reverse()
    .map((item) => ({ date: String(item.date), views: Number(item.views) }))
  const stats: CardStats = {
    totalViews: Number(row.total_views),
    totalPrimaryClicks: Number(row.total_primary_clicks),
    totalLinkClicks: Number(row.total_link_clicks),
    totalProjectOpens: Number(row.total_project_opens),
    totalLeads: Number(row.total_leads),
    totalShares: Number(row.total_shares),
    daily,
    popularActions: [
      { label: 'Основная кнопка', value: Number(row.total_primary_clicks) },
      { label: 'Ссылки', value: Number(row.total_link_clicks) },
      { label: 'Проекты', value: Number(row.total_project_opens) },
      { label: 'Поделиться', value: Number(row.total_shares) },
    ],
  }
  const leads = leadRows.map((lead: Record<string, unknown>) => ({
    id: String(lead.id),
    ownerUid: String(lead.owner_uid),
    cardSlug: String(lead.card_slug),
    senderName: String(lead.sender_name),
    senderContact: String(lead.sender_contact),
    message: String(lead.message),
    source: lead.source as LeadRecord['source'],
    status: lead.status as LeadRecord['status'],
    createdAt: new Date(String(lead.created_at)).toISOString(),
  }))
  return { owner, stats, leads }
}

interface PeriodMetricRow {
  label?: string
  views: number
  primary_clicks: number
  link_clicks: number
  project_opens: number
  leads: number
  shares: number
}

function metricTotals(rows: PeriodMetricRow[]) {
  return rows.reduce(
    (total, row) => ({
      views: total.views + Number(row.views),
      primaryClicks: total.primaryClicks + Number(row.primary_clicks),
      linkClicks: total.linkClicks + Number(row.link_clicks),
      projectOpens: total.projectOpens + Number(row.project_opens),
      leads: total.leads + Number(row.leads),
      shares: total.shares + Number(row.shares),
    }),
    { views: 0, primaryClicks: 0, linkClicks: 0, projectOpens: 0, leads: 0, shares: 0 },
  )
}

export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 100)
}

export async function getOwnerStats(uid: string, period: StatsPeriod): Promise<PeriodStats> {
  const sql = await database()
  if (period === 'all') {
    const rows = rowsOf<PeriodMetricRow>(
      await sql`
      SELECT TO_CHAR(DATE_TRUNC('month', day), 'MM.YYYY') AS label,
        SUM(views)::int AS views, SUM(primary_clicks)::int AS primary_clicks,
        SUM(link_clicks)::int AS link_clicks, SUM(project_opens)::int AS project_opens,
        SUM(leads)::int AS leads, SUM(shares)::int AS shares
      FROM cardly_daily_stats WHERE owner_uid = ${uid}
      GROUP BY DATE_TRUNC('month', day) ORDER BY DATE_TRUNC('month', day)
    `,
    )
    const totals = metricTotals(rows)
    return {
      period,
      range: { from: rows[0]?.label ?? null, to: rows[rows.length - 1]?.label ?? null },
      totals,
      deltas: { views: null, primaryClicks: null, leads: null },
      series: rows.map((row) => ({ label: String(row.label), views: Number(row.views) })),
      averageViews: rows.length ? Math.round(totals.views / rows.length) : 0,
      popularActions: [
        { label: 'primary', value: totals.primaryClicks },
        { label: 'links', value: totals.linkClicks },
        { label: 'projects', value: totals.projectOpens },
        { label: 'share', value: totals.shares },
      ],
    }
  }
  const days = period === '7' ? 7 : 30
  const [currentRaw, previousRaw] = await Promise.all([
    sql`
      SELECT TO_CHAR(series.day, 'DD.MM') AS label,
        COALESCE(stats.views, 0)::int AS views,
        COALESCE(stats.primary_clicks, 0)::int AS primary_clicks,
        COALESCE(stats.link_clicks, 0)::int AS link_clicks,
        COALESCE(stats.project_opens, 0)::int AS project_opens,
        COALESCE(stats.leads, 0)::int AS leads,
        COALESCE(stats.shares, 0)::int AS shares
      FROM GENERATE_SERIES(CURRENT_DATE - (${days} - 1), CURRENT_DATE, INTERVAL '1 day') AS series(day)
      LEFT JOIN cardly_daily_stats stats ON stats.owner_uid = ${uid} AND stats.day = series.day
      ORDER BY series.day
    `,
    sql`
      SELECT COALESCE(SUM(views), 0)::int AS views,
        COALESCE(SUM(primary_clicks), 0)::int AS primary_clicks,
        COALESCE(SUM(link_clicks), 0)::int AS link_clicks,
        COALESCE(SUM(project_opens), 0)::int AS project_opens,
        COALESCE(SUM(leads), 0)::int AS leads,
        COALESCE(SUM(shares), 0)::int AS shares
      FROM cardly_daily_stats
      WHERE owner_uid = ${uid}
        AND day BETWEEN CURRENT_DATE - (${days} * 2 - 1) AND CURRENT_DATE - ${days}
    `,
  ])
  const rows = rowsOf<PeriodMetricRow>(currentRaw)
  const previousRows = rowsOf<PeriodMetricRow>(previousRaw)
  const totals = metricTotals(rows)
  const previous = metricTotals(previousRows)
  const today = new Date()
  const from = new Date(today)
  from.setUTCDate(from.getUTCDate() - days + 1)
  return {
    period,
    range: { from: from.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) },
    totals,
    deltas: {
      views: percentDelta(totals.views, previous.views),
      primaryClicks: percentDelta(totals.primaryClicks, previous.primaryClicks),
      leads: percentDelta(totals.leads, previous.leads),
    },
    series: rows.map((row) => ({ label: String(row.label), views: Number(row.views) })),
    averageViews: Math.round(totals.views / days),
    popularActions: [
      { label: 'primary', value: totals.primaryClicks },
      { label: 'links', value: totals.linkClicks },
      { label: 'projects', value: totals.projectOpens },
      { label: 'share', value: totals.shares },
    ],
  }
}

export async function updateLeadStatus(
  uid: string,
  id: string,
  status: LeadRecord['status'],
): Promise<void> {
  const sql = await database()
  const rows = rowsOf<{ id: string }>(
    await sql`
    UPDATE cardly_leads SET status = ${status}
    WHERE id = ${id} AND owner_uid = ${uid}
    RETURNING id
  `,
  )
  if (!rows[0]) throw new AppError(404, 'lead_not_found', 'Заявка не найдена')
}

import { neon } from '@neondatabase/serverless'

import { requireServerEnv } from '../config/server-env.js'

let sqlClient: ReturnType<typeof neon> | null = null
let schemaPromise: Promise<void> | null = null

export function getSql() {
  if (!sqlClient) sqlClient = neon(requireServerEnv('DATABASE_URL').DATABASE_URL)
  return sqlClient
}

export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaPromise) return schemaPromise
  const sql = getSql()
  schemaPromise = (async () => {
    await sql.transaction([
      sql`CREATE TABLE IF NOT EXISTS cardly_users (
        uid TEXT PRIMARY KEY,
        telegram_id TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL DEFAULT '',
        username TEXT NOT NULL DEFAULT '',
        photo_url TEXT NOT NULL DEFAULT '',
        language_code TEXT NOT NULL DEFAULT 'ru',
        is_premium BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS cardly_cards (
        owner_uid TEXT PRIMARY KEY REFERENCES cardly_users(uid) ON DELETE CASCADE,
        data JSONB NOT NULL,
        slug VARCHAR(30) UNIQUE,
        published BOOLEAN NOT NULL DEFAULT FALSE,
        public_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS cardly_leads (
        id TEXT PRIMARY KEY,
        owner_uid TEXT NOT NULL REFERENCES cardly_users(uid) ON DELETE CASCADE,
        card_slug VARCHAR(30) NOT NULL,
        sender_name TEXT NOT NULL,
        sender_contact TEXT NOT NULL,
        message TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS cardly_stats (
        owner_uid TEXT PRIMARY KEY REFERENCES cardly_users(uid) ON DELETE CASCADE,
        total_views INTEGER NOT NULL DEFAULT 0,
        total_primary_clicks INTEGER NOT NULL DEFAULT 0,
        total_link_clicks INTEGER NOT NULL DEFAULT 0,
        total_project_opens INTEGER NOT NULL DEFAULT 0,
        total_leads INTEGER NOT NULL DEFAULT 0,
        total_shares INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS cardly_daily_stats (
        owner_uid TEXT NOT NULL REFERENCES cardly_users(uid) ON DELETE CASCADE,
        day DATE NOT NULL,
        views INTEGER NOT NULL DEFAULT 0,
        primary_clicks INTEGER NOT NULL DEFAULT 0,
        link_clicks INTEGER NOT NULL DEFAULT 0,
        project_opens INTEGER NOT NULL DEFAULT 0,
        leads INTEGER NOT NULL DEFAULT 0,
        shares INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (owner_uid, day)
      )`,
      sql`CREATE TABLE IF NOT EXISTS cardly_rate_limits (
        key TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS cardly_share_sources (
        id UUID PRIMARY KEY,
        owner_uid TEXT NOT NULL REFERENCES cardly_users(uid) ON DELETE CASCADE,
        card_slug VARCHAR(30) NOT NULL,
        name VARCHAR(60) NOT NULL,
        token VARCHAR(64) UNIQUE NOT NULL,
        archived BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS cardly_analytics_events (
        event_id UUID PRIMARY KEY,
        owner_uid TEXT NOT NULL REFERENCES cardly_users(uid) ON DELETE CASCADE,
        card_slug VARCHAR(30) NOT NULL,
        event_type VARCHAR(40) NOT NULL,
        target_id VARCHAR(80),
        source_id UUID REFERENCES cardly_share_sources(id) ON DELETE SET NULL,
        visit_id_hash VARCHAR(64) NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE INDEX IF NOT EXISTS cardly_leads_owner_created_idx
        ON cardly_leads(owner_uid, created_at DESC)`,
      sql`ALTER TABLE cardly_users ADD COLUMN IF NOT EXISTS preferred_locale TEXT`,
      sql`ALTER TABLE cardly_users ADD COLUMN IF NOT EXISTS lead_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE`,
      sql`ALTER TABLE cardly_leads ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES cardly_share_sources(id) ON DELETE SET NULL`,
      sql`CREATE INDEX IF NOT EXISTS cardly_share_sources_owner_idx
        ON cardly_share_sources(owner_uid, archived, created_at DESC)`,
      sql`CREATE INDEX IF NOT EXISTS cardly_analytics_owner_time_idx
        ON cardly_analytics_events(owner_uid, occurred_at DESC)`,
      sql`CREATE INDEX IF NOT EXISTS cardly_analytics_source_time_idx
        ON cardly_analytics_events(source_id, occurred_at DESC)`,
      sql`CREATE INDEX IF NOT EXISTS cardly_analytics_visit_idx
        ON cardly_analytics_events(owner_uid, visit_id_hash, occurred_at DESC)`,
    ])
  })().catch((error) => {
    schemaPromise = null
    throw error
  })
  return schemaPromise
}

export async function database() {
  await ensureDatabaseSchema()
  return getSql()
}

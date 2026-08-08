import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { neon } from '@neondatabase/serverless'

const args = new Set(process.argv.slice(2))
const slugArg = process.argv.find((value) => value.startsWith('--slug='))
const slug = slugArg?.slice('--slug='.length) ?? 'alexey'
const confirmed = args.has('--confirm')
const databaseUrl = [
  process.env.DATABASE_URL,
  process.env.DATABASE_POSTGRES_URL,
  process.env.DATABASE_URL_UNPOOLED,
  process.env.DATABASE_POSTGRES_URL_NON_POOLING,
].find((value) => value?.startsWith('postgres://') || value?.startsWith('postgresql://'))

if (!databaseUrl) throw new Error('A valid Neon/Postgres database URL is required')
if (!/^[a-z0-9-]{3,30}$/.test(slug)) throw new Error('Invalid --slug value')

const sql = neon(databaseUrl)
const cards = await sql`SELECT * FROM cardly_cards WHERE slug = ${slug}`
if (!cards[0]) {
  console.info(`No card found for slug ${slug}`)
  process.exit(0)
}

const ownerUid = String(cards[0].owner_uid)
const [users, leads, stats, dailyStats] = await Promise.all([
  sql`SELECT uid, telegram_id, first_name, last_name, username, created_at FROM cardly_users WHERE uid = ${ownerUid}`,
  sql`SELECT * FROM cardly_leads WHERE owner_uid = ${ownerUid} OR card_slug = ${slug}`,
  sql`SELECT * FROM cardly_stats WHERE owner_uid = ${ownerUid}`,
  sql`SELECT * FROM cardly_daily_stats WHERE owner_uid = ${ownerUid} ORDER BY day`,
])

const summary = {
  slug,
  ownerUid,
  cards: cards.length,
  leads: leads.length,
  stats: stats.length,
  dailyStats: dailyStats.length,
  mode: confirmed ? 'confirm' : 'dry-run',
}
console.info(JSON.stringify(summary, null, 2))

if (!confirmed) {
  console.info('Dry run only. Re-run with --confirm to export and delete these records.')
  process.exit(0)
}

const backupDirectory = resolve('.cardly-backups')
await mkdir(backupDirectory, { recursive: true })
const backupPath = resolve(
  backupDirectory,
  `${new Date().toISOString().replaceAll(':', '-')}-${slug}.json`,
)
await writeFile(
  backupPath,
  JSON.stringify(
    { exportedAt: new Date().toISOString(), users, cards, leads, stats, dailyStats },
    null,
    2,
  ),
  'utf8',
)

await sql.transaction([
  sql`DELETE FROM cardly_leads WHERE owner_uid = ${ownerUid} OR card_slug = ${slug}`,
  sql`DELETE FROM cardly_daily_stats WHERE owner_uid = ${ownerUid}`,
  sql`DELETE FROM cardly_stats WHERE owner_uid = ${ownerUid}`,
  sql`DELETE FROM cardly_cards WHERE owner_uid = ${ownerUid} AND slug = ${slug}`,
])

console.info(`Backup written to ${backupPath}`)
console.info(
  `Removed test card ${slug} and related leads/statistics; user ${ownerUid} was preserved.`,
)

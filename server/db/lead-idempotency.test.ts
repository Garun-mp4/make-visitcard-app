// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { database } = vi.hoisted(() => ({ database: vi.fn() }))

vi.mock('./client.js', () => ({ database }))

import { createLead } from './repository.js'
import { resetServerEnvForTests } from '../config/server-env.js'

describe('attributed lead idempotency', () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_HASH_SECRET = 'test-rate-limit-hash-secret-123456'
    resetServerEnvForTests()
    let rawEventInserted = false
    const sql = Object.assign(
      vi.fn((strings: TemplateStringsArray) => {
        const query = strings.join(' ')
        if (query.includes('SELECT c.owner_uid'))
          return Promise.resolve([
            {
              owner_uid: 'owner-1',
              telegram_id: '42',
              lead_notifications_enabled: true,
            },
          ])
        if (query.includes('WITH inserted_event'))
          return Promise.resolve([{ id: 'lead-1', inserted: !rawEventInserted }]).then((rows) => {
            rawEventInserted = true
            return rows
          })
        if (query.includes('INSERT INTO cardly_analytics_events')) {
          if (rawEventInserted) return Promise.resolve([])
          rawEventInserted = true
          return Promise.resolve([{ event_id: '22222222-2222-4222-8222-222222222222' }])
        }
        return Promise.resolve([])
      }),
      { transaction: vi.fn().mockResolvedValue([]) },
    )
    database.mockResolvedValue(sql)
  })

  it('returns the original lead and does not notify twice for a retried event', async () => {
    const input = {
      senderName: 'Мария',
      senderContact: '@maria',
      message: 'Хочу обсудить проект',
      source: 'telegram' as const,
      website: '',
      visitId: '11111111-1111-4111-8111-111111111111',
      eventId: '22222222-2222-4222-8222-222222222222',
    }

    const first = await createLead('ada', input)
    const retried = await createLead('ada', input)

    expect(retried.id).toBe(first.id)
    expect(first.notifyOwner).toBe(true)
    expect(retried.notifyOwner).toBe(false)
  })
})

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { database } = vi.hoisted(() => ({ database: vi.fn() }))

vi.mock('./client.js', () => ({ database }))

import { getOwnerStats } from './repository.js'

let capturedQueries: Array<{ text: string; values: unknown[] }> = []

describe('statistics period queries', () => {
  beforeEach(() => {
    capturedQueries = []
    const sql = Object.assign(
      vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => {
        capturedQueries.push({ text: strings.join('?'), values })
        return Promise.resolve([])
      }),
      { transaction: vi.fn().mockResolvedValue([]) },
    )
    database.mockResolvedValue(sql)
  })

  it.each([
    ['7', 6],
    ['30', 29],
  ] as const)(
    'turns the %s-day period into a PostgreSQL interval for journey events',
    async (period, days) => {
      await getOwnerStats('owner-1', period)

      const eventQuery = capturedQueries.find(
        (query) => query.text.includes('cardly_analytics_events') && query.text.includes('SELECT'),
      )

      expect(eventQuery?.text).toContain('make_interval(days => ?)')
      expect(eventQuery?.values).toContain(days)
    },
  )
})

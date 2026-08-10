import { describe, expect, it } from 'vitest'

import type { ShareSource } from '../../shared/types.js'
import { buildJourneyStats, generateShareSourceToken } from './repository.js'

const source: ShareSource = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Event',
  token: 'abcdefghijklmnop',
  archived: false,
  createdAt: '2026-08-10T00:00:00.000Z',
  updatedAt: '2026-08-10T00:00:00.000Z',
}

describe('Milestone 2 journey analytics', () => {
  it('counts each visit once per cumulative stage and keeps the funnel coherent', () => {
    const result = buildJourneyStats(
      [
        { visit_id_hash: 'a', event_type: 'card_view', source_id: source.id },
        { visit_id_hash: 'a', event_type: 'project_open', source_id: source.id },
        { visit_id_hash: 'a', event_type: 'project_open', source_id: source.id },
        { visit_id_hash: 'a', event_type: 'lead_submit', source_id: source.id },
        { visit_id_hash: 'b', event_type: 'card_view', source_id: null },
      ],
      [source],
    )
    expect(result.funnel).toMatchObject({ views: 2, interest: 1, contacts: 1, leads: 1 })
    expect(result.sources.find((item) => item.id === source.id)).toMatchObject({
      views: 1,
      leads: 1,
    })
    expect(result.sources.find((item) => item.id === null)).toMatchObject({ views: 1, leads: 0 })
  })

  it('creates URL-safe unpredictable tokens', () => {
    const first = generateShareSourceToken()
    const second = generateShareSourceToken()
    expect(first).toMatch(/^[A-Za-z0-9_-]{16,64}$/)
    expect(second).not.toBe(first)
  })
})

// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { percentDelta, statsPeriodRange } from './repository.js'

describe('period statistics', () => {
  it('calculates honest deltas against the previous period', () => {
    expect(percentDelta(120, 100)).toBe(20)
    expect(percentDelta(80, 100)).toBe(-20)
    expect(percentDelta(0, 0)).toBe(0)
  })

  it('does not invent a percentage when the previous period is empty', () => {
    expect(percentDelta(5, 0)).toBeNull()
  })

  it('builds explicit current and previous date ranges for SQL queries', () => {
    expect(statsPeriodRange(7, new Date('2026-08-08T18:00:00.000Z'))).toEqual({
      from: '2026-08-02',
      to: '2026-08-08',
      previousFrom: '2026-07-26',
      previousTo: '2026-08-01',
    })
  })
})

// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { percentDelta } from './repository.js'

describe('period statistics', () => {
  it('calculates honest deltas against the previous period', () => {
    expect(percentDelta(120, 100)).toBe(20)
    expect(percentDelta(80, 100)).toBe(-20)
    expect(percentDelta(0, 0)).toBe(0)
  })

  it('does not invent a percentage when the previous period is empty', () => {
    expect(percentDelta(5, 0)).toBeNull()
  })
})

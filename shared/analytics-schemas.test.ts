import { describe, expect, it } from 'vitest'

import { analyticsEventSchema, shareSourceCreateSchema } from './schemas.js'

describe('Milestone 2 analytics contracts', () => {
  it('accepts anonymous visit context and a strict source token', () => {
    expect(
      analyticsEventSchema.parse({
        type: 'card_view',
        source: 'web',
        sourceToken: 'abcdefghijklmnop',
        visitId: '11111111-1111-4111-8111-111111111111',
        eventId: '22222222-2222-4222-8222-222222222222',
      }),
    ).toBeTruthy()
    expect(() =>
      analyticsEventSchema.parse({ type: 'card_view', sourceToken: '<script>alert(1)</script>' }),
    ).toThrow()
    expect(() =>
      analyticsEventSchema.parse({
        type: 'card_view',
        eventId: '22222222-2222-4222-8222-222222222222',
      }),
    ).toThrow()
  })

  it('normalizes source names and enforces the UI limit', () => {
    expect(shareSourceCreateSchema.parse({ name: '  Resume  ' }).name).toBe('Resume')
    expect(() => shareSourceCreateSchema.parse({ name: 'x'.repeat(61) })).toThrow()
  })
})

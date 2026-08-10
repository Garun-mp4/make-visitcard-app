import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPublicVisitContext } from './public-visit'

describe('public visit context', () => {
  beforeEach(() => {
    sessionStorage.clear()
    window.history.replaceState({}, '', '/c/ada')
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
      .mockReturnValueOnce('22222222-2222-4222-8222-222222222222')
      .mockReturnValueOnce('33333333-3333-4333-8333-333333333333')
  })

  it('keeps one anonymous visit id and creates an event id per action', () => {
    const first = getPublicVisitContext('ada')
    const second = getPublicVisitContext('ada')
    expect(first.visitId).toBe(second.visitId)
    expect(first.eventId).not.toBe(second.eventId)
  })

  it('accepts only strict URL-safe ref tokens', () => {
    window.history.replaceState({}, '', '/c/ada?ref=abcdefghijklmnop')
    expect(getPublicVisitContext('ada').sourceToken).toBe('abcdefghijklmnop')
    window.history.replaceState({}, '', '/c/ada?ref=%3Cscript%3E')
    expect(getPublicVisitContext('other')).not.toHaveProperty('sourceToken')
  })
})

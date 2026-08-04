import { describe, expect, it } from 'vitest'

import { isSafeExternalUrl, reservedSlugs, slugSchema } from './schemas.js'

describe('slugSchema', () => {
  it('normalizes and accepts a valid slug', () => {
    expect(slugSchema.parse(' Alexey-Design ')).toBe('alexey-design')
  })

  it.each(['-alexey', 'alexey-', 'alexey--design', 'алексей', 'ab'])('rejects %s', (slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(false)
  })

  it('rejects reserved slugs', () => {
    expect(reservedSlugs.has('api')).toBe(true)
    expect(slugSchema.safeParse('api').success).toBe(false)
  })
})

describe('isSafeExternalUrl', () => {
  it('allows public and contact protocols', () => {
    expect(isSafeExternalUrl('https://cardly.example')).toBe(true)
    expect(isSafeExternalUrl('mailto:alexey@example.com')).toBe(true)
    expect(isSafeExternalUrl('tel:+79991234567')).toBe(true)
  })

  it('rejects executable protocols and controls', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeExternalUrl('data:text/html,test')).toBe(false)
    expect(isSafeExternalUrl('https://example.com/\nheader')).toBe(false)
  })
})

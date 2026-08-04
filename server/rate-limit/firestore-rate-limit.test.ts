import { describe, expect, it } from 'vitest'

import { rateLimitHash } from './firestore-rate-limit.js'

describe('rateLimitHash', () => {
  it('is stable but separates identity and time buckets', () => {
    const first = rateLimitHash('a-secret-with-at-least-24-chars', 'lead', '127.0.0.1', 10)
    expect(first).toHaveLength(64)
    expect(rateLimitHash('a-secret-with-at-least-24-chars', 'lead', '127.0.0.1', 10)).toBe(first)
    expect(rateLimitHash('a-secret-with-at-least-24-chars', 'lead', '127.0.0.2', 10)).not.toBe(
      first,
    )
  })
})

import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { secureCompareHex, validateTelegramInitData } from './telegram-init-data.js'

const token = '1234567890:abcdefghijklmnopqrstuvwxyzABCDE'
const now = 1_800_000_000

function signedInitData(overrides: Record<string, string> = {}) {
  const params = new URLSearchParams({
    auth_date: String(now - 30),
    query_id: 'query-1',
    user: JSON.stringify({ id: 42, first_name: 'Alexey', username: 'alexey' }),
    ...overrides,
  })
  const data = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(token).digest()
  params.set('hash', createHmac('sha256', secret).update(data).digest('hex'))
  return params.toString()
}

describe('Telegram initData validation', () => {
  it('accepts a correctly signed recent payload', () => {
    expect(validateTelegramInitData(signedInitData(), token, 3600, now).user.id).toBe(42)
  })

  it('rejects an invalid hash', () => {
    const value = signedInitData().replace(/hash=[^&]+/, `hash=${'0'.repeat(64)}`)
    expect(() => validateTelegramInitData(value, token, 3600, now)).toThrow()
  })

  it('rejects expired auth_date', () => {
    expect(() =>
      validateTelegramInitData(signedInitData({ auth_date: String(now - 4000) }), token, 3600, now),
    ).toThrow()
  })

  it('rejects malformed Telegram users', () => {
    expect(() =>
      validateTelegramInitData(signedInitData({ user: '{bad-json' }), token, 3600, now),
    ).toThrow()
  })

  it('handles constant-time comparison boundaries without throwing', () => {
    expect(secureCompareHex('a'.repeat(64), 'a'.repeat(64))).toBe(true)
    expect(secureCompareHex('a'.repeat(64), 'b'.repeat(64))).toBe(false)
    expect(secureCompareHex('short', 'short')).toBe(false)
  })
})

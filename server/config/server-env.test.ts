import { afterEach, describe, expect, it } from 'vitest'

import { getServerEnv, normalizePrivateKey, resetServerEnvForTests } from './server-env.js'

describe('server environment', () => {
  afterEach(() => {
    delete process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS
    resetServerEnvForTests()
  })

  it('normalizes escaped private-key newlines', () => {
    expect(normalizePrivateKey('line1\\nline2')).toBe('line1\nline2')
  })

  it('parses numeric limits and safe defaults', () => {
    process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS = '1200'
    resetServerEnvForTests()
    expect(getServerEnv().TELEGRAM_INIT_DATA_MAX_AGE_SECONDS).toBe(1200)
  })

  it('rejects invalid limits', () => {
    process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS = '-1'
    resetServerEnvForTests()
    expect(() => getServerEnv()).toThrow('Invalid server environment variables')
  })
})

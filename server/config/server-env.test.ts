import { afterEach, describe, expect, it } from 'vitest'

import { getServerEnv, resetServerEnvForTests } from './server-env.js'

describe('server environment', () => {
  afterEach(() => {
    delete process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS
    resetServerEnvForTests()
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

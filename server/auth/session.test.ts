import { afterEach, describe, expect, it } from 'vitest'

import { createSessionToken, verifySessionToken } from './session.js'
import { resetServerEnvForTests } from '../config/server-env.js'

describe('signed sessions', () => {
  afterEach(() => {
    delete process.env.SESSION_SECRET
    resetServerEnvForTests()
  })

  it('creates and verifies a user session', () => {
    process.env.SESSION_SECRET = 'a-session-secret-with-at-least-32-characters'
    resetServerEnvForTests()
    const token = createSessionToken('telegram:42')
    expect(verifySessionToken(token)).toMatchObject({ uid: 'telegram:42' })
  })

  it('rejects tampered tokens', () => {
    process.env.SESSION_SECRET = 'a-session-secret-with-at-least-32-characters'
    resetServerEnvForTests()
    const token = createSessionToken('telegram:42')
    expect(() => verifySessionToken(`${token}x`)).toThrow('Сессия недействительна')
  })
})

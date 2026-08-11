// @vitest-environment node
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getOwnerStats } = vi.hoisted(() => ({ getOwnerStats: vi.fn() }))

vi.mock('../db/repository.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../db/repository.js')>()),
  getOwnerStats,
}))

import { createSessionToken } from '../auth/session.js'
import { resetServerEnvForTests } from '../config/server-env.js'
import { logger } from '../utils/logger.js'
import { createApp } from './create-app.js'

describe('API error diagnostics', () => {
  const app = createApp()

  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-session-secret-with-32-characters'
    process.env.ALLOWED_ORIGINS = 'http://localhost:5173'
    resetServerEnvForTests()
    getOwnerStats.mockReset()
  })

  it('logs a bounded underlying error while keeping the response generic', async () => {
    getOwnerStats.mockRejectedValueOnce(new Error('column cardly_analytics_events.foo missing'))
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined)

    const response = await request(app)
      .get('/api/owner/stats?period=7')
      .set('Authorization', `Bearer ${createSessionToken('tg_test')}`)
      .expect(500)

    expect(response.body).toMatchObject({ code: 'internal_error' })
    expect(errorSpy).toHaveBeenCalledWith(
      'Unhandled API error',
      expect.objectContaining({
        errorName: 'Error',
        errorMessage: 'column cardly_analytics_events.foo missing',
      }),
    )
    errorSpy.mockRestore()
  })
})

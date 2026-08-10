// @vitest-environment node
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type * as Repository from '../db/repository.js'

const mocks = vi.hoisted(() => ({
  listShareSources: vi.fn(),
  createShareSource: vi.fn(),
  updateShareSource: vi.fn(),
}))

vi.mock('../db/repository.js', async (importOriginal) => ({
  ...(await importOriginal<typeof Repository>()),
  ...mocks,
}))

import { resetServerEnvForTests } from '../config/server-env.js'
import { createSessionToken } from '../auth/session.js'
import { createApp } from './create-app.js'

const source = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Resume',
  token: 'abcdefghijklmnop',
  archived: false,
  createdAt: '2026-08-10T00:00:00.000Z',
  updatedAt: '2026-08-10T00:00:00.000Z',
}

describe('owner share source routes', () => {
  const app = createApp()

  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-session-secret-with-32-characters'
    process.env.ALLOWED_ORIGINS = 'http://localhost:5173'
    resetServerEnvForTests()
    mocks.listShareSources.mockReset().mockResolvedValue([source])
    mocks.createShareSource.mockReset().mockResolvedValue(source)
    mocks.updateShareSource.mockReset().mockResolvedValue(source)
  })

  it('requires an owner session', async () => {
    await request(app).get('/api/owner/share-sources').expect(401)
  })

  it('lists only sources belonging to the authenticated owner', async () => {
    const token = createSessionToken('owner-1')
    const response = await request(app)
      .get('/api/owner/share-sources')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(response.body.sources).toEqual([source])
    expect(mocks.listShareSources).toHaveBeenCalledWith('owner-1')
  })

  it('validates and creates a source for the authenticated owner', async () => {
    const token = createSessionToken('owner-1')
    await request(app)
      .post('/api/owner/share-sources')
      .set('Authorization', `Bearer ${token}`)
      .set('Origin', 'http://localhost:5173')
      .set('Content-Type', 'application/json')
      .send({ name: '  Resume  ' })
      .expect(201)
    expect(mocks.createShareSource).toHaveBeenCalledWith('owner-1', { name: 'Resume' })
  })
})

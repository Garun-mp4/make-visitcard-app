// @vitest-environment node
import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from './create-app.js'

describe('API shell', () => {
  const app = createApp()

  it('returns JSON health data', async () => {
    const response = await request(app).get('/api/health').expect(200)
    expect(response.body).toMatchObject({ ok: true, service: 'cardly-api' })
  })

  it('returns a JSON 404 for unknown API routes', async () => {
    const response = await request(app).get('/api/unknown').expect(404)
    expect(response.type).toMatch(/json/)
    expect(response.body.code).toBe('api_not_found')
  })

  it('rejects a known route with the wrong method', async () => {
    const response = await request(app).get('/api/cards/publish').expect(405)
    expect(response.body.code).toBe('method_not_allowed')
  })
})

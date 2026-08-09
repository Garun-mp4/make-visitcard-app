// @vitest-environment node
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { demoCard } from '../../shared/demo-data.js'
import { sanitizePublicSnapshot } from '../cards/public-snapshot.js'
import type * as Repository from '../db/repository.js'

const mocks = vi.hoisted(() => ({ getPublicCard: vi.fn() }))

vi.mock('../db/repository.js', async (importOriginal) => ({
  ...(await importOriginal<typeof Repository>()),
  getPublicCard: mocks.getPublicCard,
}))

vi.mock('../social/card-page-template.js', () => ({
  loadPublicCardTemplate: () =>
    Promise.resolve(
      '<!doctype html><html><head><meta name="description" content="Cardly"><title>Cardly</title></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>',
    ),
}))

import { createApp } from './create-app.js'

const publicCard = {
  ...sanitizePublicSnapshot(demoCard),
  profile: { ...sanitizePublicSnapshot(demoCard).profile, avatarUrl: '' },
}

describe('public share preview routes', () => {
  const app = createApp()

  beforeEach(() => {
    mocks.getPublicCard.mockReset()
    mocks.getPublicCard.mockResolvedValue(publicCard)
  })

  it('returns a crawler-ready HTML shell for a published card', async () => {
    const response = await request(app)
      .get('/api/public/page/alexey')
      .set('Host', 'cardly.example')
      .set('X-Forwarded-Proto', 'https')
      .expect(200)

    expect(response.type).toBe('text/html')
    expect(response.text).toContain(
      '<meta data-cardly-share property="og:title" content="Алексей Волков',
    )
    expect(response.text).toContain('https://cardly.example/api/public/cards/alexey/og.png?v=')
    expect(response.text).toContain('<script src="/assets/app.js"></script>')
  })

  it('returns a 1200x630 PNG response for the published card', async () => {
    const response = await request(app).get('/api/public/cards/alexey/og.png?v=preview').expect(200)
    const body: unknown = response.body

    expect(response.type).toBe('image/png')
    expect(Buffer.isBuffer(body)).toBe(true)
    if (!Buffer.isBuffer(body)) throw new Error('Expected a PNG buffer')
    expect(body.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
    expect(response.headers['cache-control']).toContain('immutable')
  })

  it.each(['/api/public/page/missing', '/api/public/cards/missing/og.png'])(
    'does not expose an unpublished card through %s',
    async (path) => {
      mocks.getPublicCard.mockResolvedValueOnce(null)
      const response = await request(app).get(path).expect(404)
      expect(response.body.code).toBe('card_not_found')
    },
  )
})

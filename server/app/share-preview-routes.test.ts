// @vitest-environment node
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { demoCard } from '../../shared/demo-data.js'
import { sanitizePublicSnapshot } from '../cards/public-snapshot.js'
import type * as Repository from '../db/repository.js'

const mocks = vi.hoisted(() => ({ getPublicCard: vi.fn(), renderQrPng: vi.fn() }))

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

vi.mock('../social/qr-image.js', () => ({
  renderQrPng: mocks.renderQrPng,
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
    mocks.renderQrPng.mockResolvedValue(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
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

  it('serves the crawler-ready shell through the public card rewrite path', async () => {
    const response = await request(app).get('/c/alexey').expect(200)

    expect(response.type).toBe('text/html')
    expect(response.text).toContain('property="og:image"')
    expect(response.text).toContain('<div id="root"></div>')
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

  it('serves a downloadable QR PNG for Telegram native downloads', async () => {
    const response = await request(app)
      .get('/api/public/cards/alexey/qr.png')
      .set('Host', 'cardly.example')
      .set('X-Forwarded-Proto', 'https')
      .expect(200)

    expect(response.type).toBe('image/png')
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="cardly-alexey-qr.png"',
    )
    expect(response.headers['access-control-allow-origin']).toBe('https://web.telegram.org')
    expect(mocks.renderQrPng).toHaveBeenCalledWith('https://cardly.example/c/alexey')
  })

  it('renders a tracked source into a downloadable QR without exposing visitor data', async () => {
    await request(app)
      .get('/api/public/cards/alexey/qr.png?ref=abcdefghijklmnop')
      .set('Host', 'cardly.example')
      .set('X-Forwarded-Proto', 'https')
      .expect(200)
    expect(mocks.renderQrPng).toHaveBeenLastCalledWith(
      'https://cardly.example/c/alexey?ref=abcdefghijklmnop',
    )
  })

  it('serves an importable vCard from the published snapshot', async () => {
    const response = await request(app)
      .get('/api/public/cards/alexey/contact.vcf')
      .set('Host', 'cardly.example')
      .set('X-Forwarded-Proto', 'https')
      .expect(200)

    expect(response.headers['content-type']).toContain('text/vcard')
    expect(response.headers['content-disposition']).toBe('attachment; filename="cardly-alexey.vcf"')
    expect(response.headers['access-control-allow-origin']).toBe('https://web.telegram.org')
    expect(response.text).toContain('BEGIN:VCARD\r\nVERSION:3.0\r\n')
    expect(response.text).toContain('FN:Алексей Волков\r\n')
    expect(response.text).toContain('item1.URL:https://cardly.example/c/alexey\r\n')
  })

  it.each([
    '/api/public/page/missing',
    '/api/public/cards/missing/og.png',
    '/api/public/cards/missing/qr.png',
    '/api/public/cards/missing/contact.vcf',
  ])('does not expose an unpublished card through %s', async (path) => {
    mocks.getPublicCard.mockResolvedValueOnce(null)
    const response = await request(app).get(path).expect(404)
    expect(response.body.code).toBe('card_not_found')
  })
})

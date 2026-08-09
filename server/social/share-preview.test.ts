// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

import { demoCard } from '../../shared/demo-data.js'
import { sanitizePublicSnapshot } from '../cards/public-snapshot.js'
import {
  buildSharePreviewMetadata,
  createSharePreviewVersion,
  renderPublicCardHtml,
} from './share-preview.js'
import { loadOpenGraphAvatar } from './open-graph-image.js'

const publicCard = sanitizePublicSnapshot(demoCard)

describe('share preview metadata', () => {
  it('builds a versioned canonical preview from the public snapshot', () => {
    const metadata = buildSharePreviewMetadata(publicCard, 'https://cardly.example')

    expect(metadata.title).toBe(
      `${publicCard.profile.displayName} — ${publicCard.profile.profession}`,
    )
    expect(metadata.canonicalUrl).toBe('https://cardly.example/c/alexey')
    expect(metadata.imageUrl).toBe(
      `https://cardly.example/api/public/cards/alexey/og.png?v=${createSharePreviewVersion(publicCard)}`,
    )
    expect(metadata.description.length).toBeLessThanOrEqual(160)
  })

  it('changes the image version when the public snapshot changes', () => {
    const next = {
      ...publicCard,
      updatedAt: new Date(Date.parse(publicCard.updatedAt) + 1000).toISOString(),
    }

    expect(createSharePreviewVersion(next)).not.toBe(createSharePreviewVersion(publicCard))
  })

  it('injects escaped metadata without exposing the public snapshot as JSON', () => {
    const unsafe = {
      ...publicCard,
      profile: {
        ...publicCard.profile,
        displayName: 'Иван <script>alert(1)</script>',
        profession: 'Дизайнер & разработчик',
      },
    }
    const html = renderPublicCardHtml(
      '<!doctype html><html><head><meta name="description" content="Cardly"><title>Cardly</title></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>',
      buildSharePreviewMetadata(unsafe, 'https://cardly.example'),
    )

    expect(html).toContain('Иван &lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('Дизайнер &amp; разработчик')
    expect(html).toContain('property="og:image"')
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
    expect(html).toContain('<script src="/assets/app.js"></script>')
    expect(html).not.toContain('"ownerUid"')
    expect(html.match(/<title>/g)).toHaveLength(1)
  })

  it('does not fetch an arbitrary owner-controlled avatar URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await expect(loadOpenGraphAvatar('https://127.0.0.1/private')).resolves.toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})

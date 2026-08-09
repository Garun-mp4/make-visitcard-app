import { afterEach, describe, expect, it, vi } from 'vitest'

import { telegram } from './telegram'

describe('telegram sharing', () => {
  afterEach(() => {
    window.Telegram = undefined
  })

  it('opens the Telegram share chooser with the card URL and description', () => {
    const openTelegramLink = vi.fn()
    window.Telegram = { WebApp: { openTelegramLink } }

    expect(
      telegram.shareUrl({
        title: 'Ada',
        text: 'Product designer',
        url: 'https://cardly.test/c/ada',
      }),
    ).toBe(true)

    const target = new URL(String(openTelegramLink.mock.calls[0]?.[0]))
    expect(`${target.origin}${target.pathname}`).toBe('https://t.me/share/url')
    expect(target.searchParams.get('url')).toBe('https://cardly.test/c/ada')
    expect(target.searchParams.get('text')).toBe('Product designer')
  })

  it('reports an unavailable chooser outside Telegram', () => {
    expect(telegram.shareUrl({ url: 'https://cardly.test/c/ada' })).toBe(false)
  })
})

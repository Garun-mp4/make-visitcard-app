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

  it('uses the native Telegram file download prompt for HTTPS files', async () => {
    const downloadFile = vi.fn(
      (_params: { url: string; file_name: string }, callback?: (accepted: boolean) => void) =>
        callback?.(true),
    )
    window.Telegram = { WebApp: { downloadFile } }

    await expect(
      telegram.downloadFile({
        url: 'https://cardly.test/api/public/cards/ada/qr.png',
        fileName: 'cardly-ada-qr.png',
      }),
    ).resolves.toBe('downloading')
    expect(downloadFile).toHaveBeenCalledWith(
      {
        url: 'https://cardly.test/api/public/cards/ada/qr.png',
        file_name: 'cardly-ada-qr.png',
      },
      expect.any(Function),
    )
  })

  it('does not claim a native download outside supported Telegram clients', async () => {
    await expect(
      telegram.downloadFile({
        url: 'https://cardly.test/api/public/cards/ada/qr.png',
        fileName: 'cardly-ada-qr.png',
      }),
    ).resolves.toBe('unsupported')
  })
})

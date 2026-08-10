import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { contactFileName, contactVCardUrl, downloadVCard } from './vcard'

const { telegramDownloadFile, telegramOpenLink, telegramState } = vi.hoisted(() => ({
  telegramDownloadFile: vi.fn(),
  telegramOpenLink: vi.fn(),
  telegramState: { available: false },
}))

vi.mock('./telegram', () => ({
  telegram: {
    get available() {
      return telegramState.available
    },
    downloadFile: telegramDownloadFile,
    openLink: telegramOpenLink,
  },
}))

describe('contact vCard actions', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 200,
          headers: { 'x-request-id': 'request-123' },
        }),
      ),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    telegramState.available = false
  })

  it('builds predictable endpoint and ASCII filename', () => {
    expect(contactFileName('alexey')).toBe('cardly-alexey.vcf')
    expect(contactVCardUrl('https://cardly.test/c/alexey', 'alexey')).toBe(
      'https://cardly.test/api/public/cards/alexey/contact.vcf',
    )
  })

  it('uses Telegram native download for the HTTPS vCard', async () => {
    telegramDownloadFile.mockResolvedValueOnce('downloading')

    await expect(
      downloadVCard('https://cardly.test/api/public/cards/alexey/contact.vcf', 'alexey'),
    ).resolves.toEqual({ state: 'downloading', requestId: 'request-123' })
    expect(telegramDownloadFile).toHaveBeenCalledWith({
      url: 'https://cardly.test/api/public/cards/alexey/contact.vcf',
      fileName: 'cardly-alexey.vcf',
    })
  })

  it('downloads from the HTTPS endpoint in a regular browser instead of a Blob URL', async () => {
    telegramDownloadFile.mockResolvedValueOnce('unsupported')
    let clicked: { href: string; download: string } | null = null
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked = { href: this.href, download: this.download }
    })

    await expect(
      downloadVCard('https://cardly.test/api/public/cards/alexey/contact.vcf', 'alexey'),
    ).resolves.toEqual({ state: 'opened', requestId: 'request-123' })
    expect(clicked).toEqual({
      href: 'https://cardly.test/api/public/cards/alexey/contact.vcf',
      download: 'cardly-alexey.vcf',
    })
  })

  it('opens the HTTPS endpoint in older Telegram clients', async () => {
    telegramState.available = true
    telegramDownloadFile.mockResolvedValueOnce('unsupported')

    await expect(
      downloadVCard('https://cardly.test/api/public/cards/alexey/contact.vcf', 'alexey'),
    ).resolves.toEqual({ state: 'opened', requestId: 'request-123' })
    expect(telegramOpenLink).toHaveBeenCalledWith(
      'https://cardly.test/api/public/cards/alexey/contact.vcf',
    )
  })

  it('returns the server request id when the endpoint rejects the download', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 404, headers: { 'x-request-id': 'request-failed' } }),
    )

    await expect(
      downloadVCard('https://cardly.test/api/public/cards/missing/contact.vcf', 'missing'),
    ).resolves.toEqual({ state: 'error', requestId: 'request-failed' })
  })
})

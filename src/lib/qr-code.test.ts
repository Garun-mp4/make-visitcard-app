import { afterEach, describe, expect, it, vi } from 'vitest'

import { downloadQrPng, qrPngUrl, shareQrPng, type QrPngAsset } from './qr-code'

const { telegramDownloadFile, telegramShareUrl } = vi.hoisted(() => ({
  telegramDownloadFile: vi.fn(),
  telegramShareUrl: vi.fn(),
}))

vi.mock('./telegram', () => ({
  telegram: {
    downloadFile: telegramDownloadFile,
    shareUrl: telegramShareUrl,
  },
}))

const asset: QrPngAsset = {
  dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
  file: new File([new Uint8Array([137, 80, 78, 71])], 'cardly-alexey-qr.png', {
    type: 'image/png',
  }),
}

describe('QR image actions', () => {
  afterEach(() => vi.restoreAllMocks())

  it('builds a same-origin HTTPS QR image endpoint', () => {
    expect(qrPngUrl('https://cardly.test/c/ada', 'ada')).toBe(
      'https://cardly.test/api/public/cards/ada/qr.png',
    )
  })

  it('uses Telegram native download instead of a blocked data URL in Mini Apps', async () => {
    telegramDownloadFile.mockResolvedValueOnce('downloading')

    await expect(
      downloadQrPng(asset, 'https://cardly.test/api/public/cards/alexey/qr.png'),
    ).resolves.toBe('downloading')
    expect(telegramDownloadFile).toHaveBeenCalledWith({
      url: 'https://cardly.test/api/public/cards/alexey/qr.png',
      fileName: 'cardly-alexey-qr.png',
    })
  })

  it('downloads the generated QR as a PNG image', async () => {
    let clicked: { download: string; href: string } | null = null
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked = { download: this.download, href: this.href }
    })

    await downloadQrPng(asset)

    expect(clicked).toEqual({
      download: 'cardly-alexey-qr.png',
      href: asset.dataUrl,
    })
  })

  it('shares the QR PNG file through the system share sheet', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    })
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })

    await expect(
      shareQrPng(asset, { title: 'Ada', text: 'https://cardly.test/c/ada' }),
    ).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith({
      files: [asset.file],
      title: 'Ada',
      text: 'https://cardly.test/c/ada',
    })
  })

  it('reports unsupported file sharing without replacing the QR with a link', async () => {
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    })
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() })

    await expect(shareQrPng(asset, { title: 'Ada' })).resolves.toBe('unsupported')
  })

  it('opens the Telegram chooser when its WebView cannot share PNG files', async () => {
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    })
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() })
    telegramShareUrl.mockReturnValueOnce(true)

    await expect(
      shareQrPng(asset, {
        title: 'Ada',
        text: 'Digital business card',
        url: 'https://cardly.test/c/ada',
      }),
    ).resolves.toBe('shared')
    expect(telegramShareUrl).toHaveBeenCalledWith({
      title: 'Ada',
      text: 'Digital business card',
      url: 'https://cardly.test/c/ada',
    })
  })
})

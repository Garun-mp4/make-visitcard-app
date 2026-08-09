import { afterEach, describe, expect, it, vi } from 'vitest'

import { downloadQrPng, shareQrPng, type QrPngAsset } from './qr-code'

const asset: QrPngAsset = {
  dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
  file: new File([new Uint8Array([137, 80, 78, 71])], 'cardly-alexey-qr.png', {
    type: 'image/png',
  }),
}

describe('QR image actions', () => {
  afterEach(() => vi.restoreAllMocks())

  it('downloads the generated QR as a PNG image', () => {
    let clicked: { download: string; href: string } | null = null
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked = { download: this.download, href: this.href }
    })

    downloadQrPng(asset)

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
})

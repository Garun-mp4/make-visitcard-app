import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { QrPngAsset } from '@/lib/qr-code'
import { QrCodeDialog } from './qr-code-dialog'

const { createQrPngAsset, downloadQrPng, shareQrPng, notify } = vi.hoisted(() => ({
  createQrPngAsset: vi.fn(),
  downloadQrPng: vi.fn(),
  shareQrPng: vi.fn(),
  notify: vi.fn(),
}))

vi.mock('@/lib/qr-code', () => ({
  createQrPngAsset,
  downloadQrPng,
  shareQrPng,
  qrPngFileName: (slug: string) => `cardly-${slug}-qr.png`,
}))
vi.mock('@/components/feedback/feedback-provider', () => ({
  useFeedback: () => ({ notify, revealLink: vi.fn() }),
}))

const asset: QrPngAsset = {
  dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
  file: new File(['png'], 'cardly-alexey-qr.png', { type: 'image/png' }),
}

describe('QrCodeDialog', () => {
  it('shows a real QR and downloads its prepared PNG', async () => {
    createQrPngAsset.mockResolvedValue(asset)
    render(
      <QrCodeDialog
        open
        value="https://cardly.test/c/alexey"
        slug="alexey"
        ownerName="Алексей Волков"
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'QR-код визитки' })).toBeInTheDocument()
    expect(screen.getByTitle('QR-код визитки')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Скачать PNG' })).toBeEnabled())

    await userEvent.setup().click(screen.getByRole('button', { name: 'Скачать PNG' }))
    expect(downloadQrPng).toHaveBeenCalledWith(asset)
  })

  it('shares the QR image file instead of sharing only its URL', async () => {
    createQrPngAsset.mockResolvedValue(asset)
    shareQrPng.mockResolvedValue('shared')
    render(
      <QrCodeDialog
        open
        value="https://cardly.test/c/alexey"
        slug="alexey"
        ownerName="Алексей Волков"
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => expect(screen.getByRole('button', { name: 'Поделиться QR' })).toBeEnabled())
    await userEvent.setup().click(screen.getByRole('button', { name: 'Поделиться QR' }))

    expect(shareQrPng).toHaveBeenCalledWith(asset, {
      title: 'QR-код · Алексей Волков',
      text: 'https://cardly.test/c/alexey',
    })
  })
})

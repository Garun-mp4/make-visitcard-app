import { fireEvent, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { demoCard } from '@shared/demo-data'
import BasicEditorPage from './basic-editor-page'

const { updateCard, uploadCardImage } = vi.hoisted(() => ({
  updateCard: vi.fn(),
  uploadCardImage: vi.fn(),
}))

vi.mock('@/app/card-store', () => ({
  useCardStore: () => ({ card: demoCard, updateCard }),
}))

vi.mock('@/features/editor/editor-shell', () => ({
  EditorShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('@/services/image-upload-service', () => ({
  uploadCardImage,
}))

describe('BasicEditorPage image upload', () => {
  beforeEach(() => {
    updateCard.mockReset()
    uploadCardImage.mockReset()
    uploadCardImage.mockResolvedValue('https://images.example/avatar.webp')
  })

  it('uploads an avatar to Blob before writing its public URL into the draft', async () => {
    const { container } = render(<BasicEditorPage />)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    const file = new File(['avatar'], 'avatar.webp', { type: 'image/webp' })

    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() =>
      expect(uploadCardImage).toHaveBeenCalledWith(
        demoCard.ownerUid,
        file,
        'avatar',
        expect.any(Function),
      ),
    )
    await waitFor(() => expect(updateCard).toHaveBeenCalledTimes(1))
    const updater = updateCard.mock.calls[0][0] as (card: typeof demoCard) => typeof demoCard
    expect(updater(demoCard).profile.avatarUrl).toBe('https://images.example/avatar.webp')
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'

import { setApiSessionToken } from './api-client'
import { uploadCardImage } from './image-upload-service'

const { blobUpload } = vi.hoisted(() => ({
  blobUpload: vi.fn(),
}))

vi.mock('@vercel/blob/client', () => ({ upload: blobUpload }))

describe('uploadCardImage', () => {
  afterEach(() => {
    setApiSessionToken(null)
    blobUpload.mockReset()
  })

  it('authenticates the Blob token request with the in-memory Telegram session', async () => {
    blobUpload.mockResolvedValue({ url: 'https://store.blob.vercel-storage.com/project.webp' })
    setApiSessionToken('signed-telegram-session')
    const file = new File(['cover'], 'project.webp', { type: 'image/webp' })

    await expect(uploadCardImage('telegram:42', file, 'project')).resolves.toBe(
      'https://store.blob.vercel-storage.com/project.webp',
    )

    expect(blobUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^users\/telegram:42\/project\/.+\.webp$/),
      file,
      expect.objectContaining({
        handleUploadUrl: '/api/images/upload',
        headers: { Authorization: 'Bearer signed-telegram-session' },
      }),
    )
  })
})

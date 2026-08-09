import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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

  it('allows both the Blob API and storage hosts in the production CSP', () => {
    const vercelConfig = JSON.parse(
      readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'),
    ) as {
      headers: Array<{ headers: Array<{ key: string; value: string }> }>
    }
    const csp = vercelConfig.headers
      .flatMap((rule) => rule.headers)
      .find((header) => header.key === 'Content-Security-Policy')?.value

    expect(csp).toContain("connect-src 'self' https://vercel.com")
    expect(csp).toContain('https://*.blob.vercel-storage.com')
  })
})

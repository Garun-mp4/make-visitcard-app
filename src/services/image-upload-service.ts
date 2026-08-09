import { upload } from '@vercel/blob/client'

import { clientEnv } from '@/config/client-env'
import { apiRequest, getApiSessionHeaders } from '@/services/api-client'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxBytes = 5 * 1024 * 1024

export function validateImage(file: File): void {
  if (!allowedTypes.has(file.type)) throw new Error('Поддерживаются JPG, PNG и WebP')
  if (file.size > maxBytes) throw new Error('Размер изображения не должен превышать 5 МБ')
}

export async function uploadCardImage(
  uid: string,
  file: File,
  kind: 'avatar' | 'project',
  onProgress?: (percent: number) => void,
): Promise<string> {
  validateImage(file)
  if (clientEnv.demoMode) return URL.createObjectURL(file)
  const extension = file.type.split('/')[1]
  const pathname = `users/${uid}/${kind}/${crypto.randomUUID()}.${extension}`
  const blob = await upload(pathname, file, {
    access: 'public',
    handleUploadUrl: '/api/images/upload',
    clientPayload: JSON.stringify({ kind }),
    contentType: file.type,
    headers: getApiSessionHeaders(),
    onUploadProgress: ({ percentage }) => onProgress?.(Math.round(percentage)),
  })
  return blob.url
}

export async function deleteCardImage(pathOrUrl: string): Promise<void> {
  if (clientEnv.demoMode && pathOrUrl.startsWith('blob:')) {
    URL.revokeObjectURL(pathOrUrl)
    return
  }
  await apiRequest('/api/images/delete', {
    method: 'POST',
    body: JSON.stringify({ url: pathOrUrl }),
  })
}

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from 'firebase/storage'

import { clientEnv } from '@/config/client-env'
import { getFirebaseServices } from '@/services/firebase-client'

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
  const path = `users/${uid}/${kind}/${crypto.randomUUID()}.${extension}`
  const task = uploadBytesResumable(ref(getFirebaseServices().storage, path), file, {
    contentType: file.type,
    cacheControl: 'public,max-age=31536000,immutable',
  })
  const snapshot = await new Promise<UploadTaskSnapshot>((resolve, reject) => {
    task.on(
      'state_changed',
      (state) => onProgress?.(Math.round((state.bytesTransferred / state.totalBytes) * 100)),
      reject,
      () => resolve(task.snapshot),
    )
  })
  return getDownloadURL(snapshot.ref)
}

export async function deleteCardImage(pathOrUrl: string): Promise<void> {
  if (clientEnv.demoMode && pathOrUrl.startsWith('blob:')) {
    URL.revokeObjectURL(pathOrUrl)
    return
  }
  await deleteObject(ref(getFirebaseServices().storage, pathOrUrl))
}

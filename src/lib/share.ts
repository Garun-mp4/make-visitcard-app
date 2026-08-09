import { copyText } from '@/lib/utils'

export type ShareResult = 'shared' | 'copied' | 'manual' | 'cancelled'

export async function shareOrCopy(data: ShareData, copy = copyText): Promise<ShareResult> {
  if (navigator.share) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') return 'cancelled'
      // Telegram Web may expose navigator.share while denying it in the iframe.
    }
  }
  return (await copy(data.url ?? data.text ?? '')) ? 'copied' : 'manual'
}

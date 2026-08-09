import { copyText } from '@/lib/utils'
import { telegram } from '@/lib/telegram'

export type ShareResult = 'shared' | 'telegram' | 'copied' | 'manual' | 'cancelled'

export async function shareOrCopy(
  data: ShareData,
  copy = copyText,
  shareInTelegram = telegram.shareUrl,
): Promise<ShareResult> {
  let canUseNativeShare = typeof navigator.share === 'function'
  if (canUseNativeShare && typeof navigator.canShare === 'function') {
    try {
      canUseNativeShare = navigator.canShare(data)
    } catch {
      canUseNativeShare = false
    }
  }

  if (canUseNativeShare) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') return 'cancelled'
      // Telegram Web may expose navigator.share while denying it in the iframe.
    }
  }
  if (shareInTelegram(data)) return 'telegram'
  return (await copy(data.url ?? data.text ?? '')) ? 'copied' : 'manual'
}

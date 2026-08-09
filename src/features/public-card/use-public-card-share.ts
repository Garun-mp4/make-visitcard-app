import { useCallback } from 'react'

import type { CardView } from '@shared/types'
import { useFeedback } from '@/components/feedback/feedback-provider'
import { useLocaleText } from '@/i18n/use-locale-text'
import { shareOrCopy } from '@/lib/share'
import { telegram } from '@/lib/telegram'
import { recordPublicEvent } from '@/services/public-analytics'

export function usePublicCardShare({
  card,
  publicUrl,
  analyticsEnabled,
  onShare,
}: {
  card: CardView
  publicUrl: string
  analyticsEnabled: boolean
  onShare?: () => void
}) {
  const feedback = useFeedback()
  const text = useLocaleText()

  return useCallback(async () => {
    onShare?.()
    const result = await shareOrCopy({
      title: card.profile.displayName,
      text: card.profile.profession,
      url: publicUrl,
    })
    if (result === 'cancelled') return
    if (analyticsEnabled) recordPublicEvent(card.publication.slug, 'share', 'share')
    if (result === 'manual')
      feedback.revealLink(text('Поделиться визиткой', 'Share business card'), publicUrl)
    else
      feedback.notify(
        result === 'copied'
          ? text('Ссылка скопирована', 'Link copied')
          : text('Окно отправки открыто', 'Share dialog opened'),
        'success',
      )
    telegram.notify('success')
  }, [analyticsEnabled, card, feedback, onShare, publicUrl, text])
}

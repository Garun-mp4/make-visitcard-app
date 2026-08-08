import { Bookmark, ContactRound, QrCode, Share2 } from 'lucide-react'

import type { CardView } from '@shared/types'
import { IconButton } from '@/components/ui/icon-button'
import { copyText } from '@/lib/utils'
import { downloadVCard } from '@/lib/vcard'
import { telegram } from '@/lib/telegram'
import { useFeedback } from '@/components/feedback/feedback-provider'
import { shareOrCopy } from '@/lib/share'
import { recordPublicEvent } from '@/services/public-analytics'
import { useLocaleText } from '@/i18n/use-locale-text'

export function PublicActions({
  card,
  onShare,
  analyticsEnabled = true,
  publicUrl = window.location.href,
}: {
  card: CardView
  onShare?: () => void
  analyticsEnabled?: boolean
  publicUrl?: string
}) {
  const feedback = useFeedback()
  const text = useLocaleText()
  const share = async () => {
    onShare?.()
    if (analyticsEnabled) recordPublicEvent(card.publication.slug, 'share')
    const result = await shareOrCopy({
      title: card.profile.displayName,
      text: card.profile.profession,
      url: publicUrl,
    })
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
  }
  const hasContact = card.links.some(
    (link) =>
      link.enabled && link.public && ['phone', 'email', 'website', 'telegram'].includes(link.type),
  )
  return (
    <div className="flex gap-2">
      <IconButton
        aria-label={text('Сохранить визитку', 'Save business card')}
        onClick={() =>
          void copyText(publicUrl).then((copied) =>
            copied
              ? feedback.notify(text('Ссылка скопирована', 'Link copied'), 'success')
              : feedback.revealLink(text('Ссылка на визитку', 'Business card link'), publicUrl),
          )
        }
      >
        <Bookmark size={18} aria-hidden="true" />
      </IconButton>
      <IconButton aria-label={text('Поделиться', 'Share')} onClick={() => void share()}>
        <Share2 size={18} aria-hidden="true" />
      </IconButton>
      <IconButton
        aria-label={text('Показать QR-код', 'Show QR code')}
        onClick={() => document.getElementById('public-qr')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <QrCode size={18} aria-hidden="true" />
      </IconButton>
      {hasContact ? (
        <IconButton
          aria-label={text('Сохранить контакт', 'Save contact')}
          onClick={() => {
            try {
              downloadVCard(card)
              feedback.notify(text('Контакт скачан', 'Contact downloaded'), 'success')
            } catch {
              feedback.notify(text('Не удалось скачать контакт', 'Download failed'), 'error')
            }
          }}
        >
          <ContactRound size={18} aria-hidden="true" />
        </IconButton>
      ) : null}
    </div>
  )
}

import { Bookmark, QrCode, Share2 } from 'lucide-react'

import type { CardView } from '@shared/types'
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
  variant = 'clean',
}: {
  card: CardView
  onShare?: () => void
  analyticsEnabled?: boolean
  publicUrl?: string
  variant?: 'clean' | 'dark' | 'editorial'
}) {
  const feedback = useFeedback()
  const text = useLocaleText()
  const share = async () => {
    onShare?.()
    if (analyticsEnabled) recordPublicEvent(card.publication.slug, 'share', 'share')
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
  const save = () => {
    try {
      downloadVCard(card)
      feedback.notify(text('Контакт скачан', 'Contact downloaded'), 'success')
    } catch {
      void copyText(publicUrl).then((copied) =>
        copied
          ? feedback.notify(text('Ссылка скопирована', 'Link copied'), 'success')
          : feedback.revealLink(text('Ссылка на визитку', 'Business card link'), publicUrl),
      )
    }
  }

  if (variant === 'editorial')
    return (
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.1em] text-[#6c5a48]">
        <button onClick={save}>{text('Сохранить', 'Save')}</button>
        <span aria-hidden="true">·</span>
        <button onClick={() => void share()}>{text('Поделиться', 'Share')}</button>
      </div>
    )

  const round = variant === 'dark'
  return (
    <div className="flex gap-2">
      <button
        aria-label={text('Сохранить визитку', 'Save business card')}
        onClick={save}
        className={`grid size-10 place-items-center border ${round ? 'rounded-full border-[#3a3f37] text-[#d9ded5]' : 'rounded-[10px] border-[#e1e4de] bg-white text-[#444a42]'}`}
      >
        <Bookmark size={18} aria-hidden="true" />
      </button>
      <button
        aria-label={text('Поделиться', 'Share')}
        onClick={() => void share()}
        className={`grid size-10 place-items-center border ${round ? 'rounded-full border-[#3a3f37] text-[#d9ded5]' : 'rounded-[10px] border-[#e1e4de] bg-white text-[#444a42]'}`}
      >
        <Share2 size={18} aria-hidden="true" />
      </button>
      {!round ? (
        <button
          aria-label={text('Показать QR-код', 'Show QR code')}
          onClick={() => feedback.revealLink(text('QR-код визитки', 'Business card QR'), publicUrl)}
          className="grid size-10 place-items-center rounded-[10px] border border-[#e1e4de] bg-white text-[#444a42]"
        >
          <QrCode size={18} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

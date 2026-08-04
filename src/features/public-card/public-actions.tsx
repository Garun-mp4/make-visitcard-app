import { Bookmark, ContactRound, QrCode, Share2 } from 'lucide-react'

import type { CardDraft } from '@shared/types'
import { IconButton } from '@/components/ui/icon-button'
import { copyText } from '@/lib/utils'
import { downloadVCard } from '@/lib/vcard'
import { telegram } from '@/lib/telegram'

export function PublicActions({ card, onShare }: { card: CardDraft; onShare?: () => void }) {
  const publicUrl = window.location.href
  const share = async () => {
    onShare?.()
    if (navigator.share) {
      await navigator
        .share({ title: card.profile.displayName, text: card.profile.profession, url: publicUrl })
        .catch(() => undefined)
    } else {
      await copyText(publicUrl)
      telegram.notify('success')
    }
  }
  const hasContact = card.links.some(
    (link) =>
      link.enabled && link.public && ['phone', 'email', 'website', 'telegram'].includes(link.type),
  )
  return (
    <div className="flex gap-2">
      <IconButton aria-label="Сохранить визитку" onClick={() => void copyText(publicUrl)}>
        <Bookmark size={18} aria-hidden="true" />
      </IconButton>
      <IconButton aria-label="Поделиться" onClick={() => void share()}>
        <Share2 size={18} aria-hidden="true" />
      </IconButton>
      <IconButton
        aria-label="Показать QR-код"
        onClick={() => document.getElementById('public-qr')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <QrCode size={18} aria-hidden="true" />
      </IconButton>
      {hasContact ? (
        <IconButton aria-label="Сохранить контакт" onClick={() => downloadVCard(card)}>
          <ContactRound size={18} aria-hidden="true" />
        </IconButton>
      ) : null}
    </div>
  )
}

import { QrCode, Share2, UserRoundPlus } from 'lucide-react'
import { useState } from 'react'

import type { CardView } from '@shared/types'
import { ContactSaveButton } from '@/components/contact/contact-save-button'
import { QrCodeDialog } from '@/components/qr/qr-code-dialog'
import { useLocaleText } from '@/i18n/use-locale-text'
import { usePublicCardShare } from '@/features/public-card/use-public-card-share'
import { recordPublicEvent } from '@/services/public-analytics'

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
  const text = useLocaleText()
  const [qrOpen, setQrOpen] = useState(false)
  const share = usePublicCardShare({ card, publicUrl, analyticsEnabled, onShare })
  const qrDialog = (
    <QrCodeDialog
      open={qrOpen}
      value={publicUrl}
      slug={card.publication.slug}
      ownerName={card.profile.displayName}
      onClose={() => setQrOpen(false)}
      onShared={() => {
        if (analyticsEnabled) recordPublicEvent(card.publication.slug, 'share', 'qr')
      }}
    />
  )

  if (variant === 'editorial')
    return (
      <>
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.1em] text-[#6c5a48]">
          <ContactSaveButton
            card={card}
            publicUrl={publicUrl}
            className="inline-flex min-h-11 items-center"
            onOpen={() => {
              if (analyticsEnabled)
                recordPublicEvent(card.publication.slug, 'contact_save', 'vcard')
            }}
          >
            {text('Сохранить контакт', 'Save contact')}
          </ContactSaveButton>
          <span aria-hidden="true">·</span>
          <button onClick={() => void share()}>{text('Поделиться', 'Share')}</button>
        </div>
        {qrDialog}
      </>
    )

  const round = variant === 'dark'
  return (
    <>
      <div className="flex gap-2">
        <ContactSaveButton
          card={card}
          publicUrl={publicUrl}
          className={`grid size-11 place-items-center border ${round ? 'rounded-full border-[#3a3f37] text-[#d9ded5]' : 'rounded-[10px] border-[#e1e4de] bg-white text-[#444a42]'}`}
          onOpen={() => {
            if (analyticsEnabled) recordPublicEvent(card.publication.slug, 'contact_save', 'vcard')
          }}
        >
          <UserRoundPlus size={18} aria-hidden="true" />
        </ContactSaveButton>
        <button
          aria-label={text('Поделиться', 'Share')}
          onClick={() => void share()}
          className={`grid size-11 place-items-center border ${round ? 'rounded-full border-[#3a3f37] text-[#d9ded5]' : 'rounded-[10px] border-[#e1e4de] bg-white text-[#444a42]'}`}
        >
          <Share2 size={18} aria-hidden="true" />
        </button>
        {!round ? (
          <button
            aria-label={text('Показать QR-код', 'Show QR code')}
            onClick={() => setQrOpen(true)}
            className="grid size-11 place-items-center rounded-[10px] border border-[#e1e4de] bg-white text-[#444a42]"
          >
            <QrCode size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {qrDialog}
    </>
  )
}

import { useState, type ReactNode } from 'react'

import type { CardView } from '@shared/types'
import { ContactSaveDialog } from './contact-save-dialog'
import { useLocaleText } from '@/i18n/use-locale-text'

export function ContactSaveButton({
  card,
  publicUrl,
  className,
  children,
  onOpen,
}: {
  card: CardView
  publicUrl?: string
  className?: string
  children: ReactNode
  onOpen?: () => void
}) {
  const l = useLocaleText()
  const [open, setOpen] = useState(false)
  const label = l('Сохранить контакт', 'Save contact')
  const resolvedPublicUrl = publicUrl ?? window.location.href

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        className={className}
        onClick={() => {
          onOpen?.()
          setOpen(true)
        }}
      >
        {children}
      </button>
      <ContactSaveDialog
        card={card}
        publicUrl={resolvedPublicUrl}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

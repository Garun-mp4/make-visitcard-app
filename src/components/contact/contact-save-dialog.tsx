import { ExternalLink, Mail, Phone, RefreshCw, Send, UserRoundPlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { CardLink, CardView } from '@shared/types'
import { contactDisplayValue, formatContactText, publicContactLinks } from '@shared/vcard'
import { useFeedback } from '@/components/feedback/feedback-provider'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useLocaleText } from '@/i18n/use-locale-text'
import { copyText } from '@/lib/utils'
import {
  contactFileName,
  contactVCardUrl,
  downloadVCard,
  type ContactDownloadResult,
} from '@/lib/vcard'

function ContactIcon({ type }: { type: CardLink['type'] }) {
  if (type === 'phone') return <Phone size={17} aria-hidden="true" />
  if (type === 'email') return <Mail size={17} aria-hidden="true" />
  if (type === 'telegram') return <Send size={17} aria-hidden="true" />
  return <ExternalLink size={17} aria-hidden="true" />
}

export function ContactSaveDialog({
  card,
  publicUrl,
  open,
  onClose,
}: {
  card: CardView
  publicUrl: string
  open: boolean
  onClose(): void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const manualTextRef = useRef<HTMLTextAreaElement>(null)
  const l = useLocaleText()
  const { i18n } = useTranslation()
  const feedback = useFeedback()
  const links = publicContactLinks(card)
  const locale = i18n.language.startsWith('en') ? 'en' : 'ru'
  const contactText = formatContactText(card, publicUrl, locale)
  const [downloading, setDownloading] = useState(false)
  const [manualCopy, setManualCopy] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  useEffect(() => {
    if (!manualCopy) return
    manualTextRef.current?.focus()
    manualTextRef.current?.select()
  }, [manualCopy])

  const close = () => {
    setManualCopy(false)
    setFailed(false)
    onClose()
    window.setTimeout(() => returnFocusRef.current?.focus(), 0)
  }

  const handleResult = (result: ContactDownloadResult) => {
    if (result === 'cancelled') return
    if (result === 'downloading') {
      feedback.notify(
        l(
          `Скачивание контакта началось. Откройте ${contactFileName(card.publication.slug)}`,
          `Contact download started. Open ${contactFileName(card.publication.slug)}`,
        ),
        'success',
      )
      close()
      return
    }
    if (result === 'opened') {
      feedback.notify(l('Открываем контакт', 'Opening contact'), 'success')
      close()
      return
    }
    setFailed(true)
  }

  const addContact = async () => {
    setDownloading(true)
    setFailed(false)
    const endpoint = contactVCardUrl(publicUrl, card.publication.slug)
    const result = await downloadVCard(endpoint, card.publication.slug)
    setDownloading(false)
    handleResult(result)
  }

  const copy = async () => {
    if (await copyText(contactText)) {
      feedback.notify(l('Данные контакта скопированы', 'Contact details copied'), 'success')
      return
    }
    setManualCopy(true)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cardly-contact-title"
      className="surface m-0 mt-auto max-h-[calc(100dvh-var(--tg-safe-top)-12px)] w-full max-w-none overflow-y-auto rounded-t-3xl border border-[var(--border)] p-0 text-[var(--text-primary)] shadow-[var(--shadow-modal)] backdrop:bg-[#10120fa6] md:m-auto md:max-w-[480px] md:rounded-2xl"
      onCancel={(event) => {
        event.preventDefault()
        if (!downloading) close()
      }}
      onClose={() => {
        if (open) onClose()
      }}
    >
      <div className="grid gap-5 px-[max(20px,var(--tg-content-safe-left))] pb-[max(20px,var(--tg-content-safe-bottom))] pt-5">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <UserRoundPlus size={21} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="cardly-contact-title" className="heading-font m-0 text-xl">
                {l('Сохранить контакт', 'Save contact')}
              </h2>
              <p className="mb-0 mt-1 text-sm text-[var(--text-secondary)]">
                {l('Проверьте данные перед добавлением.', 'Review the details before adding.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={l('Закрыть', 'Close')}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
            disabled={downloading}
            onClick={close}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <section className="grid gap-4 rounded-2xl border border-[var(--border)] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name={card.profile.displayName}
              src={card.profile.avatarUrl || undefined}
              size="md"
            />
            <div className="min-w-0">
              <p className="m-0 truncate font-semibold">{card.profile.displayName}</p>
              {card.profile.profession ? (
                <p className="mb-0 mt-0.5 truncate text-sm text-[var(--text-secondary)]">
                  {card.profile.profession}
                </p>
              ) : null}
            </div>
          </div>

          {links.length ? (
            <ul className="m-0 grid list-none gap-2 border-t border-[var(--border)] p-0 pt-3">
              {links.map((link) => (
                <li key={link.id} className="flex min-w-0 items-center gap-2.5 text-sm">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-secondary)] text-[var(--accent)]">
                    <ContactIcon type={link.type} />
                  </span>
                  <span className="min-w-0 truncate">{contactDisplayValue(link)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 border-t border-[var(--border)] pt-3 text-sm text-[var(--text-secondary)]">
              {l(
                'Сохраним имя, профессию и ссылку на визитку.',
                'We will save the name, profession, and business card link.',
              )}
            </p>
          )}
        </section>

        <ol className="m-0 grid grid-cols-3 list-none gap-2 p-0 text-center text-[11px] text-[var(--text-secondary)]">
          {[
            l('Предпросмотр', 'Preview'),
            l('Системное окно', 'System dialog'),
            l('Контакт', 'Contact'),
          ].map((label, index) => (
            <li key={label} className="grid min-w-0 gap-1.5">
              <span className="mx-auto grid size-6 place-items-center rounded-full border border-[var(--accent)] text-[var(--accent)]">
                {index + 1}
              </span>
              <span className="truncate">{label}</span>
            </li>
          ))}
        </ol>

        {failed ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning)]"
          >
            <span>{l('Не удалось открыть контакт.', 'Could not open the contact.')}</span>
            <button
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold"
              onClick={() => void addContact()}
            >
              <RefreshCw size={15} aria-hidden="true" />
              {l('Повторить', 'Retry')}
            </button>
          </div>
        ) : null}

        {manualCopy ? (
          <label className="grid gap-2 text-sm font-medium">
            {l('Данные контакта', 'Contact details')}
            <textarea
              ref={manualTextRef}
              aria-label={l('Данные контакта', 'Contact details')}
              readOnly
              value={contactText}
              rows={7}
              className="min-h-32 w-full resize-y rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] p-3 font-normal text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              onFocus={(event) => event.currentTarget.select()}
            />
            <span className="font-normal text-[var(--text-secondary)]">
              {l('Выделите и скопируйте текст вручную.', 'Select and copy the text manually.')}
            </span>
          </label>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            fullWidth
            disabled={downloading}
            aria-busy={downloading}
            onClick={() => void addContact()}
          >
            <UserRoundPlus size={18} aria-hidden="true" />
            {downloading
              ? l('Открываем…', 'Opening…')
              : l('Добавить в контакты', 'Add to contacts')}
          </Button>
          <Button fullWidth variant="secondary" disabled={downloading} onClick={() => void copy()}>
            {l('Скопировать данные', 'Copy details')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}

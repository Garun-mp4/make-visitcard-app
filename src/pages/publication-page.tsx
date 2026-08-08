import { AlertTriangle, Copy, Download, Share2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'

import { slugSchema } from '@shared/schemas'
import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { EditorShell } from '@/features/editor/editor-shell'
import { copyText } from '@/lib/utils'
import { clientEnv } from '@/config/client-env'
import { apiRequest } from '@/services/api-client'
import { useFeedback } from '@/components/feedback/feedback-provider'
import { shareOrCopy } from '@/lib/share'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useLocaleText } from '@/i18n/use-locale-text'

type SlugState = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid' | 'error'

export default function PublicationPage() {
  const { card, updateCard } = useCardStore()
  const feedback = useFeedback()
  const l = useLocaleText()
  const [slugState, setSlugState] = useState<SlugState>('idle')
  const [busy, setBusy] = useState(false)
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)
  const timer = useRef<number | null>(null)
  const slug = card.publication.slug
  const publicUrl = `${window.location.origin}/c/${slug}`
  const telegramUrl = `https://t.me/${clientEnv.telegramBotUsername || 'cardly_bot'}/${clientEnv.telegramAppShortName || 'app'}?startapp=${slug}`

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    const parsed = slugSchema.safeParse(slug)
    if (!parsed.success) {
      setSlugState('invalid')
      return
    }
    setSlugState('checking')
    timer.current = window.setTimeout(() => void checkSlug(), 450)
    const checkSlug = async () => {
      try {
        if (!clientEnv.demoMode) {
          const result = await apiRequest<{ available: boolean }>('/api/slugs/check', {
            method: 'POST',
            body: JSON.stringify({ slug }),
          })
          setSlugState(result.available ? 'available' : 'unavailable')
        } else setSlugState('available')
      } catch {
        setSlugState('error')
      }
    }
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [slug])

  const publish = async () => {
    if (slugState !== 'available') return
    setBusy(true)
    try {
      if (!clientEnv.demoMode)
        await apiRequest('/api/cards/publish', { method: 'POST', body: JSON.stringify({ slug }) })
      updateCard((current) => ({
        ...current,
        onboardingCompleted: true,
        publication: {
          ...current.publication,
          published: true,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        lastPublishedAt: new Date().toISOString(),
      }))
      feedback.notify(l('Визитка опубликована', 'Card published'), 'success')
    } catch {
      feedback.notify(l('Не удалось опубликовать визитку', 'Could not publish the card'), 'error')
    } finally {
      setBusy(false)
    }
  }
  const unpublish = async () => {
    setBusy(true)
    try {
      if (!clientEnv.demoMode)
        await apiRequest('/api/cards/unpublish', { method: 'POST', body: '{}' })
      updateCard((current) => ({
        ...current,
        publication: {
          ...current.publication,
          published: false,
          updatedAt: new Date().toISOString(),
        },
      }))
      setConfirmUnpublish(false)
      feedback.notify(l('Визитка снята с публикации', 'Card unpublished'), 'success')
    } catch {
      feedback.notify(
        l('Не удалось снять визитку с публикации', 'Could not unpublish the card'),
        'error',
      )
    } finally {
      setBusy(false)
    }
  }
  const downloadQr = () => {
    const svg = document.getElementById('publication-qr')
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cardly-${slug}-qr.svg`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    feedback.notify(l('QR-код скачан', 'QR code downloaded'), 'success')
  }

  return (
    <EditorShell title={l('Публикация', 'Publication')}>
      <div>
        {card.publication.published ? (
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--success)]">
            {l('Опубликовано', 'Published')}
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-[var(--surface-secondary)] px-3 py-2 text-xs">
            {l('Не опубликовано', 'Not published')}
          </span>
        )}
      </div>
      <label className="field-group">
        <span className="field-label">{l('Адрес визитки', 'Card address')}</span>
        <div className="field-control flex items-center gap-1">
          <span className="text-[var(--text-muted)]">cardly.me/</span>
          <input
            className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
            value={slug}
            onChange={(event) =>
              updateCard((current) => ({
                ...current,
                publication: { ...current.publication, slug: event.target.value.toLowerCase() },
              }))
            }
          />
        </div>
        <span
          className={`helper-text ${slugState === 'available' ? '!text-[var(--success)]' : slugState === 'unavailable' || slugState === 'invalid' ? '!text-[var(--error)]' : ''}`}
        >
          {
            {
              idle: '',
              checking: l('Проверяем адрес…', 'Checking address…'),
              available: l('Адрес свободен', 'Address is available'),
              unavailable: l('Адрес уже занят', 'Address is taken'),
              invalid: l('Проверьте формат адреса', 'Check the address format'),
              error: l('Не удалось проверить адрес', 'Could not check the address'),
            }[slugState]
          }
        </span>
      </label>
      {card.publication.published ? (
        <>
          <div className="surface flex min-h-14 items-center justify-between rounded-xl px-3">
            <span className="min-w-0 truncate text-sm">{publicUrl}</span>
            <button
              aria-label={l('Скопировать HTTPS ссылку', 'Copy HTTPS link')}
              className="grid size-11 place-items-center text-[var(--accent)]"
              onClick={() =>
                void copyText(publicUrl).then((copied) =>
                  copied
                    ? feedback.notify(l('HTTPS-ссылка скопирована', 'HTTPS link copied'), 'success')
                    : feedback.revealLink('HTTPS-ссылка', publicUrl),
                )
              }
            >
              <Copy size={19} />
            </button>
          </div>
          <div className="surface flex min-h-14 items-center justify-between rounded-xl px-3">
            <span className="min-w-0 truncate text-sm">{telegramUrl}</span>
            <button
              aria-label={l('Скопировать Telegram ссылку', 'Copy Telegram link')}
              className="grid size-11 place-items-center text-[var(--accent)]"
              onClick={() =>
                void copyText(telegramUrl).then((copied) =>
                  copied
                    ? feedback.notify(
                        l('Telegram-ссылка скопирована', 'Telegram link copied'),
                        'success',
                      )
                    : feedback.revealLink('Telegram-ссылка', telegramUrl),
                )
              }
            >
              <Copy size={19} />
            </button>
          </div>
          <div className="grid grid-cols-[150px_1fr] gap-4">
            <div className="surface grid aspect-square place-items-center rounded-2xl p-3">
              <QRCodeSVG
                id="publication-qr"
                value={publicUrl}
                size={126}
                level="M"
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#183d2e"
              />
            </div>
            <div className="grid content-center gap-2">
              <Button variant="secondary" onClick={downloadQr}>
                <Download size={17} />
                {l('Скачать QR', 'Download QR')}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  void shareOrCopy({ title: card.profile.displayName, url: publicUrl }).then(
                    (result) =>
                      result === 'copied'
                        ? feedback.notify(l('Ссылка скопирована', 'Link copied'), 'success')
                        : result === 'manual'
                          ? feedback.revealLink(
                              l('Поделиться визиткой', 'Share business card'),
                              publicUrl,
                            )
                          : feedback.notify(
                              l('Окно отправки открыто', 'Share dialog opened'),
                              'success',
                            ),
                  )
                }
              >
                <Share2 size={17} />
                {l('Поделиться', 'Share')}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[var(--warning-soft)] p-4 text-xs text-[var(--warning)]">
            <AlertTriangle size={18} />
            {l(
              'Публикация создаёт отдельный очищенный снимок без приватных Telegram-данных.',
              'Publication creates a sanitized snapshot without private Telegram data.',
            )}
          </div>
          <Button
            variant="danger"
            fullWidth
            disabled={busy}
            onClick={() => setConfirmUnpublish(true)}
          >
            {l('Снять с публикации', 'Unpublish')}
          </Button>
        </>
      ) : (
        <Button
          fullWidth
          disabled={busy || slugState !== 'available'}
          onClick={() => void publish()}
        >
          {busy ? l('Публикуем…', 'Publishing…') : l('Опубликовать визитку', 'Publish card')}
        </Button>
      )}
      <ConfirmDialog
        open={confirmUnpublish}
        title={l('Снять визитку с публикации?', 'Unpublish the card?')}
        description={l(
          'Публичная страница станет недоступна, но адрес останется за вами.',
          'The public page will become unavailable, but the address remains reserved.',
        )}
        confirmLabel={l('Снять', 'Unpublish')}
        cancelLabel={l('Отмена', 'Cancel')}
        onCancel={() => setConfirmUnpublish(false)}
        onConfirm={() => void unpublish()}
      />
    </EditorShell>
  )
}

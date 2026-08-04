import { AlertTriangle, Copy, Download, Share2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { slugSchema } from '@shared/schemas'
import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { EditorShell } from '@/features/editor/editor-shell'
import { copyText } from '@/lib/utils'
import { clientEnv } from '@/config/client-env'
import { apiRequest } from '@/services/api-client'

type SlugState = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid' | 'error'

export default function PublicationPage() {
  const { card, updateCard } = useCardStore()
  const [slugState, setSlugState] = useState<SlugState>('idle')
  const [busy, setBusy] = useState(false)
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
    timer.current = window.setTimeout(async () => {
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
    }, 450)
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
    } finally {
      setBusy(false)
    }
  }
  const unpublish = async () => {
    if (!window.confirm('Снять визитку с публикации? Адрес останется за вами.')) return
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
    URL.revokeObjectURL(url)
  }

  return (
    <EditorShell title="Публикация">
      <div>
        {card.publication.published ? (
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--success)]">
            Опубликовано
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-[var(--surface-secondary)] px-3 py-2 text-xs">
            Не опубликовано
          </span>
        )}
      </div>
      <label className="field-group">
        <span className="field-label">Адрес визитки</span>
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
              checking: 'Проверяем адрес…',
              available: 'Адрес свободен',
              unavailable: 'Адрес уже занят',
              invalid: 'Проверьте формат адреса',
              error: 'Не удалось проверить адрес',
            }[slugState]
          }
        </span>
      </label>
      {card.publication.published ? (
        <>
          <div className="surface flex min-h-14 items-center justify-between rounded-xl px-3">
            <span className="min-w-0 truncate text-sm">{publicUrl}</span>
            <button
              aria-label="Скопировать HTTPS ссылку"
              className="grid size-11 place-items-center text-[var(--accent)]"
              onClick={() => void copyText(publicUrl)}
            >
              <Copy size={19} />
            </button>
          </div>
          <div className="surface flex min-h-14 items-center justify-between rounded-xl px-3">
            <span className="min-w-0 truncate text-sm">{telegramUrl}</span>
            <button
              aria-label="Скопировать Telegram ссылку"
              className="grid size-11 place-items-center text-[var(--accent)]"
              onClick={() => void copyText(telegramUrl)}
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
                Скачать QR
              </Button>
              <Button
                variant="secondary"
                onClick={() => void navigator.share?.({ url: publicUrl })}
              >
                <Share2 size={17} />
                Поделиться
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[var(--warning-soft)] p-4 text-xs text-[var(--warning)]">
            <AlertTriangle size={18} />
            Публикация создаёт отдельный очищенный снимок без приватных Telegram-данных.
          </div>
          <Button variant="danger" fullWidth disabled={busy} onClick={() => void unpublish()}>
            Снять с публикации
          </Button>
        </>
      ) : (
        <Button
          fullWidth
          disabled={busy || slugState !== 'available'}
          onClick={() => void publish()}
        >
          {busy ? 'Публикуем…' : 'Опубликовать визитку'}
        </Button>
      )}
    </EditorShell>
  )
}

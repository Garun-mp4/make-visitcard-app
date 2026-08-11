import {
  Archive,
  Check,
  Copy,
  Download,
  Link2,
  Pencil,
  Plus,
  QrCode,
  Share2,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useState } from 'react'

import type { ShareSource } from '@shared/types'
import { useFeedback } from '@/components/feedback/feedback-provider'
import { useQrPng } from '@/components/qr/use-qr-png'
import { Button } from '@/components/ui/button'
import { useLocaleText } from '@/i18n/use-locale-text'
import { downloadQrPng, qrPngUrl, shareQrPng } from '@/lib/qr-code'
import { copyText } from '@/lib/utils'
import {
  copyShareSourceLink,
  createShareSource,
  loadShareSources,
  patchShareSource,
} from '@/services/share-sources-service'

const presets = [
  ['Мероприятие', 'Event'],
  ['Соцсети', 'Social'],
  ['Резюме', 'Resume'],
  ['Печатный QR', 'Printed QR'],
] as const

export function ShareSourcesSection({ slug }: { slug: string }) {
  const l = useLocaleText()
  const feedback = useFeedback()
  const [sources, setSources] = useState<ShareSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<ShareSource | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const selectedUrl = selected
    ? `${window.location.origin}/c/${slug}?ref=${encodeURIComponent(selected.token)}`
    : ''
  const sourceQr = useQrPng(selectedUrl, `${slug}-${selected?.name ?? 'source'}`, Boolean(selected))

  const refresh = useCallback(() => {
    setLoading(true)
    setError(false)
    void loadShareSources()
      .then(setSources)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])
  useEffect(refresh, [refresh])

  const urlFor = (source: ShareSource) =>
    `${window.location.origin}/c/${slug}?ref=${encodeURIComponent(source.token)}`

  const create = async () => {
    const clean = name.trim()
    if (clean.length < 2 || creating) return
    setCreating(true)
    try {
      const source = await createShareSource({ name: clean })
      setSources((current) => [source, ...current])
      setName('')
      setSelected(source)
    } catch {
      feedback.notify(l('Не удалось создать ссылку', 'Could not create link'), 'error')
    } finally {
      setCreating(false)
    }
  }

  const share = async (source: ShareSource) => {
    const url = urlFor(source)
    if (navigator.share) {
      try {
        await navigator.share({ title: source.name, url })
        return
      } catch (error) {
        if ((error as DOMException).name === 'AbortError') return
      }
    }
    if (await copyText(url)) feedback.notify(l('Ссылка скопирована', 'Link copied'), 'success')
    else feedback.revealLink(source.name, url)
  }

  const update = async (source: ShareSource, patch: { name?: string; archived?: boolean }) => {
    try {
      const next = await patchShareSource(source.id, patch)
      setSources((current) => current.map((item) => (item.id === next.id ? next : item)))
      setEditing(null)
    } catch {
      feedback.notify(l('Не удалось изменить источник', 'Could not update source'), 'error')
    }
  }

  return (
    <section className="surface grid min-w-0 gap-4 rounded-2xl p-4 lg:p-5">
      <div>
        <h2 className="heading-font m-0 text-lg">
          {l('Ссылки для распространения', 'Sharing links')}
        </h2>
        <p className="mb-0 mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
          {l(
            'Создавайте отдельную ссылку для каждого канала и сравнивайте результат.',
            'Create a link for each channel and compare results.',
          )}
        </p>
      </div>

      <div className="grid gap-2">
        <div className="flex min-w-0 gap-2">
          <input
            aria-label={l('Название источника', 'Source name')}
            className="field-control min-w-0 flex-1"
            maxLength={60}
            placeholder={l('Например, конференция', 'For example, conference')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void create()
            }}
          />
          <Button
            aria-label={l('Создать ссылку', 'Create link')}
            disabled={creating || name.trim().length < 2}
            onClick={() => void create()}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{l('Создать', 'Create')}</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map(([ru, en]) => (
            <button
              key={en}
              className="min-h-9 rounded-full border border-[var(--border)] px-3 text-xs text-[var(--text-secondary)]"
              onClick={() => setName(l(ru, en))}
            >
              {l(ru, en)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--border)] px-3">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--surface-secondary)]">
            <Link2 size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm">Direct</strong>
            <small className="text-[var(--text-muted)]">{l('Основная ссылка', 'Base link')}</small>
          </span>
        </div>
        {loading ? (
          <div className="h-14 animate-pulse rounded-xl bg-[var(--surface-secondary)]" />
        ) : null}
        {error ? (
          <Button variant="secondary" onClick={refresh}>
            {l('Повторить загрузку', 'Retry loading')}
          </Button>
        ) : null}
        {!loading && !error && !sources.length ? (
          <p className="m-0 rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
            {l('Дополнительных источников пока нет.', 'No additional sources yet.')}
          </p>
        ) : null}
        {sources.map((source) => (
          <div
            key={source.id}
            className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-[var(--border)] p-2 ${source.archived ? 'opacity-55' : ''}`}
          >
            {editing === source.id ? (
              <input
                className="field-control min-w-0"
                maxLength={60}
                value={editName}
                autoFocus
                onChange={(event) => setEditName(event.target.value)}
              />
            ) : (
              <button className="min-w-0 px-1 text-left" onClick={() => setSelected(source)}>
                <strong className="block truncate text-sm">{source.name}</strong>
                <span className="block truncate text-[10px] text-[var(--text-muted)]">
                  ?ref={source.token}
                </span>
                <span className="block text-[10px] text-[var(--text-muted)]">
                  {source.views ?? 0} {l('просмотров', 'views')}
                </span>
              </button>
            )}
            <div className="flex">
              {editing === source.id ? (
                <>
                  <button
                    className="grid size-11 place-items-center"
                    aria-label={l('Сохранить название', 'Save name')}
                    onClick={() => void update(source, { name: editName.trim() })}
                  >
                    <Check size={17} />
                  </button>
                  <button
                    className="grid size-11 place-items-center"
                    aria-label={l('Отмена', 'Cancel')}
                    onClick={() => setEditing(null)}
                  >
                    <X size={17} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="grid size-11 place-items-center"
                    aria-label={l('Поделиться', 'Share')}
                    onClick={() => void share(source)}
                  >
                    <Share2 size={17} />
                  </button>
                  <button
                    className="grid size-11 place-items-center"
                    aria-label={l('Переименовать', 'Rename')}
                    onClick={() => {
                      setEditing(source.id)
                      setEditName(source.name)
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="grid size-11 place-items-center"
                    aria-label={
                      source.archived
                        ? l('Вернуть источник', 'Restore source')
                        : l('Архивировать', 'Archive')
                    }
                    onClick={() => void update(source, { archived: !source.archived })}
                  >
                    <Archive size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-[#10120f99] p-3 md:place-items-center"
          onMouseDown={() => setSelected(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="surface grid max-h-[calc(100dvh-var(--tg-safe-top)-24px)] w-full max-w-md gap-4 overflow-y-auto rounded-2xl p-5"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="heading-font m-0 text-xl">{selected.name}</h3>
                <p className="mb-0 mt-1 text-xs text-[var(--text-muted)]">
                  {l('Ссылка и QR готовы', 'Link and QR are ready')}
                </p>
              </div>
              <button
                className="grid size-11 place-items-center"
                aria-label={l('Закрыть', 'Close')}
                onClick={() => setSelected(null)}
              >
                <X />
              </button>
            </div>
            <div className="mx-auto rounded-2xl bg-white p-4">
              <QRCodeSVG ref={sourceQr.svgRef} value={selectedUrl} size={200} level="M" />
            </div>
            <p className="m-0 break-all rounded-xl bg-[var(--surface-secondary)] p-3 text-xs">
              {urlFor(selected)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  void copyShareSourceLink(urlFor(selected)).then((result) => {
                    if (result === 'copied')
                      feedback.notify(l('Ссылка скопирована', 'Link copied'), 'success')
                    else feedback.revealLink(selected.name, urlFor(selected))
                  })
                }
              >
                <Copy size={17} />
                {l('Копировать', 'Copy')}
              </Button>
              <Button onClick={() => void share(selected)}>
                <Share2 size={17} />
                {l('Поделиться', 'Share')}
              </Button>
              <Button
                variant="secondary"
                disabled={!sourceQr.asset}
                onClick={() =>
                  void (async () => {
                    if (!sourceQr.asset) return
                    try {
                      await downloadQrPng(sourceQr.asset, qrPngUrl(selectedUrl, slug))
                      feedback.notify(l('QR-код скачан', 'QR code downloaded'), 'success')
                    } catch {
                      feedback.notify(
                        l('Не удалось скачать QR-код', 'Could not download QR code'),
                        'error',
                      )
                    }
                  })()
                }
              >
                <Download size={17} />
                {l('Скачать QR', 'Download QR')}
              </Button>
              <Button
                variant="secondary"
                disabled={!sourceQr.asset}
                onClick={() =>
                  void (async () => {
                    if (!sourceQr.asset) return
                    try {
                      const result = await shareQrPng(sourceQr.asset, {
                        title: selected.name,
                        text: selectedUrl,
                        url: selectedUrl,
                      })
                      if (result === 'unsupported') feedback.revealLink(selected.name, selectedUrl)
                    } catch {
                      feedback.notify(
                        l('Не удалось поделиться QR-кодом', 'Could not share QR code'),
                        'error',
                      )
                    }
                  })()
                }
              >
                <QrCode size={17} />
                {l('Поделиться QR', 'Share QR')}
              </Button>
            </div>
            <p className="m-0 text-center text-[10px] text-[var(--text-muted)]">
              <QrCode className="mr-1 inline" size={13} />
              {l(
                'Архивация не отключает уже напечатанный QR.',
                'Archiving keeps printed QR codes working.',
              )}
            </p>
          </section>
        </div>
      ) : null}
    </section>
  )
}

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  Image as ImageIcon,
  RefreshCw,
  Share2,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { publishableCardSchema, slugSchema } from '@shared/schemas'
import type { SaveError } from '@/app/card-store'
import { useCardStore } from '@/app/card-store'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useFeedback } from '@/components/feedback/feedback-provider'
import { useQrPng } from '@/components/qr/use-qr-png'
import { Button } from '@/components/ui/button'
import { clientEnv } from '@/config/client-env'
import { EditorShell } from '@/features/editor/editor-shell'
import { useLocaleText } from '@/i18n/use-locale-text'
import { downloadQrPng, qrPngUrl, shareQrPng } from '@/lib/qr-code'
import { copyText } from '@/lib/utils'
import { ApiError, apiRequest } from '@/services/api-client'

type SlugState = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid' | 'error'

function LinkRow({ label, value, onCopy }: { label: string; value: string; onCopy(): void }) {
  return (
    <div className="surface flex min-w-0 items-center rounded-xl px-3">
      <span className="min-w-0 flex-1 truncate text-xs sm:text-sm">{value}</span>
      <button
        type="button"
        aria-label={label}
        className="grid size-11 shrink-0 place-items-center text-[var(--accent)]"
        onClick={onCopy}
      >
        <Copy size={18} />
      </button>
    </div>
  )
}

function SyncNotice({
  tone,
  children,
  action,
}: {
  tone: 'success' | 'warning' | 'error'
  children: React.ReactNode
  action?: React.ReactNode
}) {
  const style = {
    success: 'bg-[var(--accent-soft)] text-[var(--success)]',
    warning: 'bg-[var(--warning-soft)] text-[var(--warning)]',
    error: 'bg-[var(--error-soft)] text-[var(--error)]',
  }[tone]
  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle
  return (
    <div className={`flex min-w-0 items-start gap-2 rounded-xl p-3 text-xs ${style}`} role="status">
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 leading-relaxed">{children}</span>
      {action}
    </div>
  )
}

function SharePreviewCard({
  imageUrl,
  syncState,
  updating,
  saveFailed,
}: {
  imageUrl: string
  syncState: 'synced' | 'pending_validation'
  updating: boolean
  saveFailed: boolean
}) {
  const l = useLocaleText()
  const [imageFailed, setImageFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const source = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}retry=${retry}`
  const pending = syncState === 'pending_validation'
  const status = saveFailed
    ? l(
        'Не удалось обновить превью. Показана предыдущая публичная версия.',
        'Could not update the preview. The previous public version is shown.',
      )
    : updating
      ? l('Готовим обновлённое превью…', 'Preparing the updated preview…')
      : pending
        ? l(
            'Превью показывает последнюю корректную публичную версию.',
            'The preview shows the last valid public version.',
          )
        : l(
            'Превью соответствует опубликованной визитке.',
            'The preview matches the published card.',
          )

  return (
    <section className="grid min-w-0 gap-3" aria-labelledby="share-preview-heading">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="share-preview-heading" className="m-0 text-sm font-semibold">
            {l('Превью при отправке', 'Share preview')}
          </h2>
          <p className="mb-0 mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            {l(
              'Так ссылка будет выглядеть в поддерживаемых приложениях.',
              'This is how the link appears in supported apps.',
            )}
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          <ImageIcon size={17} aria-hidden="true" />
        </span>
      </div>

      <div className="relative aspect-[1200/630] min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
        {imageFailed ? (
          <div className="absolute inset-0 grid content-center justify-items-center gap-2 p-4 text-center">
            <AlertTriangle size={22} className="text-[var(--warning)]" aria-hidden="true" />
            <p className="m-0 text-xs text-[var(--text-secondary)]">
              {l('Не удалось загрузить превью', 'Could not load the preview')}
            </p>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-[var(--accent)]"
              onClick={() => {
                setImageFailed(false)
                setRetry((value) => value + 1)
              }}
            >
              <RefreshCw size={15} aria-hidden="true" />
              {l('Повторить', 'Retry')}
            </button>
          </div>
        ) : (
          <img
            key={source}
            src={source}
            alt={l('Превью ссылки на визитку', 'Business card link preview')}
            className="size-full object-cover"
            onError={() => setImageFailed(true)}
          />
        )}
        {updating ? (
          <div
            className="pointer-events-none absolute inset-0 bg-[color-mix(in_srgb,var(--surface)_68%,transparent)] motion-safe:animate-pulse"
            aria-hidden="true"
          />
        ) : null}
      </div>

      <div
        className={`flex items-start gap-2 text-xs leading-relaxed ${saveFailed ? 'text-[var(--error)]' : pending || updating ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}
        role="status"
      >
        {saveFailed || pending ? (
          <AlertTriangle className="mt-0.5 shrink-0" size={15} aria-hidden="true" />
        ) : updating ? (
          <RefreshCw
            className="mt-0.5 shrink-0 motion-safe:animate-spin"
            size={15}
            aria-hidden="true"
          />
        ) : (
          <CheckCircle2 className="mt-0.5 shrink-0" size={15} aria-hidden="true" />
        )}
        <span>{status}</span>
      </div>
      <p className="m-0 text-[11px] leading-relaxed text-[var(--text-muted)]">
        {l(
          'Telegram и другие приложения могут некоторое время показывать сохранённую копию.',
          'Telegram and other apps may temporarily show a cached copy.',
        )}
      </p>
    </section>
  )
}

function PublicationQr({
  url,
  slug,
  ownerName,
  compact = false,
  onPreview,
}: {
  url: string
  slug: string
  ownerName: string
  compact?: boolean
  onPreview?: () => void
}) {
  const l = useLocaleText()
  const feedback = useFeedback()
  const { svgRef, asset, failed, retry } = useQrPng(url, slug)
  const [sharing, setSharing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const imageUrl = qrPngUrl(url, slug)
  const downloadQr = async () => {
    if (!asset) {
      feedback.notify(l('Не удалось подготовить QR-код', 'Could not prepare the QR code'), 'error')
      return
    }
    setDownloading(true)
    try {
      const result = await downloadQrPng(asset, imageUrl)
      if (result === 'cancelled') return
      feedback.notify(
        result === 'downloading'
          ? l('Скачивание PNG началось', 'PNG download started')
          : l('PNG открыт для скачивания', 'PNG opened for download'),
        'success',
      )
    } catch {
      feedback.notify(l('Не удалось скачать QR-код', 'Could not download the QR code'), 'error')
    } finally {
      setDownloading(false)
    }
  }
  const share = async () => {
    if (!asset) return
    setSharing(true)
    const result = await shareQrPng(asset, {
      title: l(`QR-код · ${ownerName}`, `QR code · ${ownerName}`),
      text: `${l(`Визитка ${ownerName}`, `${ownerName}'s business card`)}\n${url}`,
      url: imageUrl,
    })
    setSharing(false)
    if (result === 'cancelled') return
    if (result === 'shared') {
      feedback.notify(l('Окно отправки открыто', 'Share dialog opened'), 'success')
      return
    }
    feedback.revealLink(l('Поделиться QR-кодом', 'Share QR code'), imageUrl)
  }

  if (!compact)
    return (
      <div className="grid content-start gap-4">
        <div className="surface mx-auto grid aspect-square w-full max-w-56 place-items-center rounded-2xl p-5">
          <QRCodeSVG
            ref={svgRef}
            value={url}
            title={l('QR-код визитки', 'Business card QR code')}
            role="img"
            aria-label={l('QR-код визитки', 'Business card QR code')}
            size={176}
            level="H"
            marginSize={2}
            bgColor="#ffffff"
            fgColor="#183d2e"
          />
        </div>
        <p className="m-0 text-center text-xs text-[var(--text-muted)]">
          {l('Подходит для печати и публикации в соцсетях.', 'Ready for print and social media.')}
        </p>
        {failed ? (
          <button className="text-xs font-semibold text-[var(--warning)]" onClick={retry}>
            {l('Не удалось подготовить PNG · Повторить', 'Could not prepare PNG · Retry')}
          </button>
        ) : null}
        <Button
          variant="secondary"
          fullWidth
          disabled={!asset || sharing || downloading}
          aria-busy={downloading}
          onClick={() => void downloadQr()}
        >
          <Download size={17} />
          {downloading
            ? l('Открываем…', 'Opening…')
            : asset
              ? l('Скачать PNG', 'Download PNG')
              : l('Готовим PNG…', 'Preparing PNG…')}
        </Button>
        <Button fullWidth disabled={!asset || sharing} onClick={() => void share()}>
          <Share2 size={17} />
          {sharing
            ? l('Открываем…', 'Opening…')
            : asset
              ? l('Поделиться QR', 'Share QR')
              : l('Готовим QR…', 'Preparing QR…')}
        </Button>
        {onPreview ? (
          <Button variant="secondary" fullWidth onClick={onPreview}>
            <Eye size={17} />
            {l('Предпросмотр', 'Preview')}
          </Button>
        ) : null}
      </div>
    )

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,128px)_minmax(0,1fr)] gap-3">
      <div className="surface grid aspect-square min-w-0 place-items-center rounded-2xl p-2">
        <QRCodeSVG
          ref={svgRef}
          value={url}
          title={l('QR-код визитки', 'Business card QR code')}
          role="img"
          aria-label={l('QR-код визитки', 'Business card QR code')}
          size={104}
          level="H"
          marginSize={1}
          bgColor="#ffffff"
          fgColor="#183d2e"
        />
      </div>
      <div className="grid min-w-0 content-center gap-2">
        {failed ? (
          <button className="text-left text-xs font-semibold text-[var(--warning)]" onClick={retry}>
            <RefreshCw className="mr-1 inline" size={14} aria-hidden="true" />
            {l('Повторить', 'Retry')}
          </button>
        ) : (
          <>
            <Button
              className="min-w-0 px-2 text-xs"
              variant="secondary"
              disabled={!asset || sharing || downloading}
              aria-busy={downloading}
              onClick={() => void downloadQr()}
            >
              <Download className="shrink-0" size={16} />
              <span className="truncate">
                {downloading
                  ? l('Открываем…', 'Opening…')
                  : asset
                    ? l('Скачать PNG', 'Download PNG')
                    : l('Готовим…', 'Preparing…')}
              </span>
            </Button>
            <Button
              className="min-w-0 px-2 text-xs"
              variant="secondary"
              disabled={!asset || sharing}
              onClick={() => void share()}
            >
              <Share2 className="shrink-0" size={16} />
              <span className="truncate">{l('Поделиться QR', 'Share QR')}</span>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function errorLabel(error: SaveError | null): string | null {
  if (!error) return null
  return `${error.message}${error.requestId ? ` · ${error.requestId}` : ''}`
}

function requestErrorLabel(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback
  return `${error.message}${error.payload.requestId ? ` · ${error.payload.requestId}` : ''}`
}

function editorRouteForInvalidPath(path: string | undefined): string {
  if (path?.startsWith('primaryAction') || path?.startsWith('links')) return '/app/editor/contacts'
  if (path?.startsWith('services')) return '/app/editor/services'
  if (path?.startsWith('projects')) return '/app/editor/projects'
  if (path?.startsWith('skills')) return '/app/editor/skills'
  return '/app/editor/basic'
}

export default function PublicationPage() {
  const {
    card,
    publicSync,
    saveStatus,
    saveError,
    saveNow,
    ensurePublicCardReady,
    publicationOperation,
    publicationError,
    publishCard,
    unpublishCard,
    updateCard,
  } = useCardStore()
  const feedback = useFeedback()
  const navigate = useNavigate()
  const l = useLocaleText()
  const [slugState, setSlugState] = useState<SlugState>('idle')
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)
  const timer = useRef<number | null>(null)
  const slug = card.publication.slug
  const publicUrl = `${window.location.origin}/c/${slug}`
  const telegramUrl = `https://t.me/${clientEnv.telegramBotUsername || 'cardly_bot'}/${clientEnv.telegramAppShortName || 'app'}?startapp=${slug}`
  const published = card.publication.published
  const publishing = publicationOperation === 'publishing'
  const unpublishing = publicationOperation === 'unpublishing'
  const sharePreviewVersion =
    publicSync.syncedAt ?? card.lastPublishedAt ?? card.publication.publishedAt ?? 'published'
  const sharePreviewUrl = `/api/public/cards/${slug}/og.png?v=${encodeURIComponent(sharePreviewVersion)}`
  const publicationValidation = useMemo(
    () =>
      publishableCardSchema.safeParse({
        ...card,
        publication: { ...card.publication, slug, published: true },
      }),
    [card, slug],
  )
  const contentInvalidPaths = useMemo(
    () =>
      publicationValidation.success
        ? []
        : [
            ...new Set(
              publicationValidation.error.issues
                .map((issue) => issue.path.map(String).join('.'))
                .filter((path) => path !== 'publication.slug'),
            ),
          ],
    [publicationValidation],
  )

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    if (published) {
      setSlugState('idle')
      return
    }
    const parsed = slugSchema.safeParse(slug)
    if (!parsed.success) {
      setSlugState('invalid')
      return
    }
    setSlugState('checking')
    const checkSlug = async () => {
      try {
        if (!clientEnv.demoMode) {
          const result = await apiRequest<{ available: boolean }>('/api/slugs/check', {
            method: 'POST',
            body: JSON.stringify({ slug }),
            timeoutMs: 10_000,
          })
          setSlugState(result.available ? 'available' : 'unavailable')
        } else setSlugState('available')
      } catch {
        setSlugState('error')
      }
    }
    timer.current = window.setTimeout(() => void checkSlug(), 450)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [published, slug])

  const copy = (label: string, value: string) =>
    void copyText(value).then((copied) =>
      copied
        ? feedback.notify(l('Ссылка скопирована', 'Link copied'), 'success')
        : feedback.revealLink(label, value),
    )

  const publish = async () => {
    if (slugState !== 'available' || publishing || !publicationValidation.success) return
    try {
      await publishCard(slug)
      feedback.notify(l('Визитка опубликована', 'Card published'), 'success')
    } catch (error) {
      feedback.notify(
        requestErrorLabel(
          error,
          errorLabel(publicationError) ??
            l('Не удалось опубликовать визитку', 'Could not publish the card'),
        ),
        'error',
      )
    }
  }

  const unpublish = async () => {
    if (unpublishing) return
    try {
      await unpublishCard()
      setConfirmUnpublish(false)
      feedback.notify(l('Визитка снята с публикации', 'Card unpublished'), 'success')
    } catch (error) {
      feedback.notify(
        requestErrorLabel(
          error,
          errorLabel(publicationError) ??
            l('Не удалось снять визитку с публикации', 'Could not unpublish the card'),
        ),
        'error',
      )
    }
  }

  const preview = async () => {
    if (!published) return
    if (await ensurePublicCardReady())
      void navigate('/app/preview', { state: { returnTo: '/app/editor/publish' } })
    else
      feedback.notify(
        l('Сначала исправьте несохранённые изменения', 'Fix unsaved changes first'),
        'error',
      )
  }

  const syncNotice = published ? (
    saveStatus === 'error' || publicationError ? (
      <SyncNotice
        tone="error"
        action={
          <button className="shrink-0 font-semibold underline" onClick={() => void saveNow()}>
            {l('Повторить', 'Retry')}
          </button>
        }
      >
        {errorLabel(publicationError ?? saveError) ??
          l('Публичная версия осталась без изменений.', 'The public version was not changed.')}
      </SyncNotice>
    ) : saveStatus === 'dirty' || saveStatus === 'saving' ? (
      <SyncNotice tone="warning">
        {l('Обновляем публичную версию…', 'Updating the public version…')}
      </SyncNotice>
    ) : publicSync.state === 'pending_validation' ? (
      <SyncNotice
        tone="warning"
        action={
          <button
            className="shrink-0 font-semibold underline"
            onClick={() => navigate(editorRouteForInvalidPath(publicSync.invalidPaths[0]))}
          >
            {l('Исправить', 'Fix')}
          </button>
        }
      >
        {l(
          'Некоторые изменения сохранены, но пока не опубликованы.',
          'Some changes are saved but are not public yet.',
        )}
      </SyncNotice>
    ) : (
      <SyncNotice tone="success">
        {l('Все сохранённые изменения опубликованы.', 'All saved changes are public.')}
      </SyncNotice>
    )
  ) : contentInvalidPaths.length ? (
    <SyncNotice
      tone="error"
      action={
        <button
          className="shrink-0 font-semibold underline"
          onClick={() => navigate(editorRouteForInvalidPath(contentInvalidPaths[0]))}
        >
          {l('Исправить', 'Fix')}
        </button>
      }
    >
      {l('Исправьте данные визитки перед публикацией.', 'Fix the card details before publishing.')}
    </SyncNotice>
  ) : null

  return (
    <EditorShell
      title={l('Публикация', 'Publication')}
      desktopAside={
        published ? (
          <PublicationQr
            url={publicUrl}
            slug={slug}
            ownerName={card.profile.displayName}
            onPreview={() => void preview()}
          />
        ) : (
          <div className="grid min-h-full place-items-center text-center text-sm text-[var(--text-muted)]">
            {l('QR-код появится после публикации.', 'The QR code will appear after publication.')}
          </div>
        )
      }
      mobileFooter={
        published ? (
          <div className="fixed inset-x-0 bottom-[calc(88px+max(var(--tg-safe-bottom),var(--tg-content-safe-bottom)))] z-10 mx-auto max-w-[430px] px-5 lg:hidden">
            <Button
              className="shadow-[var(--shadow-floating)]"
              variant="secondary"
              fullWidth
              onClick={() => void preview()}
            >
              <Eye size={17} />
              {l('Предпросмотр', 'Preview')}
            </Button>
          </div>
        ) : null
      }
    >
      <div>
        <span
          className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold ${published ? 'bg-[var(--accent-soft)] text-[var(--success)]' : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'}`}
        >
          {published ? l('Опубликовано', 'Published') : l('Не опубликовано', 'Not published')}
        </span>
      </div>

      {published ? (
        <div className="grid min-w-0 gap-3">
          <LinkRow
            label={l('Скопировать HTTPS ссылку', 'Copy HTTPS link')}
            value={publicUrl}
            onCopy={() => copy(l('HTTPS-ссылка', 'HTTPS link'), publicUrl)}
          />
          <LinkRow
            label={l('Скопировать Telegram ссылку', 'Copy Telegram link')}
            value={telegramUrl}
            onCopy={() => copy(l('Telegram-ссылка', 'Telegram link'), telegramUrl)}
          />
        </div>
      ) : (
        <label className="field-group min-w-0">
          <span className="field-label">{l('Адрес визитки', 'Card address')}</span>
          <div className="field-control flex min-w-0 items-center gap-1">
            <span className="shrink-0 text-[var(--text-muted)]">cardly.me/</span>
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
      )}

      {published ? (
        <div className="lg:hidden">
          <PublicationQr url={publicUrl} slug={slug} ownerName={card.profile.displayName} compact />
        </div>
      ) : null}

      {published ? (
        <SharePreviewCard
          imageUrl={sharePreviewUrl}
          syncState={publicSync.state === 'pending_validation' ? 'pending_validation' : 'synced'}
          updating={saveStatus === 'dirty' || saveStatus === 'saving'}
          saveFailed={saveStatus === 'error' || Boolean(publicationError)}
        />
      ) : null}

      {syncNotice}

      {published ? (
        <Button
          variant="danger"
          fullWidth
          disabled={unpublishing}
          onClick={() => setConfirmUnpublish(true)}
        >
          {l('Снять с публикации', 'Unpublish')}
        </Button>
      ) : (
        <Button
          fullWidth
          disabled={publishing || slugState !== 'available' || !publicationValidation.success}
          onClick={() => void publish()}
        >
          {publishing ? l('Публикуем…', 'Publishing…') : l('Опубликовать визитку', 'Publish card')}
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
        busyLabel={l('Снимаем…', 'Unpublishing…')}
        cancelLabel={l('Отмена', 'Cancel')}
        busy={unpublishing}
        onCancel={() => setConfirmUnpublish(false)}
        onConfirm={() => void unpublish()}
      />
    </EditorShell>
  )
}

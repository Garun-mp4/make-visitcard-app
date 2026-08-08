import { ArrowLeft, Eye } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useCardStore } from '@/app/card-store'
import { PageSkeleton } from '@/components/feedback/page-skeleton'
import { SystemState } from '@/components/feedback/system-state'
import { PublicCardRenderer } from '@/features/public-card/public-card-renderer'
import { useTelegramBack } from '@/hooks/use-telegram'
import { useLocaleText } from '@/i18n/use-locale-text'
import { loadPublicCard } from '@/services/public-card-repository'

type PreviewReturnPath = '/app/card' | '/app/editor/publish' | '/app/profile'

function readReturnPath(value: unknown): PreviewReturnPath {
  if (value && typeof value === 'object' && 'returnTo' in value) {
    if (value.returnTo === '/app/editor/publish') return '/app/editor/publish'
    if (value.returnTo === '/app/profile') return '/app/profile'
  }
  return '/app/card'
}

export default function OwnerPreviewPage() {
  const { card, publicSync } = useCardStore()
  const navigate = useNavigate()
  const location = useLocation()
  const l = useLocaleText()
  const returnTo = readReturnPath(location.state)
  const returnLabel =
    returnTo === '/app/editor/publish'
      ? l('Назад к публикации', 'Back to publication')
      : returnTo === '/app/profile'
        ? l('Назад в профиль', 'Back to profile')
        : l('Назад к визитке', 'Back to card')
  const slug = card.publication.slug
  const publicUrl = `${window.location.origin}/c/${slug}`
  const goBack = useCallback(() => void navigate(returnTo, { replace: true }), [navigate, returnTo])
  useTelegramBack(goBack)

  const query = useQuery({
    queryKey: ['owner-public-preview', slug, card.lastPublishedAt],
    queryFn: () => loadPublicCard(slug),
    enabled: card.publication.published && Boolean(slug),
    staleTime: 0,
  })

  if (!card.publication.published) return <Navigate to="/app/editor/publish" replace />
  if (query.isLoading) return <PageSkeleton />
  if (query.isError)
    return (
      <SystemState
        title={l('Не удалось открыть предпросмотр', 'Could not open preview')}
        description={l(
          'Публичная версия не загрузилась. Проверьте подключение и повторите.',
          'The public version did not load. Check your connection and retry.',
        )}
        actionLabel={l('Повторить', 'Retry')}
        onAction={() => void query.refetch()}
      />
    )
  if (!query.data)
    return (
      <SystemState
        title={l('Публичная версия недоступна', 'Public version unavailable')}
        description={l(
          'Вернитесь в публикацию и проверьте состояние визитки.',
          'Return to publication and check the card status.',
        )}
        actionLabel={returnLabel}
        onAction={goBack}
      />
    )

  const pendingValidation = publicSync.state === 'pending_validation'

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <header
        className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-5"
        style={{ paddingTop: 'max(var(--tg-safe-top), var(--tg-content-safe-top))' }}
      >
        <div className="mx-auto flex min-h-14 max-w-[1240px] min-w-0 items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            aria-label={returnLabel}
            onClick={goBack}
          >
            <ArrowLeft size={18} className="shrink-0" aria-hidden="true" />
            <span className="truncate min-[360px]:hidden">{l('Назад', 'Back')}</span>
            <span className="hidden truncate min-[360px]:block">{returnLabel}</span>
          </button>
          <div className="flex shrink-0 items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Eye size={16} className="text-[var(--accent)]" aria-hidden="true" />
            <span className="min-[360px]:hidden">{l('Предпросмотр', 'Preview')}</span>
            <span className="hidden min-[360px]:inline">
              {l('Предпросмотр владельца', 'Owner preview')}
            </span>
          </div>
        </div>
        {pendingValidation ? (
          <div
            className="mx-auto max-w-[1240px] border-t border-[var(--border)] py-2 text-center text-xs text-[var(--warning)]"
            role="status"
          >
            {l(
              'Показана последняя корректная опубликованная версия',
              'Showing the last valid published version',
            )}
          </div>
        ) : null}
      </header>
      <PublicCardRenderer card={query.data} analyticsEnabled={false} publicUrl={publicUrl} />
    </div>
  )
}

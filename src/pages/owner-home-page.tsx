import { Copy, ExternalLink, Pencil, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useCardStore } from '@/app/card-store'
import { MiniCardPreview } from '@/features/card/mini-card-preview'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { copyText } from '@/lib/utils'
import { useFeedback } from '@/components/feedback/feedback-provider'
import { shareOrCopy } from '@/lib/share'
import { useTranslation } from 'react-i18next'

export default function OwnerHomePage() {
  const navigate = useNavigate()
  const { card, ensurePublicCardReady, publicSync, saveStatus } = useCardStore()
  const feedback = useFeedback()
  const { t } = useTranslation()
  const publicUrl = `${window.location.origin}/c/${card.publication.slug}`
  const withPublicCard = async (action: () => void) => {
    if (!card.publication.published) {
      navigate('/app/editor/publish')
      return
    }
    if (await ensurePublicCardReady()) action()
    else {
      feedback.notify('Публичная версия ещё не обновлена. Проверьте раздел публикации.', 'error')
      navigate('/app/editor/publish')
    }
  }
  return (
    <main className="owner-mobile-content lg:max-w-[1180px] lg:py-8">
      <header className="page-header">
        <h1 className="page-title">{t('home.title')}</h1>
        <span className="text-xl text-[var(--text-muted)]">•••</span>
      </header>
      <div className="mb-3 flex items-center justify-between">
        <StatusBadge tone={card.publication.published ? 'success' : 'neutral'}>
          {card.publication.published ? t('home.published') : t('home.draft')}
        </StatusBadge>
        <span className="text-[11px] text-[var(--text-muted)]">Обновлена сегодня, 10:24</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="surface rounded-2xl p-4">
          <div className="mx-auto max-h-[300px] overflow-hidden rounded-2xl border border-[var(--border)] lg:max-h-[420px]">
            <MiniCardPreview card={card} />
          </div>
        </section>
        <aside className="grid content-start gap-4">
          <div className="surface flex min-h-14 items-center justify-between rounded-xl px-3">
            <span className="min-w-0 truncate text-sm">
              {publicUrl.replace(/^https?:\/\//, '')}
            </span>
            <button
              aria-label="Скопировать ссылку"
              className="grid size-11 place-items-center text-[var(--accent)]"
              onClick={() =>
                void withPublicCard(
                  () =>
                    void copyText(publicUrl).then((copied) =>
                      copied
                        ? feedback.notify(t('feedback.copied'), 'success')
                        : feedback.revealLink(t('profile.copyLink'), publicUrl),
                    ),
                )
              }
            >
              <Copy size={19} />
            </button>
          </div>
          {saveStatus === 'dirty' ||
          saveStatus === 'saving' ||
          publicSync.state === 'pending_validation' ? (
            <div className="rounded-xl bg-[var(--warning-soft)] p-4 text-sm text-[var(--warning)]">
              Есть изменения, которые ещё не видят посетители.
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            <Button
              className="px-2 text-xs"
              onClick={() => void withPublicCard(() => navigate(`/c/${card.publication.slug}`))}
            >
              <ExternalLink size={15} />
              {t('home.open')}
            </Button>
            <Button
              className="px-2 text-xs"
              variant="secondary"
              onClick={() => navigate('/app/editor')}
            >
              <Pencil size={15} />
              {t('home.edit')}
            </Button>
            <Button
              className="px-2 text-xs"
              variant="secondary"
              onClick={() =>
                void withPublicCard(
                  () =>
                    void shareOrCopy({ title: card.profile.displayName, url: publicUrl }).then(
                      (result) =>
                        result === 'copied'
                          ? feedback.notify(t('feedback.copied'), 'success')
                          : result === 'manual'
                            ? feedback.revealLink(t('common.share'), publicUrl)
                            : feedback.notify(t('feedback.shareOpened'), 'success'),
                    ),
                )
              }
            >
              <Share2 size={15} />
              Поделиться
            </Button>
          </div>
          <div className="surface rounded-2xl p-5">
            <h2 className="heading-font mt-0 text-lg">{t('home.next')}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{t('home.nextDescription')}</p>
            <Button fullWidth variant="secondary" onClick={() => navigate('/app/editor/projects')}>
              {t('home.projects')}
            </Button>
          </div>
        </aside>
      </div>
    </main>
  )
}

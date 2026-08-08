import { Copy, ExternalLink, Pencil, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useCardStore } from '@/app/card-store'
import { useFeedback } from '@/components/feedback/feedback-provider'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { MiniCardPreview } from '@/features/card/mini-card-preview'
import { useLocaleText } from '@/i18n/use-locale-text'
import { shareOrCopy } from '@/lib/share'
import { copyText } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export default function OwnerHomePage() {
  const navigate = useNavigate()
  const { card, ensurePublicCardReady, leads, publicSync, saveStatus, stats } = useCardStore()
  const feedback = useFeedback()
  const { t, i18n } = useTranslation()
  const l = useLocaleText()
  const publicUrl = `${window.location.origin}/c/${card.publication.slug}`
  const latestLead = leads[0]
  const updated = new Intl.DateTimeFormat(i18n.language.startsWith('en') ? 'en' : 'ru', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(card.updatedAt))

  const withPublicCard = async (action: () => void) => {
    if (!card.publication.published) {
      void navigate('/app/editor/publish')
      return
    }
    if (await ensurePublicCardReady()) action()
    else {
      feedback.notify(
        l(
          'Публичная версия ещё не обновлена. Проверьте раздел публикации.',
          'The public version is not updated yet. Check publication.',
        ),
        'error',
      )
      void navigate('/app/editor/publish')
    }
  }

  const openPreview = () =>
    void withPublicCard(() => void navigate('/app/preview', { state: { returnTo: '/app/card' } }))
  const copyLink = () =>
    void withPublicCard(
      () =>
        void copyText(publicUrl).then((copied) =>
          copied
            ? feedback.notify(t('feedback.copied'), 'success')
            : feedback.revealLink(t('profile.copyLink'), publicUrl),
        ),
    )
  const share = () =>
    void withPublicCard(
      () =>
        void shareOrCopy({ title: card.profile.displayName, url: publicUrl }).then((result) =>
          result === 'copied'
            ? feedback.notify(t('feedback.copied'), 'success')
            : result === 'manual'
              ? feedback.revealLink(t('common.share'), publicUrl)
              : feedback.notify(t('feedback.shareOpened'), 'success'),
        ),
    )

  return (
    <main className="owner-mobile-content lg:max-w-[1180px] lg:py-8">
      <header className="page-header">
        <h1 className="page-title lg:text-[30px]">
          <span className="lg:hidden">{t('home.title')}</span>
          <span className="hidden lg:inline">{l('Ваша визитка', 'Your business card')}</span>
        </h1>
        <StatusBadge tone={card.publication.published ? 'success' : 'neutral'}>
          {card.publication.published ? t('home.published') : t('home.draft')}
        </StatusBadge>
      </header>

      <div className="mb-3 flex items-center justify-between lg:hidden">
        <span className="text-[11px] text-[var(--text-muted)]">
          {l('Обновлена', 'Updated')} {updated}
        </span>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)] lg:gap-6">
        <section className="surface min-w-0 rounded-2xl p-4 lg:grid lg:min-h-[760px] lg:place-items-center lg:bg-[var(--surface-secondary)] lg:p-8">
          <div className="lg:hidden">
            <MiniCardPreview card={card} compact />
          </div>
          <div className="hidden w-full max-w-[360px] overflow-hidden rounded-2xl border border-[var(--border)] lg:block">
            <MiniCardPreview card={card} />
          </div>
        </section>

        <aside className="grid min-w-0 content-start gap-3 lg:gap-4">
          <div className="surface flex min-h-14 min-w-0 items-center justify-between rounded-xl px-3">
            <span className="min-w-0 flex-1 truncate text-sm">
              {publicUrl.replace(/^https?:\/\//, '')}
            </span>
            <button
              aria-label={l('Скопировать ссылку', 'Copy link')}
              className="grid size-11 shrink-0 place-items-center text-[var(--accent)]"
              onClick={copyLink}
            >
              <Copy size={19} />
            </button>
          </div>

          {saveStatus === 'dirty' ||
          saveStatus === 'saving' ||
          publicSync.state === 'pending_validation' ? (
            <div className="rounded-xl bg-[var(--warning-soft)] p-4 text-sm text-[var(--warning)]">
              {l(
                'Есть изменения, которые ещё не видят посетители.',
                'Some changes are not visible to visitors yet.',
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            <Button className="px-2 text-xs" onClick={openPreview}>
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
            <Button className="px-2 text-xs" variant="secondary" onClick={share}>
              <Share2 size={15} />
              {t('common.share')}
            </Button>
          </div>

          <div className="hidden grid-cols-1 gap-3 sm:grid-cols-3 lg:grid">
            {[
              [l('Просмотры', 'Views'), stats.totalViews],
              [l('Нажатия CTA', 'CTA clicks'), stats.totalPrimaryClicks],
              [l('Новые заявки', 'Leads'), stats.totalLeads],
            ].map(([label, value]) => (
              <article key={String(label)} className="surface rounded-xl p-4">
                <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
                <strong className="heading-font mt-2 block text-2xl tabular-nums">{value}</strong>
              </article>
            ))}
          </div>

          <article className="surface hidden rounded-2xl p-5 lg:block">
            <div className="flex items-center justify-between gap-3">
              <h2 className="heading-font m-0 text-lg">{l('Последняя заявка', 'Latest lead')}</h2>
              {latestLead ? (
                <button
                  className="text-xs font-semibold text-[var(--accent)]"
                  onClick={() => navigate('/app/stats')}
                >
                  {l('Все заявки', 'All leads')}
                </button>
              ) : null}
            </div>
            {latestLead ? (
              <div className="mt-4">
                <strong className="text-sm">{latestLead.senderName}</strong>
                <p className="mb-0 mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">
                  {latestLead.message}
                </p>
              </div>
            ) : (
              <p className="mb-0 mt-3 text-sm text-[var(--text-muted)]">
                {l('Заявок пока нет.', 'No leads yet.')}
              </p>
            )}
          </article>

          <div className="hidden gap-2 lg:grid">
            <Button fullWidth onClick={() => navigate('/app/editor')}>
              {l('Редактировать визитку', 'Edit business card')}
            </Button>
            <Button fullWidth variant="secondary" onClick={share}>
              {l('Поделиться', 'Share')}
            </Button>
          </div>
        </aside>
      </div>
    </main>
  )
}

import { Bell, Copy, ExternalLink, Languages, RotateCcw, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useCardStore } from '@/app/card-store'
import { Avatar } from '@/components/ui/avatar'
import { changeLocale } from '@/i18n'
import { copyText } from '@/lib/utils'
import { useFeedback } from '@/components/feedback/feedback-provider'
import { useTranslation } from 'react-i18next'
import { useLocaleText } from '@/i18n/use-locale-text'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { card, ensurePublicCardReady, owner, preferences, setPreferences } = useCardStore()
  const feedback = useFeedback()
  const { t } = useTranslation()
  const l = useLocaleText()
  const url = `${window.location.origin}/c/${card.publication.slug}`
  const withPublicCard = async (action: () => void) => {
    if (!card.publication.published) {
      void navigate('/app/editor/publish')
      return
    }
    if (await ensurePublicCardReady()) action()
    else {
      feedback.notify(
        l(
          'Публичная версия ещё не обновлена. Проверьте публикацию.',
          'The public version is not updated yet. Check publication.',
        ),
        'error',
      )
      void navigate('/app/editor/publish')
    }
  }
  return (
    <main className="owner-mobile-content lg:max-w-[760px] lg:py-8">
      <header className="page-header">
        <h1 className="page-title">{t('profile.title')}</h1>
      </header>
      <section className="surface flex items-center gap-3 rounded-xl p-4">
        <Avatar name={card.profile.displayName} src={owner.photoUrl} />
        <div>
          <strong className="text-sm">
            {owner.firstName} {owner.lastName}
          </strong>
          <div className="text-xs text-[var(--text-muted)]">@{owner.username}</div>
        </div>
      </section>
      <section className="surface mt-3 rounded-xl p-4 text-xs">
        <dl className="m-0 grid grid-cols-[1fr_auto] gap-y-3">
          <dt className="text-[var(--text-muted)]">{t('profile.telegramId')}</dt>
          <dd className="m-0">{owner.telegramId}</dd>
          <dt className="text-[var(--text-muted)]">{t('profile.language')}</dt>
          <dd className="m-0">{owner.languageCode.toUpperCase()}</dd>
          <dt className="text-[var(--text-muted)]">{t('profile.premium')}</dt>
          <dd className="m-0">{owner.isPremium ? 'Да' : 'Нет'}</dd>
          <dt className="text-[var(--text-muted)]">{t('profile.platform')}</dt>
          <dd className="m-0">{owner.platform}</dd>
        </dl>
      </section>
      <div className="mt-3 grid gap-2">
        {[
          [
            Languages,
            `${t('profile.interfaceLanguage')} · ${preferences.locale.toUpperCase()}`,
            () => {
              const locale = preferences.locale === 'en' ? 'ru' : 'en'
              void setPreferences({ locale })
                .then(() => changeLocale(locale))
                .catch(() =>
                  feedback.notify(
                    l('Не удалось изменить язык', 'Could not change the language'),
                    'error',
                  ),
                )
            },
          ],
          [
            Bell,
            `${t('profile.notifications')} · ${preferences.leadNotificationsEnabled ? t('profile.on') : t('profile.off')}`,
            () =>
              void setPreferences({
                leadNotificationsEnabled: !preferences.leadNotificationsEnabled,
              })
                .then(() =>
                  feedback.notify(
                    preferences.leadNotificationsEnabled
                      ? l('Уведомления выключены', 'Notifications disabled')
                      : l('Уведомления включены', 'Notifications enabled'),
                    'success',
                  ),
                )
                .catch(() =>
                  feedback.notify(
                    l('Не удалось сохранить настройку', 'Could not save the setting'),
                    'error',
                  ),
                ),
          ],
          [
            ExternalLink,
            t('profile.publicCard'),
            () =>
              void withPublicCard(
                () => void navigate('/app/preview', { state: { returnTo: '/app/profile' } }),
              ),
          ],
          [
            Copy,
            t('profile.copyLink'),
            () =>
              void withPublicCard(
                () =>
                  void copyText(url).then((copied) =>
                    copied
                      ? feedback.notify(t('feedback.copied'), 'success')
                      : feedback.revealLink(t('profile.copyLink'), url),
                  ),
              ),
          ],
          [
            RotateCcw,
            l('Повторить первичную настройку', 'Repeat initial setup'),
            () => {
              sessionStorage.removeItem('cardly-onboarding-revisit-step')
              void navigate('/app/onboarding/revisit')
            },
          ],
        ].map(([Icon, label, action]) => {
          const I = Icon as typeof Languages
          return (
            <button
              key={String(label)}
              onClick={action as () => void}
              className="surface flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-sm"
            >
              <I size={18} className="text-[var(--accent)]" />
              <span className="flex-1">{String(label)}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-4 flex gap-2 text-xs leading-relaxed text-[var(--text-muted)]">
        <ShieldCheck size={17} className="shrink-0" />
        {t('profile.privacy')}
      </p>
    </main>
  )
}

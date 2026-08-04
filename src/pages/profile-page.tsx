import { Bell, Copy, ExternalLink, Languages, LogOut, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useCardStore } from '@/app/card-store'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { changeLocale } from '@/i18n'
import { copyText } from '@/lib/utils'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { card, owner, resetDemo } = useCardStore()
  const url = `${window.location.origin}/c/${card.publication.slug}`
  return (
    <main className="owner-mobile-content lg:max-w-[760px] lg:py-8">
      <header className="page-header">
        <h1 className="page-title">Профиль</h1>
        <span className="text-xl text-[var(--text-muted)]">•••</span>
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
          <dt className="text-[var(--text-muted)]">Telegram ID</dt>
          <dd className="m-0">{owner.telegramId}</dd>
          <dt className="text-[var(--text-muted)]">Язык</dt>
          <dd className="m-0">{owner.languageCode.toUpperCase()}</dd>
          <dt className="text-[var(--text-muted)]">Premium</dt>
          <dd className="m-0">{owner.isPremium ? 'Да' : 'Нет'}</dd>
          <dt className="text-[var(--text-muted)]">Платформа</dt>
          <dd className="m-0">{owner.platform}</dd>
        </dl>
      </section>
      <div className="mt-3 grid gap-2">
        {[
          [
            Languages,
            'Язык интерфейса',
            () => void changeLocale(document.documentElement.lang === 'en' ? 'ru' : 'en'),
          ],
          [Bell, 'Уведомления', () => undefined],
          [ExternalLink, 'Публичная визитка', () => navigate(`/c/${card.publication.slug}`)],
          [Copy, 'Скопировать ссылку', () => void copyText(url)],
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
        Telegram ID и данные авторизации видны только вам. Публичные контакты настраиваются
        отдельно.
      </p>
      <Button
        className="mt-4"
        variant="danger"
        fullWidth
        onClick={() => {
          resetDemo()
          void navigate('/')
        }}
      >
        <LogOut size={17} />
        Выйти
      </Button>
    </main>
  )
}

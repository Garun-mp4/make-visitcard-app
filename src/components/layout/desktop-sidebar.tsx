import { ChartNoAxesColumn, ContactRound, Pencil, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useCardStore } from '@/app/card-store'

const items = [
  { to: '/app/card', key: 'card', icon: ContactRound },
  { to: '/app/editor', key: 'editor', icon: Pencil },
  { to: '/app/stats', key: 'stats', icon: ChartNoAxesColumn },
  { to: '/app/profile', key: 'profile', icon: UserRound },
] as const

export function DesktopSidebar() {
  const { card, owner } = useCardStore()
  const { t } = useTranslation()
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[220px] border-r border-[var(--border)] bg-[var(--surface)] px-5 py-7 lg:block">
      <div className="heading-font text-xl font-medium">Cardly</div>
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
        <Avatar name={card.profile.displayName} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold">{card.profile.displayName}</div>
          <div className="truncate text-[10px] text-[var(--text-muted)]">@{owner.username}</div>
        </div>
      </div>
      <nav className="mt-5 grid gap-2" aria-label={t('common.mainNavigation')}>
        {items.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm text-[var(--text-secondary)]',
                isActive && 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]',
              )
            }
          >
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
            {t(`nav.${key}`)}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

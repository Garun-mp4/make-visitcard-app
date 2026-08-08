import { ChartNoAxesColumn, ContactRound, Pencil, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

const items = [
  { to: '/app/card', key: 'card', icon: ContactRound },
  { to: '/app/editor', key: 'editor', icon: Pencil },
  { to: '/app/stats', key: 'stats', icon: ChartNoAxesColumn },
  { to: '/app/profile', key: 'profile', icon: UserRound },
] as const

export function BottomNavigation() {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('common.mainNavigation')}
      className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px] px-4 pb-[max(10px,var(--tg-safe-bottom))]"
    >
      <div className="grid h-[72px] grid-cols-4 rounded-[22px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] p-1 shadow-[var(--shadow-floating)] backdrop-blur-xl">
        {items.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] text-[10px] text-[var(--text-muted)] transition',
                isActive && 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]',
              )
            }
          >
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
            <span>{t(`nav.${key}`)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

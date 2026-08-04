import {
  BriefcaseBusiness,
  ChevronRight,
  ContactRound,
  FolderKanban,
  Palette,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { useCardStore } from '@/app/card-store'

const rows = [
  { to: '/app/editor/basic', label: 'Основное', detail: 'Имя, профессия, bio', icon: UserRound },
  {
    to: '/app/editor/contacts',
    label: 'Контакты',
    detail: 'CTA, ссылки, публичность',
    icon: ContactRound,
  },
  { to: '/app/editor/skills', label: 'Навыки', detail: '6 из 10', icon: Sparkles },
  { to: '/app/editor/services', label: 'Услуги', detail: '3 из 6', icon: BriefcaseBusiness },
  { to: '/app/editor/projects', label: 'Проекты', detail: '4 из 6', icon: FolderKanban },
  { to: '/app/editor/appearance', label: 'Оформление', detail: 'Clean · зелёный', icon: Palette },
  { to: '/app/editor/publish', label: 'Публикация', detail: 'cardly.me/alexey', icon: Send },
]

export default function EditorIndexPage() {
  const { card } = useCardStore()
  return (
    <main className="owner-mobile-content lg:max-w-[880px] lg:py-8">
      <header className="page-header">
        <h1 className="page-title">Редактор</h1>
        <span className="text-xl text-[var(--text-muted)]">•••</span>
      </header>
      <div className="grid gap-3">
        {rows.map(({ to, label, detail, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="surface flex min-h-[62px] items-center gap-3 rounded-xl px-3 transition hover:border-[var(--border-strong)]"
          >
            <Icon size={20} className="text-[var(--accent)]" />
            <span className="min-w-0 flex-1">
              <strong className="block text-sm">{label}</strong>
              <span className="block truncate text-[11px] text-[var(--text-muted)]">
                {label === 'Оформление'
                  ? `${card.appearance.themeId} · ${card.appearance.accentPreset}`
                  : label === 'Публикация'
                    ? `cardly.me/${card.publication.slug}`
                    : detail}
              </span>
            </span>
            <ChevronRight size={18} className="text-[var(--text-muted)]" />
          </Link>
        ))}
      </div>
    </main>
  )
}

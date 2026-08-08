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
import { useLocaleText } from '@/i18n/use-locale-text'

export default function EditorIndexPage() {
  const { card } = useCardStore()
  const l = useLocaleText()
  const rows = [
    {
      to: '/app/editor/basic',
      label: l('Основное', 'Basic'),
      detail: l('Имя, профессия, о себе', 'Name, profession, about'),
      icon: UserRound,
    },
    {
      to: '/app/editor/contacts',
      label: l('Контакты', 'Contacts'),
      detail: l('CTA, ссылки, публичность', 'CTA, links, visibility'),
      icon: ContactRound,
    },
    {
      to: '/app/editor/skills',
      label: l('Навыки', 'Skills'),
      detail: `${card.skills.length} / 10`,
      icon: Sparkles,
    },
    {
      to: '/app/editor/services',
      label: l('Услуги', 'Services'),
      detail: `${card.services.length} / 6`,
      icon: BriefcaseBusiness,
    },
    {
      to: '/app/editor/projects',
      label: l('Проекты', 'Projects'),
      detail: `${card.projects.length} / 6`,
      icon: FolderKanban,
    },
    {
      to: '/app/editor/appearance',
      label: l('Оформление', 'Appearance'),
      detail: `${card.appearance.themeId} · ${card.appearance.accentPreset}`,
      icon: Palette,
    },
    {
      to: '/app/editor/publish',
      label: l('Публикация', 'Publication'),
      detail: card.publication.slug
        ? `cardly.me/${card.publication.slug}`
        : l('Адрес не выбран', 'Address not selected'),
      icon: Send,
    },
  ]
  return (
    <main className="owner-mobile-content lg:max-w-[880px] lg:py-8">
      <header className="page-header">
        <h1 className="page-title">{l('Редактор', 'Editor')}</h1>
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
              <span className="block truncate text-[11px] text-[var(--text-muted)]">{detail}</span>
            </span>
            <ChevronRight size={18} className="text-[var(--text-muted)]" />
          </Link>
        ))}
      </div>
    </main>
  )
}

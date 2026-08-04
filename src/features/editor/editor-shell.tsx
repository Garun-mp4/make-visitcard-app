import { ArrowLeft } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useCardStore } from '@/app/card-store'
import { SaveStatus } from '@/components/feedback/save-status'
import { MiniCardPreview } from '@/features/card/mini-card-preview'
import { cn } from '@/lib/utils'
import { useTelegramBack } from '@/hooks/use-telegram'

const sections = [
  ['/app/editor/basic', 'Основное'],
  ['/app/editor/contacts', 'Контакты'],
  ['/app/editor/skills', 'Навыки'],
  ['/app/editor/services', 'Услуги'],
  ['/app/editor/projects', 'Проекты'],
  ['/app/editor/appearance', 'Оформление'],
  ['/app/editor/publish', 'Публикация'],
] as const

export function EditorShell({ title, children }: PropsWithChildren<{ title: string }>) {
  const navigate = useNavigate()
  const { card, saveNow, saveStatus } = useCardStore()
  useTelegramBack(() => void navigate('/app/editor'))
  return (
    <main className="min-h-[100dvh] lg:p-8">
      <div className="mx-auto max-w-[1180px]">
        <header className="page-header px-5 lg:px-0">
          <button
            aria-label="Назад к разделам"
            onClick={() => navigate('/app/editor')}
            className="grid size-11 place-items-center rounded-xl lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title">{title}</h1>
          <SaveStatus status={saveStatus} onRetry={() => void saveNow()} />
        </header>
        <div className="lg:grid lg:grid-cols-[220px_minmax(360px,1fr)_410px] lg:gap-6">
          <nav
            className="surface hidden min-h-[760px] rounded-2xl p-3 lg:grid lg:content-start lg:gap-1"
            aria-label="Разделы редактора"
          >
            {sections.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-12 items-center rounded-xl px-3 text-sm text-[var(--text-secondary)]',
                    isActive && 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <section className="owner-mobile-content !pb-28 lg:!max-w-none lg:!px-0 lg:!pb-0">
            <div className="surface grid gap-5 rounded-2xl p-5 lg:min-h-[760px] lg:p-6">
              {children}
            </div>
          </section>
          <aside className="hidden min-h-[760px] rounded-2xl bg-[#e9ece8] p-6 lg:block">
            <div className="mb-4 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Живой предпросмотр · 390 px
            </div>
            <div className="mx-auto max-h-[680px] max-w-[350px] overflow-y-auto border border-[var(--border)]">
              <MiniCardPreview card={card} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

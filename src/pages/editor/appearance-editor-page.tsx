import { Check } from 'lucide-react'

import type { Appearance } from '@shared/types'
import { useCardStore } from '@/app/card-store'
import { EditorShell } from '@/features/editor/editor-shell'
import { cn } from '@/lib/utils'

const themes: Array<{
  id: Appearance['themeId']
  label: string
  description: string
  className: string
}> = [
  {
    id: 'clean',
    label: 'Clean',
    description: 'Спокойная светлая визитка',
    className: 'bg-[#fbfcf9] text-[#171916]',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Техническая тёмная подача',
    className: 'bg-[#111612] text-[#f1f4f0]',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Тёплая журнальная композиция',
    className: 'bg-[#f4ecdc] text-[#34281f]',
  },
]

export default function AppearanceEditorPage() {
  const { card, updateCard } = useCardStore()
  const appearance = card.appearance
  const toggle = (
    field: keyof Pick<
      Appearance,
      | 'showLocation'
      | 'showAvailability'
      | 'showServices'
      | 'showProjects'
      | 'showSkills'
      | 'showContactForm'
    >,
  ) =>
    updateCard((current) => ({
      ...current,
      appearance: { ...current.appearance, [field]: !current.appearance[field] },
    }))
  return (
    <EditorShell title="Оформление">
      <div>
        <h2 className="heading-font m-0 text-lg">Характер визитки</h2>
        <p className="helper-text mt-1">Тему можно изменить после публикации.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() =>
              updateCard((current) => ({
                ...current,
                appearance: { ...current.appearance, themeId: theme.id },
              }))
            }
            className={cn(
              'relative flex aspect-[0.72] flex-col justify-between rounded-xl border p-3 text-left',
              theme.className,
              appearance.themeId === theme.id
                ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)]'
                : 'border-[var(--border)]',
            )}
          >
            <span className="heading-font text-xl">Aa</span>
            <span>
              <strong className="block text-xs">{theme.label}</strong>
              <span className="hidden text-[9px] opacity-70 sm:block">{theme.description}</span>
            </span>
            {appearance.themeId === theme.id ? (
              <Check className="absolute right-2 top-2" size={16} />
            ) : null}
          </button>
        ))}
      </div>
      <section className="stack-12">
        <h2 className="heading-font m-0 text-lg">Показывать разделы</h2>
        {[
          ['showLocation', 'Город'],
          ['showAvailability', 'Доступность'],
          ['showSkills', 'Навыки'],
          ['showServices', 'Услуги'],
          ['showProjects', 'Проекты'],
          ['showContactForm', 'Форма заявки'],
        ].map(([field, label]) => (
          <label
            key={field}
            className="surface flex min-h-12 items-center justify-between rounded-xl px-3 text-sm"
          >
            <span>{label}</span>
            <input
              type="checkbox"
              checked={appearance[field as keyof Appearance] as boolean}
              onChange={() => toggle(field as Parameters<typeof toggle>[0])}
            />
          </label>
        ))}
      </section>
    </EditorShell>
  )
}

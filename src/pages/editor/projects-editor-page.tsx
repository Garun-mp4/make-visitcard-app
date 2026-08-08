import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { EditorShell } from '@/features/editor/editor-shell'
import { moveItem } from '@/lib/utils'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useState } from 'react'

export default function ProjectsEditorPage() {
  const { card, updateCard } = useCardStore()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const add = () => {
    if (card.projects.length >= 6) return
    updateCard((current) => ({
      ...current,
      projects: [
        ...current.projects,
        {
          id: crypto.randomUUID(),
          title: '',
          category: '',
          description: '',
          coverUrl: '',
          projectUrl: '',
          enabled: true,
          position: current.projects.length,
        },
      ],
    }))
  }
  return (
    <EditorShell title="Проекты">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-font m-0 text-lg">Избранные проекты</h2>
          <p className="helper-text">{card.projects.length} из 6</p>
        </div>
        <Button variant="secondary" onClick={add} disabled={card.projects.length >= 6}>
          <Plus size={17} />
          Добавить
        </Button>
      </div>
      {card.projects.map((project, index) => (
        <article key={project.id} className="surface grid gap-3 rounded-xl p-4">
          <div className="aspect-[16/10] rounded-xl bg-[var(--accent-soft)]" />
          <input
            aria-label="Название проекта"
            className="field-control min-h-11 font-semibold"
            value={project.title}
            placeholder="Название проекта"
            onChange={(event) =>
              updateCard((current) => ({
                ...current,
                projects: current.projects.map((item) =>
                  item.id === project.id ? { ...item, title: event.target.value } : item,
                ),
              }))
            }
          />
          <textarea
            aria-label="Описание проекта"
            className="field-control"
            value={project.description}
            placeholder="Расскажите о задаче и результате"
            onChange={(event) =>
              updateCard((current) => ({
                ...current,
                projects: current.projects.map((item) =>
                  item.id === project.id ? { ...item, description: event.target.value } : item,
                ),
              }))
            }
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={project.enabled}
              onChange={() =>
                updateCard((current) => ({
                  ...current,
                  projects: current.projects.map((item) =>
                    item.id === project.id ? { ...item, enabled: !item.enabled } : item,
                  ),
                }))
              }
            />
            Показывать в визитке
          </label>
          <div className="flex justify-end gap-1">
            <button
              aria-label="Выше"
              className="grid size-10 place-items-center"
              disabled={index === 0}
              onClick={() =>
                updateCard((current) => ({
                  ...current,
                  projects: moveItem(current.projects, index, -1),
                }))
              }
            >
              <ChevronUp size={17} />
            </button>
            <button
              aria-label="Ниже"
              className="grid size-10 place-items-center"
              disabled={index === card.projects.length - 1}
              onClick={() =>
                updateCard((current) => ({
                  ...current,
                  projects: moveItem(current.projects, index, 1),
                }))
              }
            >
              <ChevronDown size={17} />
            </button>
            <button
              aria-label="Удалить"
              className="grid size-10 place-items-center text-[var(--error)]"
              onClick={() => setPendingDelete(project.id)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </article>
      ))}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Удалить проект?"
        description="Проект исчезнет из редактора и публичной визитки."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          updateCard((current) => ({
            ...current,
            projects: current.projects.filter((item) => item.id !== pendingDelete),
          }))
          setPendingDelete(null)
        }}
      />
    </EditorShell>
  )
}

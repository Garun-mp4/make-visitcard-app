import { ChevronDown, ChevronUp, MoreVertical, Plus, Trash2 } from 'lucide-react'

import { useCardStore } from '@/app/card-store'
import { Button } from '@/components/ui/button'
import { EditorShell } from '@/features/editor/editor-shell'
import { moveItem } from '@/lib/utils'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { useState } from 'react'
import { useLocaleText } from '@/i18n/use-locale-text'
import { Switch } from '@/components/ui/switch'

export default function ProjectsEditorPage() {
  const l = useLocaleText()
  const { card, updateCard } = useCardStore()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const add = () => {
    if (card.projects.length >= 6) return
    const id = crypto.randomUUID()
    updateCard((current) => ({
      ...current,
      projects: [
        ...current.projects,
        {
          id,
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
    setEditingId(id)
  }
  return (
    <EditorShell title={l('Проекты', 'Projects')}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-font m-0 text-lg">
            {l('Избранные проекты', 'Featured projects')}
          </h2>
          <p className="helper-text">{card.projects.length} из 6</p>
        </div>
        <Button variant="secondary" onClick={add} disabled={card.projects.length >= 6}>
          <Plus size={17} />
          {l('Добавить', 'Add')}
        </Button>
      </div>
      {card.projects.map((project, index) => (
        <article key={project.id} className="surface grid gap-3 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">
              {(project.title || l('П', 'P')).slice(0, 1).toUpperCase()}
            </div>
            <button
              className="min-w-0 flex-1 text-left"
              aria-expanded={editingId === project.id}
              onClick={() => setEditingId(editingId === project.id ? null : project.id)}
            >
              <strong className="block truncate text-sm">
                {project.title || l('Новый проект', 'New project')}
              </strong>
              <span className="block truncate text-[11px] text-[var(--text-muted)]">
                {project.category || l('Категория не указана', 'No category')}
              </span>
            </button>
            <Switch
              aria-label={l('Показывать проект', 'Show project')}
              checked={project.enabled}
              onClick={() =>
                updateCard((current) => ({
                  ...current,
                  projects: current.projects.map((item) =>
                    item.id === project.id ? { ...item, enabled: !item.enabled } : item,
                  ),
                }))
              }
            />
            <MoreVertical size={18} className="text-[var(--text-muted)]" aria-hidden="true" />
          </div>
          {editingId === project.id ? (
            <div className="grid gap-3 border-t border-[var(--border)] pt-3">
              <input
                aria-label={l('Название проекта', 'Project name')}
                className="field-control min-h-11 font-semibold"
                value={project.title}
                placeholder={l('Название проекта', 'Project name')}
                onChange={(event) =>
                  updateCard((current) => ({
                    ...current,
                    projects: current.projects.map((item) =>
                      item.id === project.id ? { ...item, title: event.target.value } : item,
                    ),
                  }))
                }
              />
              <input
                aria-label={l('Категория проекта', 'Project category')}
                className="field-control min-h-11"
                value={project.category}
                placeholder={l('Например, Fintech', 'For example, Fintech')}
                onChange={(event) =>
                  updateCard((current) => ({
                    ...current,
                    projects: current.projects.map((item) =>
                      item.id === project.id ? { ...item, category: event.target.value } : item,
                    ),
                  }))
                }
              />
              <textarea
                aria-label={l('Описание проекта', 'Project description')}
                className="field-control"
                value={project.description}
                placeholder={l(
                  'Расскажите о задаче и результате',
                  'Describe the challenge and outcome',
                )}
                onChange={(event) =>
                  updateCard((current) => ({
                    ...current,
                    projects: current.projects.map((item) =>
                      item.id === project.id ? { ...item, description: event.target.value } : item,
                    ),
                  }))
                }
              />
              {!project.title.trim() ? (
                <p className="error-text m-0">
                  {l('Укажите название проекта', 'Enter a project name')}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className={`justify-end gap-1 ${editingId === project.id ? 'flex' : 'hidden'}`}>
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
        title={l('Удалить проект?', 'Delete project?')}
        description={l(
          'Проект исчезнет из редактора и публичной визитки.',
          'The project will be removed from the editor and public card.',
        )}
        confirmLabel={l('Удалить', 'Delete')}
        cancelLabel={l('Отмена', 'Cancel')}
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

import { FolderOpen, MoreVertical, Plus } from 'lucide-react'
import { useState } from 'react'

import type { Project } from '@shared/types'
import { useCardStore } from '@/app/card-store'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { EditorShell } from '@/features/editor/editor-shell'
import { ProjectEditorSheet } from '@/features/editor/project-editor-sheet'
import { useLocaleText } from '@/i18n/use-locale-text'
import { moveItem } from '@/lib/utils'
import { deleteCardImage } from '@/services/image-upload-service'

export default function ProjectsEditorPage() {
  const l = useLocaleText()
  const { card, updateCard } = useCardStore()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const editingProject = card.projects.find((project) => project.id === editingId) ?? null
  const editingIndex = editingProject
    ? card.projects.findIndex((project) => project.id === editingProject.id)
    : -1

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
          enabled: false,
          position: current.projects.length,
        },
      ],
    }))
    setEditingId(id)
  }

  const updateProject = (projectId: string, patch: Partial<Project>) =>
    updateCard((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId ? { ...project, ...patch } : project,
      ),
    }))

  return (
    <EditorShell title={l('Проекты', 'Projects')}>
      <div className="flex items-center justify-between gap-4">
        <p className="helper-text m-0 tabular-nums">
          {l(`${card.projects.length} из 6`, `${card.projects.length} of 6`)}
        </p>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)] disabled:opacity-45"
          onClick={add}
          disabled={card.projects.length >= 6}
        >
          <Plus size={17} aria-hidden="true" />
          {l('Добавить', 'Add')}
        </button>
      </div>

      {card.projects.length === 0 ? (
        <section className="surface mx-auto grid min-h-[210px] w-full max-w-[260px] place-content-center justify-items-center gap-3 rounded-2xl p-5 text-center">
          <FolderOpen
            size={32}
            strokeWidth={1.6}
            className="text-[var(--accent)]"
            aria-hidden="true"
          />
          <h2 className="heading-font m-0 text-[17px] font-semibold">
            {l('Проектов пока нет', 'No projects yet')}
          </h2>
          <p className="m-0 text-xs leading-relaxed text-[var(--text-muted)]">
            {l(
              'Добавьте первый проект, чтобы показать опыт.',
              'Add your first project to showcase your experience.',
            )}
          </p>
        </section>
      ) : (
        <div className="grid gap-3">
          {card.projects.map((project) => (
            <button
              key={project.id}
              type="button"
              className="surface flex min-h-[76px] w-full items-center gap-3 rounded-xl p-2.5 text-left transition-[background-color,border-color,transform] duration-150 hover:bg-[var(--surface-secondary)] active:scale-[0.99]"
              onClick={() => setEditingId(project.id)}
            >
              <div className="grid h-[54px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">
                {project.coverUrl ? (
                  <img src={project.coverUrl} alt="" className="size-full object-cover" />
                ) : (
                  (project.title || l('П', 'P')).slice(0, 1).toUpperCase()
                )}
              </div>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-[13px] font-semibold">
                  {project.title || l('Новый проект', 'New project')}
                </strong>
                <span className="mt-1 block truncate text-[11px] text-[var(--text-muted)]">
                  {project.category || l('Черновик', 'Draft')}
                </span>
              </span>
              <MoreVertical
                size={18}
                className="shrink-0 text-[var(--text-muted)]"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      )}

      {editingProject && editingIndex >= 0 ? (
        <ProjectEditorSheet
          ownerUid={card.ownerUid}
          project={editingProject}
          index={editingIndex}
          total={card.projects.length}
          onChange={(patch) => updateProject(editingProject.id, patch)}
          onMove={(direction) =>
            updateCard((current) => ({
              ...current,
              projects: moveItem(current.projects, editingIndex, direction),
            }))
          }
          onDelete={() => setPendingDelete(editingProject.id)}
          onClose={() => setEditingId(null)}
        />
      ) : null}

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
          const coverUrl = card.projects.find((item) => item.id === pendingDelete)?.coverUrl
          updateCard((current) => ({
            ...current,
            projects: current.projects
              .filter((item) => item.id !== pendingDelete)
              .map((item, position) => ({ ...item, position })),
          }))
          if (coverUrl) void deleteCardImage(coverUrl).catch(() => undefined)
          setEditingId(null)
          setPendingDelete(null)
        }}
      />
    </EditorShell>
  )
}

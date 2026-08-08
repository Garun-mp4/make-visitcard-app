import { ExternalLink, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { Project } from '@shared/types'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { telegram } from '@/lib/telegram'
import { useLocaleText } from '@/i18n/use-locale-text'

export function ProjectDialog({
  project,
  open,
  onClose,
}: {
  project: Project | null
  open: boolean
  onClose: () => void
}) {
  const l = useLocaleText()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      previousFocus.current = document.activeElement as HTMLElement | null
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => {
      onClose()
      previousFocus.current?.focus()
    }
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      className="m-auto max-h-[min(720px,calc(100dvh-24px))] w-[min(620px,calc(100%-24px))] overflow-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--text-primary)] shadow-[var(--shadow-modal)] backdrop:bg-[#10120fcc]"
      onCancel={onClose}
    >
      {project ? (
        <article>
          <div className="flex aspect-[16/10] items-start justify-end bg-[var(--accent-soft)] p-4">
            {project.coverUrl ? (
              <img
                src={project.coverUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : null}
            <IconButton
              aria-label={l('Закрыть проект', 'Close project')}
              onClick={onClose}
              className="relative"
            >
              <X size={20} aria-hidden="true" />
            </IconButton>
          </div>
          <div className="grid gap-4 p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              {project.category}
            </div>
            <h2 className="heading-font m-0 text-3xl font-semibold tracking-tight">
              {project.title}
            </h2>
            <p className="m-0 leading-relaxed text-[var(--text-secondary)]">
              {project.description}
            </p>
            {project.projectUrl ? (
              <Button onClick={() => telegram.openLink(project.projectUrl)}>
                {l('Открыть проект', 'Open project')} <ExternalLink size={17} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </article>
      ) : null}
    </dialog>
  )
}

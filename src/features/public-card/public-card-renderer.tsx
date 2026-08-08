import { useCallback, useState } from 'react'

import type { CardView, Project } from '@shared/types'
import { CleanTheme } from '@/features/public-card/clean-theme'
import { DarkTheme } from '@/features/public-card/dark-theme'
import { EditorialTheme } from '@/features/public-card/editorial-theme'
import { LeadForm } from '@/features/public-card/lead-form'
import { ProjectDialog } from '@/features/public-card/project-dialog'
import { useTranslation } from 'react-i18next'
import { accentStyle } from '@/lib/accent-preset'
import { recordPublicEvent } from '@/services/public-analytics'

export function PublicCardRenderer({
  card,
  analyticsEnabled = true,
  publicUrl,
}: {
  card: CardView
  analyticsEnabled?: boolean
  publicUrl?: string
}) {
  const { t } = useTranslation()
  const [project, setProject] = useState<Project | null>(null)
  const [leadOpen, setLeadOpen] = useState(false)
  const closeProject = useCallback(() => setProject(null), [])
  const common = {
    card,
    analyticsEnabled,
    publicUrl,
    onProject: (value: Project) => {
      if (analyticsEnabled) recordPublicEvent(card.publication.slug, 'project_open', value.id)
      setProject(value)
    },
    onLead: () => setLeadOpen(true),
  }
  return (
    <div
      className="contents"
      data-public-theme={card.appearance.themeId}
      data-public-accent={card.appearance.accentPreset}
      style={accentStyle(card.appearance.accentPreset, card.appearance.themeId === 'dark')}
    >
      {card.appearance.themeId === 'dark' ? (
        <DarkTheme {...common} />
      ) : card.appearance.themeId === 'editorial' ? (
        <EditorialTheme {...common} />
      ) : (
        <CleanTheme {...common} />
      )}
      <ProjectDialog project={project} open={Boolean(project)} onClose={closeProject} />
      <dialog
        open={leadOpen}
        className="fixed inset-x-3 bottom-3 top-auto z-30 m-auto max-h-[calc(100dvh-24px)] w-[min(520px,calc(100%-24px))] overflow-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-modal)] backdrop:bg-[#10120fcc] md:inset-0 md:bottom-auto"
        onCancel={() => setLeadOpen(false)}
      >
        {leadOpen ? (
          <>
            <button
              onClick={() => setLeadOpen(false)}
              className="mb-4 ml-auto block text-sm text-[var(--text-muted)]"
            >
              {t('publicCard.close')}
            </button>
            <LeadForm
              slug={card.publication.slug}
              ownerName={card.profile.displayName}
              previewMode={!analyticsEnabled}
            />
          </>
        ) : null}
      </dialog>
    </div>
  )
}

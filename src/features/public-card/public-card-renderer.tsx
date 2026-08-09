import { useCallback, useState } from 'react'

import type { CardView, Project } from '@shared/types'
import { CleanTheme } from '@/features/public-card/clean-theme'
import { DarkTheme } from '@/features/public-card/dark-theme'
import { EditorialTheme } from '@/features/public-card/editorial-theme'
import { ProjectDialog } from '@/features/public-card/project-dialog'
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
  const [project, setProject] = useState<Project | null>(null)
  const closeProject = useCallback(() => setProject(null), [])
  const common = {
    card,
    analyticsEnabled,
    publicUrl,
    onProject: (value: Project) => {
      if (analyticsEnabled) recordPublicEvent(card.publication.slug, 'project_open', value.id)
      setProject(value)
    },
    onLead: () =>
      document.getElementById('public-lead-form')?.scrollIntoView({ behavior: 'smooth' }),
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
      <ProjectDialog
        project={project}
        open={Boolean(project)}
        onClose={closeProject}
        theme={card.appearance.themeId}
      />
    </div>
  )
}

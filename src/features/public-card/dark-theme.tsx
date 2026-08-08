import { ArrowUpRight, Circle } from 'lucide-react'

import type { CardView, Project } from '@shared/types'
import { Button } from '@/components/ui/button'
import { PublicActions } from '@/features/public-card/public-actions'
import { ProjectCover } from '@/features/public-card/theme-shared'
import { telegram } from '@/lib/telegram'
import { accentStyle } from '@/lib/accent-preset'
import { useTranslation } from 'react-i18next'
import { recordPublicEvent } from '@/services/public-analytics'
import { PublicLinks } from '@/features/public-card/public-links'
import { useLocaleText } from '@/i18n/use-locale-text'

export function DarkTheme({
  card,
  onProject,
  onLead,
  analyticsEnabled,
  publicUrl,
}: {
  card: CardView
  onProject: (project: Project) => void
  onLead: () => void
  analyticsEnabled: boolean
  publicUrl?: string
}) {
  const { t } = useTranslation()
  const l = useLocaleText()
  const projects = card.projects.filter((item) => item.enabled)
  return (
    <div
      style={accentStyle(card.appearance.accentPreset, true)}
      className="min-h-[100dvh] bg-[#111612] text-[#f0f3ef] [--surface:#171d19] [--surface-secondary:#1d251f] [--surface-elevated:#222c25] [--border:#303a33] [--border-strong:#465349] [--text-primary:#f0f3ef] [--text-secondary:#b4beb6] [--text-muted:#7f8c82]"
    >
      <header className="flex min-h-20 items-center justify-between border-b border-[#2b332d] px-5 font-mono text-[10px] uppercase tracking-[0.18em] lg:px-[5.5vw]">
        <span className="text-[var(--accent)]">AV / design + code</span>
        <nav className="hidden gap-8 md:flex">
          <a href="#dark-work">{t('publicCard.projects')}</a>
          <a href="#dark-services">{t('publicCard.services')}</a>
          <button onClick={onLead}>{t('publicCard.contacts')}</button>
        </nav>
        <PublicActions card={card} analyticsEnabled={analyticsEnabled} publicUrl={publicUrl} />
      </header>
      <main className="px-6 pb-20 pt-14 lg:px-[5.5vw] lg:pt-18">
        <section className="grid min-h-[430px] gap-12 lg:grid-cols-[1.4fr_0.8fr] lg:gap-24">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
              {card.profile.profession}
            </p>
            <h1 className="heading-font my-6 max-w-3xl text-[clamp(3.3rem,8vw,6.2rem)] font-normal leading-[0.88] tracking-[-0.055em]">
              {card.profile.displayName}
            </h1>
            <p className="max-w-[54ch] text-lg leading-relaxed text-[#b4beb6]">
              {card.profile.bio}
            </p>
            <Button
              data-accent-surface="primary"
              className="mt-5 min-w-64 rounded-lg font-mono text-xs uppercase tracking-[0.1em]"
              onClick={() => {
                if (analyticsEnabled)
                  recordPublicEvent(card.publication.slug, 'primary_cta_click', 'primary')
                telegram.openLink(card.primaryAction.value)
              }}
            >
              {card.primaryAction.label}
              <ArrowUpRight size={17} />
            </Button>
          </div>
          <div className="flex min-h-72 flex-col justify-between rounded-xl border border-[#384139] p-6 font-mono text-[10px] uppercase leading-6 text-[#b4beb6]">
            <p className="flex items-center gap-2 text-[var(--accent)]">
              <Circle size={7} fill="currentColor" />
              Available / Aug 2026
            </p>
            <div>
              {card.profile.location}
              <br />
              {card.profile.workFormat} / UTC +3
              <br />
              <br />
              {card.skills
                .slice(0, 4)
                .map((s) => s.label)
                .join(' / ')}
            </div>
          </div>
        </section>
        {projects.length > 0 ? (
          <section id="dark-work" className="mt-8">
            <div className="mb-5 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
              <span>
                {l('Избранные проекты', 'Selected work')} / 01–0{projects.length}
              </span>
              <button onClick={onLead}>{t('publicCard.services')} ↗</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {projects.map((project, index) => (
                <button key={project.id} onClick={() => onProject(project)} className="text-left">
                  <ProjectCover
                    project={project}
                    className={`aspect-[3/4] rounded-lg ${['[--project-color:#244236]', '[--project-color:#433528]', '[--project-color:#29384e]', '[--project-color:#3e2f41]'][index % 4]}`}
                  />
                  <span className="heading-font -mt-14 block px-5 pb-5 text-2xl">
                    {project.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        <section
          id="dark-services"
          className="mt-16 grid gap-px overflow-hidden rounded-xl border border-[#303a33] bg-[#303a33] md:grid-cols-3"
        >
          {card.services
            .filter((s) => s.enabled)
            .map((service) => (
              <article key={service.id} className="bg-[#171d19] p-6">
                <div className="font-mono text-[10px] uppercase text-[var(--accent)]">
                  {t('publicCard.services')}
                </div>
                <h2 className="heading-font text-xl">{service.title}</h2>
                <p className="text-sm text-[#b4beb6]">{service.description}</p>
              </article>
            ))}
        </section>
        <PublicLinks card={card} className="mt-8" analyticsEnabled={analyticsEnabled} />
      </main>
    </div>
  )
}

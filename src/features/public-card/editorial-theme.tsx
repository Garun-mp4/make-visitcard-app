import { ArrowUpRight } from 'lucide-react'
import type { CSSProperties } from 'react'

import type { CardView, Project } from '@shared/types'
import { LeadForm } from '@/features/public-card/lead-form'
import { PublicActions } from '@/features/public-card/public-actions'
import { PublicLinks } from '@/features/public-card/public-links'
import { editorialProjectColors, orderedPublicData } from '@/features/public-card/theme-data'
import { ProjectCover, ServicePrice } from '@/features/public-card/theme-shared'
import { accentStyle } from '@/lib/accent-preset'
import { telegram } from '@/lib/telegram'
import { recordPublicEvent } from '@/services/public-analytics'
import { useLocaleText } from '@/i18n/use-locale-text'

const roman = ['I', 'II', 'III', 'IV', 'V', 'VI']

export function EditorialTheme({
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
  const l = useLocaleText()
  const { skills, services, projects } = orderedPublicData(card)
  const primaryAction = () => {
    if (analyticsEnabled) recordPublicEvent(card.publication.slug, 'primary_cta_click', 'primary')
    telegram.openLink(card.primaryAction.value)
  }

  return (
    <div
      data-pen-public-card="editorial"
      style={accentStyle(card.appearance.accentPreset)}
      className="min-h-[100dvh] bg-[#f3ecdd] text-[#352b22] [--surface:#fff8eb] [--border:#bfb3a0] [--text-primary:#352b22] [--text-secondary:#6c5a48] [--text-muted:#7c6b59]"
    >
      <header
        data-pen-region="masthead"
        className="flex h-16 items-center justify-between border-b border-[#bfb3a0] px-5 md:h-[82px] md:px-[5vw]"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6c5a48]">
          <span className="md:hidden">Cardly / № 07</span>
          <span className="hidden md:inline">Cardly Journal / № 07</span>
        </span>
        <div className="md:hidden">
          <PublicActions
            card={card}
            analyticsEnabled={analyticsEnabled}
            publicUrl={publicUrl}
            variant="editorial"
          />
        </div>
        <nav className="hidden gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#6c5a48] md:flex">
          <a href="#editorial-work">Work</a>
          <span>·</span>
          <a href="#editorial-about">About</a>
          <span>·</span>
          <button onClick={onLead}>Contact</button>
          <span>·</span>
          <button onClick={() => navigator.share?.({ url: publicUrl })}>Share</button>
        </nav>
      </header>

      <main>
        <section
          data-pen-region="hero"
          id="editorial-about"
          className="grid gap-3.5 px-5 pb-[30px] pt-[34px] md:min-h-[500px] md:grid-cols-[minmax(0,760px)_450px] md:justify-center md:gap-[4.8vw] md:px-[5.5vw] md:py-16"
        >
          <div className="grid gap-3.5 md:content-start md:gap-[18px]">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
              {l('Продуктовый дизайн', 'Product design')} · {card.profile.location}
            </p>
            <h1
              aria-label={card.profile.displayName}
              className="editorial-font m-0 whitespace-pre-line text-[54px] font-semibold leading-[0.92] md:text-[78px] md:leading-[0.95]"
            >
              <span className="md:hidden">{card.profile.displayName.split(' ').join('\n')}</span>
              <span className="hidden md:inline">{card.profile.displayName}</span>
            </h1>
            <p className="editorial-font m-0 text-[22px] leading-[1.25] text-[#6c5a48] md:max-w-[700px] md:text-[30px]">
              {card.profile.profession}
            </p>
            <div className="flex min-h-[35px] items-center justify-between border-y border-[#bfb3a0] py-3 text-[9px] font-bold uppercase tracking-[0.12em] md:hidden">
              {card.appearance.showAvailability ? (
                <span className="text-[var(--accent)]">{card.profile.availabilityText}</span>
              ) : (
                <span />
              )}
              <span className="text-[#6c5a48]">{card.profile.workFormat}</span>
            </div>
            <p className="m-0 text-sm leading-[1.6] text-[#57483a] md:hidden">{card.profile.bio}</p>
            <button
              data-accent-surface="primary"
              onClick={primaryAction}
              className="flex min-h-[50px] items-center justify-between bg-[var(--accent)] px-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-contrast)] md:hidden"
            >
              {card.primaryAction.label}
              <ArrowUpRight size={20} />
            </button>
          </div>
          <aside className="hidden flex-col justify-between border-y border-[#bfb3a0] py-3 md:flex">
            <p className="m-0 text-[15px] leading-[1.65] text-[#57483a]">
              {card.profile.profession}.{' '}
              {l(
                'Исследую сценарии, выстраиваю структуру и довожу решения до реализации.',
                'I research scenarios, shape structure and carry solutions through implementation.',
              )}
            </p>
            <button
              onClick={primaryAction}
              className="text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]"
            >
              {card.profile.availabilityText} ↗
            </button>
          </aside>
        </section>

        <div className="grid gap-6 px-5 pb-[30px] pt-2 md:grid-cols-[360px_minmax(0,886px)] md:justify-center md:gap-[34px] md:px-[5.5vw] md:pb-16 md:pt-6">
          <div className="grid content-start gap-6">
            {card.appearance.showSkills ? (
              <section className="md:hidden">
                <h2 className="editorial-font m-0 text-[25px] font-semibold">
                  01 / {l('Что я делаю', 'What I do')}
                </h2>
                <p className="mt-4 text-[13px] leading-[1.65] text-[#57483a]">
                  {skills.map((skill) => skill.label).join(' · ')}
                </p>
              </section>
            ) : null}
            {card.appearance.showServices && services.length > 0 ? (
              <section data-pen-region="services" id="editorial-services">
                <h2 className="editorial-font m-0 text-[25px] font-semibold md:text-[28px]">
                  02 / {l('Форматы работы', 'Work formats')}
                </h2>
                <div className="mt-2">
                  {services.map((service, index) => (
                    <article
                      key={service.id}
                      className="flex gap-3.5 border-b border-[#bfb3a0] py-3.5"
                    >
                      <span className="editorial-font text-lg text-[var(--accent)]">
                        {roman[index]}
                      </span>
                      <div className="grid min-w-0 flex-1 gap-1.5">
                        <h3 className="editorial-font m-0 text-xl font-semibold">
                          {service.title}
                        </h3>
                        <p className="m-0 text-xs leading-[1.45] text-[#6c5a48]">
                          {service.description}
                        </p>
                        <span className="text-[11px] font-bold text-[var(--accent)]">
                          <ServicePrice card={{ ...card, services }} index={index} />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="grid content-start gap-6">
            {card.appearance.showProjects && projects.length > 0 ? (
              <section data-pen-region="projects" id="editorial-work">
                <h2 className="editorial-font mb-6 mt-0 text-[25px] font-semibold md:hidden">
                  03 / {l('Избранные проекты', 'Featured projects')}
                </h2>
                <div className="grid gap-6 md:grid-cols-3 md:gap-[18px]">
                  {projects.slice(0, 4).map((project, index) => (
                    <button
                      key={project.id}
                      onClick={() => onProject(project)}
                      className={`text-left ${index > 2 ? 'md:hidden' : ''}`}
                    >
                      <ProjectCover
                        project={project}
                        style={
                          {
                            '--project-color':
                              editorialProjectColors[index % editorialProjectColors.length],
                          } as CSSProperties
                        }
                        className="flex h-44 items-end p-4 md:h-[600px] md:p-6"
                      >
                        <span className="editorial-font text-[28px] font-semibold">
                          {project.title}
                        </span>
                      </ProjectCover>
                      <div className="flex justify-between border-b border-[#bfb3a0] py-2.5 text-[9px] font-bold uppercase tracking-[0.1em] md:hidden">
                        <span className="text-[#6c5a48]">{project.category}</span>
                        <span className="text-[var(--accent)]">{l('Открыть', 'Open')} ↗</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="editorial-font m-0 text-[25px] font-semibold">
                  04 / {l('Напишите мне', 'Contact me')}
                </h2>
                <PublicLinks
                  card={card}
                  variant="editorial"
                  analyticsEnabled={analyticsEnabled}
                  className="mt-4"
                />
              </div>
              {card.appearance.showContactForm ? (
                <div
                  id="public-lead-form"
                  data-pen-region="lead-form"
                  className="border-y border-[#bfb3a0] py-[18px]"
                >
                  <LeadForm
                    slug={card.publication.slug}
                    ownerName={card.profile.displayName}
                    previewMode={!analyticsEnabled}
                    variant="editorial"
                  />
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

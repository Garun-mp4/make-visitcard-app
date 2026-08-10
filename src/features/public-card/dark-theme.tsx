import { ArrowUpRight, Circle } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import type { CardView, Project } from '@shared/types'
import { Avatar } from '@/components/ui/avatar'
import { LeadForm } from '@/features/public-card/lead-form'
import { PublicActions } from '@/features/public-card/public-actions'
import { ContactSaveButton } from '@/components/contact/contact-save-button'
import { PublicLinks } from '@/features/public-card/public-links'
import { darkProjectColors, orderedPublicData } from '@/features/public-card/theme-data'
import { ProjectCover, ServicePrice } from '@/features/public-card/theme-shared'
import { accentStyle } from '@/lib/accent-preset'
import { telegram } from '@/lib/telegram'
import { recordPublicEvent } from '@/services/public-analytics'
import { useLocaleText } from '@/i18n/use-locale-text'
import { usePublicCardShare } from '@/features/public-card/use-public-card-share'

function SectionHeader({ number, children }: { number: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
      <span className="text-[10px] font-normal text-[var(--accent)]">{number}</span>
      {children}
    </div>
  )
}

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
  const l = useLocaleText()
  const { skills, services, projects } = orderedPublicData(card)
  const share = usePublicCardShare({
    card,
    publicUrl: publicUrl ?? window.location.href,
    analyticsEnabled,
  })
  const primaryAction = () => {
    if (analyticsEnabled) recordPublicEvent(card.publication.slug, 'primary_cta_click', 'primary')
    telegram.openLink(card.primaryAction.value)
  }

  return (
    <div
      data-pen-public-card="dark"
      style={accentStyle(card.appearance.accentPreset, true)}
      className="min-h-[100dvh] bg-[#141613] text-[#f3f4f1] [--surface:#1c201b] [--border:#343a31] [--text-primary:#f3f4f1] [--text-secondary:#b9c0b6] [--text-muted:#7f887b]"
    >
      <header
        data-pen-region="masthead"
        className="flex h-[60px] items-center justify-between border-b border-[#2d312b] px-5 md:h-20 md:px-[4.45vw]"
      >
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
          <span className="md:hidden">Cardly / AV</span>
          <span className="hidden md:inline">AV / design + code</span>
        </span>
        <div className="md:hidden">
          <PublicActions
            card={card}
            analyticsEnabled={analyticsEnabled}
            publicUrl={publicUrl}
            variant="dark"
          />
        </div>
        <nav className="hidden gap-8 font-mono text-[10px] uppercase tracking-[0.12em] text-[#b9c0b6] md:flex">
          <a href="#dark-work">Work</a>
          <a href="#dark-services">Services</a>
          <button onClick={onLead}>Contact</button>
          <ContactSaveButton
            card={card}
            publicUrl={publicUrl}
            className="min-h-11 text-[var(--accent)]"
          >
            {l('Сохранить контакт', 'Save contact')}
          </ContactSaveButton>
          <button onClick={() => void share()}>Share ↗</button>
        </nav>
      </header>

      <main>
        <section
          data-pen-region="hero"
          className="grid gap-3.5 px-[22px] pb-8 pt-[34px] md:min-h-[520px] md:grid-cols-[minmax(0,780px)_450px] md:justify-center md:gap-[3.5vw] md:px-[5.5vw] md:py-[72px]"
        >
          <div className="grid gap-3.5 md:content-start md:gap-[18px]">
            <div className="flex items-center gap-4 md:hidden">
              <Avatar
                name={card.profile.displayName}
                src={card.profile.avatarUrl}
                shape="rounded"
                className="!size-[76px] !rounded-[18px] border border-[var(--accent)] !bg-[#2a3029] !font-mono !text-[22px]"
              />
              <div>
                <h1 className="heading-font m-0 text-[27px] font-semibold leading-[35px]">
                  {card.profile.displayName}
                </h1>
                {card.appearance.showAvailability ? (
                  <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7ec8a5]">
                    ● {card.profile.availabilityText}
                  </p>
                ) : null}
              </div>
            </div>
            <p className="m-0 font-mono text-[13px] text-[var(--accent)] md:text-[11px] md:uppercase md:tracking-[0.14em]">
              {card.profile.profession}
            </p>
            <h1 className="heading-font m-0 hidden whitespace-pre-line text-[76px] font-semibold leading-[0.92] md:block">
              {card.profile.displayName.split(' ').join('\n')}
            </h1>
            <p className="m-0 text-[15px] leading-[1.5] text-[#b9c0b6] md:max-w-[620px] md:text-lg md:leading-[1.55]">
              {card.profile.bio}
            </p>
            <button
              data-accent-surface="primary"
              onClick={primaryAction}
              className="flex min-h-[52px] w-full items-center justify-between rounded-md bg-[var(--accent)] px-4 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--accent-contrast)] md:w-[310px] md:min-h-[54px] md:px-[18px]"
            >
              {card.primaryAction.label}
              <ArrowUpRight size={18} />
            </button>
          </div>
          <aside className="hidden min-h-[376px] flex-col justify-between rounded-[10px] border border-[#343a31] p-6 font-mono text-[11px] uppercase leading-[1.9] text-[#b9c0b6] md:flex">
            {card.appearance.showAvailability ? (
              <span className="flex items-center gap-2 text-[10px] tracking-[0.12em] text-[#7ec8a5]">
                <Circle size={7} fill="currentColor" /> {card.profile.availabilityText}
              </span>
            ) : (
              <span />
            )}
            <p className="m-0">
              {card.profile.location}
              <br />
              {card.profile.workFormat}
              <br />
              UTC +3
              <br />
              <br />
              {skills
                .slice(0, 6)
                .map((skill) => skill.label)
                .join(' / ')}
            </p>
          </aside>
        </section>

        <div className="grid gap-[22px] px-[22px] pb-8 pt-2 md:px-[5.5vw] md:pb-16 md:pt-2.5">
          {card.appearance.showSkills ? (
            <section id="dark-skills" className="md:hidden">
              <SectionHeader number="01">
                <h2 className="m-0 text-inherit">{l('Навыки', 'Skills')}</h2>
              </SectionHeader>
              <p className="mt-[22px] font-mono text-xs leading-6 text-[#aeb6ab]">
                {skills.map((skill) => skill.label).join(' / ')}
              </p>
            </section>
          ) : null}

          {card.appearance.showServices && services.length > 0 ? (
            <section data-pen-region="services" id="dark-services" className="md:hidden">
              <SectionHeader number="02">
                <h2 className="m-0 text-inherit">{l('Услуги', 'Services')}</h2>
              </SectionHeader>
              <div className="mt-[22px] grid">
                {services.map((service, index) => (
                  <article
                    key={service.id}
                    className="flex min-h-[70px] items-center justify-between border-b border-[#343a31]"
                  >
                    <h3 className="heading-font m-0 text-base font-semibold">{service.title}</h3>
                    <span className="font-mono text-[11px] text-[var(--accent)]">
                      <ServicePrice card={{ ...card, services }} index={index} />
                    </span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {card.appearance.showProjects && projects.length > 0 ? (
            <section data-pen-region="projects" id="dark-work">
              <div className="mb-[22px] md:flex md:items-center md:justify-between">
                <div className="md:hidden">
                  <SectionHeader number="03">
                    <h2 className="m-0 text-inherit">{l('Проекты', 'Projects')}</h2>
                  </SectionHeader>
                </div>
                <h2 className="m-0 hidden font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--accent)] md:block">
                  Selected work / 01—{String(projects.length).padStart(2, '0')}
                </h2>
                <button
                  onClick={onLead}
                  className="hidden font-mono text-[10px] uppercase text-[#b9c0b6] md:block"
                >
                  Services ↗
                </button>
              </div>
              <div className="grid gap-[22px] md:grid-cols-4 md:gap-[18px]">
                {projects.map((project, index) => (
                  <button key={project.id} onClick={() => onProject(project)} className="text-left">
                    <ProjectCover
                      project={project}
                      style={
                        {
                          '--project-color': darkProjectColors[index % darkProjectColors.length],
                        } as CSSProperties
                      }
                      className="flex h-[150px] flex-col justify-between rounded-[10px] p-4 md:h-[540px] md:rounded-lg md:p-6"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
                        Case / {project.category || project.title}
                      </span>
                      <span className="heading-font text-[22px] font-semibold text-white md:text-2xl">
                        {project.title}
                      </span>
                    </ProjectCover>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-[22px] md:grid-cols-2">
            <div>
              <div className="md:hidden">
                <SectionHeader number="04">
                  <h2 className="m-0 text-inherit">{l('Контакт', 'Contact')}</h2>
                </SectionHeader>
              </div>
              <PublicLinks
                card={card}
                variant="dark"
                analyticsEnabled={analyticsEnabled}
                className="mt-[22px]"
              />
            </div>
            {card.appearance.showContactForm ? (
              <div
                id="public-lead-form"
                data-pen-region="lead-form"
                className="rounded-[10px] border border-[#343a31] bg-[#1c201b] p-[18px]"
              >
                <LeadForm
                  slug={card.publication.slug}
                  ownerName={card.profile.displayName}
                  previewMode={!analyticsEnabled}
                  variant="dark"
                />
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}

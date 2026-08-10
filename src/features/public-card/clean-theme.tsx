import { ArrowRight, Circle, UserRoundPlus } from 'lucide-react'
import type { CSSProperties } from 'react'

import type { CardView, Project } from '@shared/types'
import { Avatar } from '@/components/ui/avatar'
import { LeadForm } from '@/features/public-card/lead-form'
import { ContactSaveButton } from '@/components/contact/contact-save-button'
import { PublicActions } from '@/features/public-card/public-actions'
import { PublicLinks } from '@/features/public-card/public-links'
import {
  cardInitials,
  cleanProjectColors,
  orderedPublicData,
} from '@/features/public-card/theme-data'
import { ProjectCover, ServicePrice } from '@/features/public-card/theme-shared'
import { accentStyle } from '@/lib/accent-preset'
import { telegram } from '@/lib/telegram'
import { recordPublicEvent } from '@/services/public-analytics'
import { useLocaleText } from '@/i18n/use-locale-text'
import { usePublicCardShare } from '@/features/public-card/use-public-card-share'

export function CleanTheme({
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
      data-pen-public-card="clean"
      style={accentStyle(card.appearance.accentPreset)}
      className="min-h-[100dvh] bg-[#f8f8f5] text-[#171916] [--surface:#fff] [--border:#e1e4de] [--text-primary:#171916] [--text-secondary:#555b52] [--text-muted:#7a8176]"
    >
      <header
        data-pen-region="masthead"
        className="flex h-[60px] items-center justify-between border-b border-transparent px-[18px] md:h-[70px] md:border-[#e1e4de] md:px-8 lg:h-20 lg:px-[72px]"
      >
        <div className="heading-font text-sm font-semibold md:text-[15px]">
          <span className="md:hidden">cardly</span>
          <span className="hidden md:inline">cardly / {card.profile.displayName}</span>
        </div>
        <nav className="hidden items-center gap-7 text-[13px] text-[#555b52] lg:flex">
          {card.appearance.showSkills ? <a href="#skills">{l('Навыки', 'Skills')}</a> : null}
          {card.appearance.showServices ? <a href="#services">{l('Услуги', 'Services')}</a> : null}
          {card.appearance.showProjects ? <a href="#projects">{l('Проекты', 'Projects')}</a> : null}
          {card.appearance.showContactForm ? (
            <a href="#public-lead-form">{l('Контакты', 'Contact')}</a>
          ) : null}
        </nav>
        <div className="md:hidden">
          <PublicActions card={card} analyticsEnabled={analyticsEnabled} publicUrl={publicUrl} />
        </div>
        <button
          onClick={() => void share()}
          className="hidden text-xs font-semibold text-[var(--accent)] md:block lg:hidden"
        >
          {l('Поделиться ↗', 'Share ↗')}
        </button>
        <div className="hidden items-center gap-2 lg:flex">
          <ContactSaveButton
            card={card}
            publicUrl={publicUrl}
            className="grid size-11 place-items-center rounded-[10px] border border-[#e1e4de] bg-white text-[#444a42]"
          >
            <UserRoundPlus size={18} aria-hidden="true" />
          </ContactSaveButton>
          <button
            onClick={onLead}
            className="min-h-11 rounded-[10px] bg-[var(--accent)] px-[18px] text-[13px] font-semibold text-[var(--accent-contrast)]"
          >
            {l('Написать', 'Contact')}
          </button>
        </div>
      </header>

      <main>
        <section
          data-pen-region="hero"
          className="flex flex-col items-center gap-3 px-6 pb-7 pt-[30px] text-center md:grid md:min-h-[279px] md:grid-cols-[160px_minmax(0,490px)] md:items-center md:gap-[30px] md:px-11 md:py-[46px] md:text-left lg:min-h-[470px] lg:grid-cols-[680px_360px] lg:justify-start lg:gap-[72px] lg:px-[100px] lg:py-16"
        >
          <div className="contents md:col-start-2 md:row-start-1 md:block lg:col-start-1">
            <div className="order-1 md:hidden">
              <Avatar
                name={card.profile.displayName}
                src={card.profile.avatarUrl}
                shape={card.appearance.avatarShape}
                className="!size-24 !text-[28px]"
              />
            </div>
            {card.appearance.showAvailability ? (
              <p className="order-4 m-0 text-xs text-[var(--accent)] md:hidden lg:order-none lg:mb-[18px] lg:flex lg:items-center lg:gap-2 lg:text-[11px] lg:font-bold lg:uppercase lg:tracking-[0.12em]">
                <Circle className="hidden lg:block" size={8} fill="currentColor" />
                <span className="hidden lg:inline">
                  {l('Доступен для нового проекта', 'Available for a new project')}
                </span>
                <span className="md:hidden">
                  {card.profile.location} · {card.profile.workFormat} ·{' '}
                  {card.profile.availabilityText}
                </span>
              </p>
            ) : null}
            <h1 className="heading-font order-2 m-0 text-[28px] font-semibold leading-[36px] md:text-[38px] md:leading-[49px] lg:text-[58px] lg:leading-[1.1]">
              {card.profile.displayName}
            </h1>
            <p className="heading-font order-3 m-0 text-sm text-[#555b52] md:mt-3 md:text-[15px] lg:mt-[18px] lg:text-2xl lg:font-medium">
              {card.profile.profession}
            </p>
            <p className="order-5 m-0 max-w-[620px] text-sm leading-[1.5] text-[#555b52] md:mt-3 md:text-sm lg:mt-[18px] lg:text-[17px] lg:leading-[1.55]">
              {card.profile.bio}
            </p>
            <div className="order-6 mt-0 flex w-full gap-3 md:mt-3 md:w-[260px] lg:mt-[18px] lg:w-auto">
              <button
                data-accent-surface="primary"
                onClick={primaryAction}
                className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-contrast)] lg:flex-none"
              >
                {card.primaryAction.label}
              </button>
              {projects.length ? (
                <button
                  onClick={() =>
                    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="hidden min-h-[52px] rounded-xl border border-[#e1e4de] bg-white px-5 text-sm font-semibold lg:block"
                >
                  {l('Смотреть проекты', 'View projects')}
                </button>
              ) : null}
            </div>
          </div>
          <div className="hidden h-[180px] w-[160px] flex-col justify-end rounded-[20px] bg-[var(--accent-soft)] p-[18px] text-[var(--accent)] md:col-start-1 md:row-start-1 md:flex lg:hidden">
            <span className="heading-font text-[42px] font-semibold">
              {cardInitials(card.profile.displayName)}
            </span>
          </div>
          <div className="hidden h-[340px] w-[360px] flex-col justify-between rounded-3xl bg-[var(--accent-soft)] p-6 text-[var(--accent)] lg:flex">
            <span className="heading-font text-7xl font-semibold">
              {cardInitials(card.profile.displayName)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
              {card.profile.location} · {card.profile.workFormat}
            </span>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1440px] gap-[22px] px-5 pb-[30px] pt-2 md:px-11 md:pb-11 md:pt-2.5 lg:gap-7 lg:px-[100px] lg:pb-16 lg:pt-5">
          {card.appearance.showSkills || (card.appearance.showServices && services.length > 0) ? (
            <section className="grid gap-[22px] lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6">
              {card.appearance.showSkills ? (
                <>
                  <div
                    id="skills"
                    className="md:hidden lg:block lg:min-h-[300px] lg:rounded-[18px] lg:bg-[#eef2ee] lg:p-6"
                  >
                    <h2 className="heading-font m-0 text-[19px] font-semibold md:text-2xl">
                      {l('Навыки', 'Skills')}
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-2 lg:mt-5">
                      {skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded-full bg-[#eef2ee] px-2.5 py-2 text-[11px] font-semibold text-[#435046] lg:bg-transparent lg:px-0 lg:py-0 lg:text-sm lg:font-normal"
                        >
                          {skill.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="m-0 hidden text-[13px] leading-[1.6] text-[#555b52] md:block lg:hidden">
                    {skills.map((skill) => skill.label).join(' · ')}
                  </p>
                </>
              ) : null}
              {card.appearance.showServices && services.length > 0 ? (
                <div data-pen-region="services" id="services">
                  <h2 className="heading-font mb-4 mt-0 text-[19px] font-semibold md:hidden">
                    {l('Услуги', 'Services')}
                  </h2>
                  <div className="grid gap-[22px] md:grid-cols-3 md:gap-3.5 lg:gap-4">
                    {services.map((service, index) => (
                      <article
                        key={service.id}
                        className="grid min-h-[99px] content-start gap-[7px] rounded-[14px] border border-[#e1e4de] bg-white p-4 md:min-h-[210px] md:gap-2.5 lg:min-h-[300px] lg:rounded-[18px] lg:p-6"
                      >
                        <h3 className="heading-font m-0 text-base font-semibold md:text-xl">
                          {service.title}
                        </h3>
                        <p className="m-0 text-xs leading-[1.4] text-[#555b52] md:text-sm md:leading-relaxed">
                          {service.description}
                        </p>
                        <div className="text-xs font-semibold text-[var(--accent)] md:mt-2 md:text-sm">
                          <ServicePrice card={{ ...card, services }} index={index} />
                          {service.durationText ? ` · ${service.durationText}` : ''}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {card.appearance.showProjects && projects.length > 0 ? (
            <section data-pen-region="projects" id="projects">
              <h2 className="heading-font mb-4 mt-0 text-[19px] font-semibold md:hidden lg:block lg:text-[26px]">
                {l('Избранные проекты', 'Featured projects')}
              </h2>
              <div className="grid gap-[22px] md:grid-cols-2 md:gap-3.5 lg:grid-cols-4 lg:gap-[18px]">
                {projects.map((project, index) => (
                  <button
                    key={project.id}
                    onClick={() => onProject(project)}
                    className={`text-left ${index > 1 ? 'md:hidden lg:block' : ''}`}
                  >
                    <ProjectCover
                      project={project}
                      style={
                        {
                          '--project-color': cleanProjectColors[index % cleanProjectColors.length],
                        } as CSSProperties
                      }
                      className="flex h-32 items-center gap-3.5 rounded-[14px] border border-[#e1e4de] bg-white p-3 md:h-[250px] md:flex-col md:items-stretch md:justify-between md:border-0 md:p-[18px] lg:p-5"
                    >
                      <div
                        style={{
                          background: cleanProjectColors[index % cleanProjectColors.length],
                        }}
                        className="grid h-[104px] w-[116px] shrink-0 place-items-center rounded-[10px] text-lg font-semibold text-[var(--accent)] md:hidden"
                      >
                        {cardInitials(project.title)}
                      </div>
                      <div className="grid gap-1.5 md:contents">
                        <span className="text-[9px] font-bold uppercase tracking-[0.11em] text-[#7a8176]">
                          {project.category}
                        </span>
                        <span className="heading-font text-base font-semibold md:text-xl">
                          {project.title}
                        </span>
                        <ArrowRight className="hidden md:block" size={18} />
                      </div>
                    </ProjectCover>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-[22px] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-[14px] bg-[#eef2ee] p-4 md:p-6">
              <h2 className="heading-font m-0 text-[17px] font-semibold">
                {l('Связаться', 'Contact')}
              </h2>
              <PublicLinks
                card={card}
                variant="clean"
                analyticsEnabled={analyticsEnabled}
                className="mt-2.5"
              />
            </div>
            {card.appearance.showContactForm ? (
              <div
                id="public-lead-form"
                data-pen-region="lead-form"
                className="rounded-2xl border border-[#e1e4de] bg-white p-[18px]"
              >
                <LeadForm
                  slug={card.publication.slug}
                  ownerName={card.profile.displayName}
                  previewMode={!analyticsEnabled}
                  variant="clean"
                />
              </div>
            ) : null}
          </section>
          <footer className="text-[10px] text-[#7a8176]">
            {l(
              'Сделано в Cardly · Политика конфиденциальности',
              'Made with Cardly · Privacy policy',
            )}
          </footer>
        </div>
      </main>
    </div>
  )
}

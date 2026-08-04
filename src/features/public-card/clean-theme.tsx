import { ArrowRight, Circle } from 'lucide-react'

import type { CardDraft, Project } from '@shared/types'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { PublicActions } from '@/features/public-card/public-actions'
import { ProjectCover, ServicePrice } from '@/features/public-card/theme-shared'
import { telegram } from '@/lib/telegram'

export function CleanTheme({
  card,
  onProject,
  onLead,
}: {
  card: CardDraft
  onProject: (project: Project) => void
  onLead: () => void
}) {
  const skills = card.skills.slice().sort((a, b) => a.position - b.position)
  const services = card.services
    .filter((item) => item.enabled)
    .sort((a, b) => a.position - b.position)
  const projects = card.projects
    .filter((item) => item.enabled)
    .sort((a, b) => a.position - b.position)
  return (
    <div className="min-h-[100dvh] bg-[#fafbf8] text-[#171916] [--accent:#1f6b4f] [--accent-hover:#17563f] [--accent-soft:#e0eee7] [--surface:#fff] [--border:#dfe3dd] [--text-primary:#171916] [--text-secondary:#5d645b] [--text-muted:#7a8176]">
      <header className="mx-auto flex min-h-20 max-w-[1240px] items-center justify-between border-b border-[#e8ebe6] px-5 lg:px-10">
        <div className="heading-font text-sm">cardly / {card.profile.displayName}</div>
        <nav className="hidden gap-8 text-xs text-[#555b52] md:flex">
          <a href="#skills">Навыки</a>
          <a href="#services">Услуги</a>
          <a href="#projects">Проекты</a>
          <a href="#contacts">Контакты</a>
        </nav>
        <PublicActions card={card} />
      </header>
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-12 lg:px-10 lg:pt-16">
        <section className="grid gap-10 lg:grid-cols-[1.65fr_0.9fr] lg:items-center lg:gap-20">
          <div className="max-w-2xl">
            {card.appearance.showAvailability ? (
              <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#25845f]">
                <Circle size={8} fill="currentColor" aria-hidden="true" />
                {card.profile.availabilityText}
              </p>
            ) : null}
            <div className="flex items-center gap-5 lg:hidden">
              <Avatar
                name={card.profile.displayName}
                src={card.profile.avatarUrl}
                size="lg"
                shape={card.appearance.avatarShape}
              />
            </div>
            <h1 className="heading-font my-5 text-[clamp(2.5rem,7vw,4rem)] font-medium leading-[0.98] tracking-[-0.045em]">
              {card.profile.displayName}
            </h1>
            <p className="heading-font m-0 text-xl font-medium text-[#596157] lg:text-2xl">
              {card.profile.profession}
            </p>
            <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-[#596157] lg:text-lg">
              {card.profile.bio}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => telegram.openLink(card.primaryAction.value)}>
                {card.primaryAction.label}
              </Button>
              {projects.length > 0 ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  Смотреть проекты
                </Button>
              ) : null}
            </div>
          </div>
          <div className="hidden aspect-square max-w-[360px] rounded-[24px] bg-[#dce9e2] p-8 lg:flex lg:flex-col lg:justify-between">
            <div className="text-6xl font-medium text-[#1f6b4f]">
              {card.profile.displayName
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f6b4f]">
              {card.profile.location} · {card.profile.workFormat}
            </div>
          </div>
        </section>
        <section id="skills" className="mt-20 grid gap-5 lg:grid-cols-[1.2fr_2.8fr]">
          {card.appearance.showSkills ? (
            <div className="rounded-2xl bg-[#eef3ef] p-6">
              <h2 className="heading-font m-0 text-2xl">Навыки</h2>
              <div className="mt-5 grid gap-2 text-sm text-[#596157]">
                {skills.map((skill) => (
                  <span key={skill.id}>{skill.label}</span>
                ))}
              </div>
            </div>
          ) : null}
          {card.appearance.showServices && services.length > 0 ? (
            <div id="services" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <article
                  key={service.id}
                  className="min-h-56 rounded-2xl border border-[#dfe3dd] bg-white p-6"
                >
                  <h3 className="heading-font m-0 text-xl font-semibold">{service.title}</h3>
                  <p className="text-sm leading-relaxed text-[#666d64]">{service.description}</p>
                  <div className="mt-5 text-sm font-semibold text-[#1f6b4f]">
                    <ServicePrice card={card} index={index} /> · {service.durationText}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
        {card.appearance.showProjects && projects.length > 0 ? (
          <section id="projects" className="mt-12">
            <h2 className="heading-font text-3xl">Избранные проекты</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {projects.map((project, index) => (
                <button
                  key={project.id}
                  onClick={() => onProject(project)}
                  className="group text-left"
                >
                  <ProjectCover
                    project={project}
                    className={`aspect-[4/3] rounded-2xl ${['[--project-color:#dce9e2]', '[--project-color:#e9e1d3]', '[--project-color:#dde4ef]', '[--project-color:#e8ddea]'][index % 4]}`}
                  />
                  <span className="heading-font mt-3 flex items-center justify-between text-xl">
                    {project.title}
                    <ArrowRight
                      className="opacity-0 transition group-hover:opacity-100"
                      size={18}
                    />
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {card.appearance.showContactForm ? (
          <section
            id="contacts"
            className="mt-16 grid gap-6 rounded-3xl border border-[#dfe3dd] bg-white p-6 lg:grid-cols-[1fr_auto] lg:items-center"
          >
            <div>
              <h2 className="heading-font m-0 text-3xl">Есть задача?</h2>
              <p className="mb-0 text-[#596157]">
                Оставьте короткую заявку — форма займёт меньше минуты.
              </p>
            </div>
            <Button onClick={onLead}>Написать</Button>
          </section>
        ) : null}
      </main>
    </div>
  )
}

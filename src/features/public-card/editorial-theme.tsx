import { ArrowUpRight } from 'lucide-react'

import type { CardDraft, Project } from '@shared/types'
import { PublicActions } from '@/features/public-card/public-actions'
import { ProjectCover } from '@/features/public-card/theme-shared'
import { formatPrice } from '@/lib/utils'
import { telegram } from '@/lib/telegram'

export function EditorialTheme({
  card,
  onProject,
  onLead,
}: {
  card: CardDraft
  onProject: (project: Project) => void
  onLead: () => void
}) {
  const projects = card.projects.filter((project) => project.enabled)
  return (
    <div className="min-h-[100dvh] bg-[#f4ecdc] text-[#34281f] [--surface:#f8f1e4] [--surface-secondary:#eee2cf] [--border:#d9cbb5] [--text-primary:#34281f] [--text-secondary:#715f50] [--text-muted:#8a7564] [--accent:#a94e32] [--accent-hover:#913e27] [--accent-soft:#ead8c7] [--accent-contrast:#fff]">
      <header className="flex min-h-20 items-center justify-between border-b border-[#d7c8b2] px-5 font-mono text-[10px] uppercase tracking-[0.13em] lg:px-[5.5vw]">
        <span>Cardly Journal / № 07</span>
        <nav className="hidden gap-4 md:flex">
          <a href="#editorial-work">Work</a>
          <button onClick={onLead}>Contact</button>
        </nav>
        <PublicActions card={card} />
      </header>
      <main className="px-6 pb-20 pt-14 lg:px-[5.5vw]">
        <section className="grid min-h-[470px] gap-12 lg:grid-cols-[1.45fr_0.85fr] lg:gap-28">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a94e32]">
              Product design / Moscow
            </p>
            <h1 className="my-6 font-serif text-[clamp(3rem,7vw,5.5rem)] font-bold leading-[0.93] tracking-[-0.035em]">
              {card.profile.displayName}
            </h1>
            <p className="max-w-[22ch] font-serif text-2xl italic leading-relaxed text-[#715f50] lg:text-3xl">
              {card.profile.bio}
            </p>
          </div>
          <div className="grid content-between border-y border-[#d7c8b2] py-5">
            <p className="m-0 leading-relaxed text-[#715f50]">
              {card.profile.profession}. Исследую сценарии, выстраиваю структуру и довожу решения до
              реализации.
            </p>
            <button
              onClick={() => telegram.openLink(card.primaryAction.value)}
              className="flex min-h-14 items-center justify-between border-t border-[#d7c8b2] pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a94e32]"
            >
              {card.profile.availabilityText}
              <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
        <section id="editorial-work" className="grid gap-8 lg:grid-cols-[0.95fr_2.35fr] lg:gap-9">
          <div>
            <h2 className="border-b border-[#d7c8b2] pb-4 font-serif text-3xl">
              01 / Форматы работы
            </h2>
            {card.services
              .filter((s) => s.enabled)
              .map((service, index) => (
                <article key={service.id} className="border-b border-[#d7c8b2] py-5">
                  <div className="font-serif italic text-[#a94e32]">
                    {['I', 'II', 'III', 'IV'][index]}
                  </div>
                  <h3 className="font-serif text-2xl">{service.title}</h3>
                  {service.price ? (
                    <p className="font-mono text-[10px] font-semibold">
                      {service.priceType === 'from' ? 'от ' : ''}
                      {formatPrice(service.price, service.currency)}
                    </p>
                  ) : null}
                </article>
              ))}
          </div>
          {projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 3).map((project, index) => (
                <button key={project.id} onClick={() => onProject(project)} className="text-left">
                  <ProjectCover
                    project={project}
                    className={`aspect-[2/4] ${['[--project-color:#bdccbf]', '[--project-color:#ddc6a7]', '[--project-color:#bac5d8]'][index % 3]}`}
                  />
                  <span className="-mt-16 block px-6 pb-6 font-serif text-3xl">
                    {project.title}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </section>
        {card.appearance.showContactForm ? (
          <section className="mt-16 border-y border-[#d7c8b2] py-8">
            <button
              onClick={onLead}
              className="flex w-full items-center justify-between bg-[#a94e32] p-5 font-mono text-xs uppercase tracking-[0.14em] text-white"
            >
              Написать <ArrowUpRight />
            </button>
          </section>
        ) : null}
      </main>
    </div>
  )
}

import type { CardDraft } from '@shared/types'
import { Avatar } from '@/components/ui/avatar'

export function MiniCardPreview({ card }: { card: CardDraft }) {
  const service = card.services.find((item) => item.enabled)
  const dark = card.appearance.themeId === 'dark'
  const editorial = card.appearance.themeId === 'editorial'
  return (
    <article
      className={`${dark ? 'bg-[#111612] text-[#f1f4f0] [--mini-muted:#aab4ac] [--mini-accent:#dca56d]' : editorial ? 'bg-[#f4ecdc] text-[#34281f] [--mini-muted:#715f50] [--mini-accent:#a94e32]' : 'bg-[#fbfcf9] text-[#171916] [--mini-muted:#60675e] [--mini-accent:#1f6b4f]'} min-h-[590px] overflow-hidden p-5`}
    >
      <div
        className={`flex items-center justify-between text-[11px] ${editorial ? 'font-mono uppercase tracking-[0.12em]' : dark ? 'font-mono uppercase tracking-[0.13em] text-[#dca56d]' : ''}`}
      >
        <span>{editorial ? 'Cardly / № 07' : dark ? 'Cardly / AV' : 'cardly'}</span>
        <span>•••</span>
      </div>
      <div
        className={`${editorial || dark ? 'items-start text-left' : 'items-center text-center'} mt-12 flex flex-col`}
      >
        {!dark && !editorial ? (
          <Avatar
            name={card.profile.displayName}
            src={card.profile.avatarUrl}
            size="lg"
            shape={card.appearance.avatarShape}
          />
        ) : null}
        <h2
          className={`${editorial ? 'font-serif text-4xl' : 'heading-font text-3xl'} mb-2 mt-5 max-w-full break-words font-semibold leading-none`}
        >
          {card.profile.displayName}
        </h2>
        <p className="m-0 text-sm text-[var(--mini-muted)]">{card.profile.profession}</p>
        <p
          className={`${editorial ? 'font-serif text-xl italic' : ''} mt-5 line-clamp-4 text-sm leading-relaxed text-[var(--mini-muted)]`}
        >
          {card.profile.bio}
        </p>
        <div className="mt-5 w-full rounded-xl bg-[var(--mini-accent)] px-4 py-4 text-center text-sm font-semibold text-white">
          {card.primaryAction.label}
        </div>
      </div>
      {card.appearance.showSkills ? (
        <p className="mt-10 text-xs leading-relaxed text-[var(--mini-muted)]">
          {card.skills
            .slice(0, 5)
            .map((skill) => skill.label)
            .join(' · ')}
        </p>
      ) : null}
      {service && card.appearance.showServices ? (
        <div
          className={`mt-4 min-h-44 p-5 ${dark ? 'border border-[#303a33]' : editorial ? 'border-y border-[#d7c8b2]' : 'rounded-2xl border border-[#dfe3dd] bg-white'}`}
        >
          <h3 className={`${editorial ? 'font-serif' : 'heading-font'} m-0 text-lg font-semibold`}>
            {service.title}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--mini-muted)]">{service.description}</p>
          <strong className="text-xs text-[var(--mini-accent)]">
            от 35 000 ₽ · {service.durationText}
          </strong>
        </div>
      ) : null}
    </article>
  )
}

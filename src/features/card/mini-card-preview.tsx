import type { CardDraft } from '@shared/types'
import { Avatar } from '@/components/ui/avatar'
import { accentStyle } from '@/lib/accent-preset'
import { formatPrice } from '@/lib/utils'
import { useLocaleText } from '@/i18n/use-locale-text'

export function MiniCardPreview({ card, compact = false }: { card: CardDraft; compact?: boolean }) {
  const l = useLocaleText()
  const service = card.services.find((item) => item.enabled)
  const dark = card.appearance.themeId === 'dark'
  const editorial = card.appearance.themeId === 'editorial'
  if (compact)
    return (
      <article
        style={accentStyle(card.appearance.accentPreset, dark)}
        className={`${dark ? 'bg-[#111612] text-[#f1f4f0] [--mini-muted:#aab4ac]' : editorial ? 'bg-[#f4ecdc] text-[#34281f] [--mini-muted:#715f50]' : 'bg-[#fbfcf9] text-[#171916] [--mini-muted:#60675e]'} rounded-2xl border border-[var(--border)] p-4`}
      >
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
          <Avatar
            name={card.profile.displayName}
            src={card.profile.avatarUrl}
            shape={card.appearance.avatarShape}
          />
          <div className="min-w-0">
            <h2 className="heading-font m-0 truncate text-base font-semibold">
              {card.profile.displayName}
            </h2>
            <p className="m-0 truncate text-xs text-[var(--mini-muted)]">
              {card.profile.profession}
            </p>
          </div>
        </div>
        {card.profile.bio ? (
          <p className="mb-3 mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--mini-muted)]">
            {card.profile.bio}
          </p>
        ) : null}
        <div className="rounded-xl bg-[var(--mini-accent)] px-4 py-3 text-center text-sm font-semibold text-white">
          {card.primaryAction.label}
        </div>
      </article>
    )
  return (
    <article
      style={accentStyle(card.appearance.accentPreset, dark)}
      className={`${dark ? 'bg-[#111612] text-[#f1f4f0] [--mini-muted:#aab4ac]' : editorial ? 'bg-[#f4ecdc] text-[#34281f] [--mini-muted:#715f50]' : 'bg-[#fbfcf9] text-[#171916] [--mini-muted:#60675e]'} min-h-[590px] overflow-hidden p-5`}
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
            {service.priceType === 'negotiable'
              ? l('По договорённости', 'By agreement')
              : service.priceType === 'hidden'
                ? service.durationText
                : `${service.priceType === 'from' ? l('от ', 'from ') : ''}${formatPrice(service.price, service.currency)}${service.durationText ? ` · ${service.durationText}` : ''}`}
          </strong>
        </div>
      ) : null}
    </article>
  )
}

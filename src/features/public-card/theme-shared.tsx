import type { CardView, Project } from '@shared/types'
import { formatPrice } from '@/lib/utils'
import { useLocaleText } from '@/i18n/use-locale-text'

export function ServicePrice({ card, index }: { card: CardView; index: number }) {
  const l = useLocaleText()
  const service = card.services[index]
  if (!service || service.priceType === 'hidden') return null
  const prefix = service.priceType === 'from' ? l('от ', 'from ') : ''
  return (
    <span>
      {service.priceType === 'negotiable'
        ? l('По договорённости', 'By agreement')
        : `${prefix}${formatPrice(service.price, service.currency)}`}
    </span>
  )
}

export function ProjectCover({
  project,
  className = '',
}: {
  project: Project
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[var(--project-color,var(--accent-soft))] ${className}`}
    >
      {project.coverUrl ? (
        <img
          src={project.coverUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </div>
  )
}

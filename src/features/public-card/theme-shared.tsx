import type { CardDraft, Project } from '@shared/types'
import { formatPrice } from '@/lib/utils'

export function ServicePrice({ card, index }: { card: CardDraft; index: number }) {
  const service = card.services[index]
  if (!service || service.priceType === 'hidden') return null
  const prefix = service.priceType === 'from' ? 'от ' : ''
  return (
    <span>
      {service.priceType === 'negotiable'
        ? 'По договорённости'
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

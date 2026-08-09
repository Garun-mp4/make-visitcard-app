import { ArrowUpRight } from 'lucide-react'

import type { CardView } from '@shared/types'
import { telegram } from '@/lib/telegram'
import { recordPublicEvent } from '@/services/public-analytics'

export function PublicLinks({
  card,
  className = '',
  analyticsEnabled = true,
  variant = 'clean',
}: {
  card: CardView
  className?: string
  analyticsEnabled?: boolean
  variant?: 'clean' | 'dark' | 'editorial'
}) {
  const links = card.links.filter((link) => link.enabled && link.public && link.url)
  if (!links.length) return null
  return (
    <div
      className={`public-links flex flex-wrap gap-2 ${className}`}
      data-public-links-theme={variant}
      aria-label="Public contacts"
    >
      {links.map((link) => (
        <button
          key={link.id}
          className="public-link inline-flex items-center gap-1.5 text-[var(--accent)]"
          onClick={() => {
            if (analyticsEnabled) recordPublicEvent(card.publication.slug, 'link_click', link.id)
            telegram.openLink(link.url)
          }}
        >
          {link.label}
          <ArrowUpRight size={14} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

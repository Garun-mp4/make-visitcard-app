import { ArrowUpRight } from 'lucide-react'

import type { CardView } from '@shared/types'
import { telegram } from '@/lib/telegram'
import { recordPublicEvent } from '@/services/public-analytics'

export function PublicLinks({
  card,
  className = '',
  analyticsEnabled = true,
}: {
  card: CardView
  className?: string
  analyticsEnabled?: boolean
}) {
  const links = card.links.filter((link) => link.enabled && link.public && link.url)
  if (!links.length) return null
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} aria-label="Public contacts">
      {links.map((link) => (
        <button
          key={link.id}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
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

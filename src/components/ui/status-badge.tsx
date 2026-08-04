import type { PropsWithChildren } from 'react'

import { cn } from '@/lib/utils'

export function StatusBadge({
  children,
  tone = 'success',
}: PropsWithChildren<{ tone?: 'success' | 'warning' | 'neutral' }>) {
  return (
    <span
      className={cn(
        'inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold',
        tone === 'success' && 'bg-[var(--accent-soft)] text-[var(--success)]',
        tone === 'warning' && 'bg-[var(--warning-soft)] text-[var(--warning)]',
        tone === 'neutral' && 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]',
      )}
    >
      {children}
    </span>
  )
}

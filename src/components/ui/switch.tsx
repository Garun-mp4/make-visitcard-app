import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Switch({
  checked,
  className,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'role'> & { checked: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
        checked
          ? 'border-[var(--accent)] bg-[var(--accent)]'
          : 'border-[var(--border-strong)] bg-[var(--surface-secondary)]',
        className,
      )}
      {...props}
    >
      <span
        className={`absolute top-0.5 size-[18px] rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[20px]' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

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
      data-state={checked ? 'checked' : 'unchecked'}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 overflow-hidden rounded-full border p-0 transition-[background-color,border-color,box-shadow] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        checked
          ? 'border-[var(--accent)] bg-[var(--accent)]'
          : 'border-[var(--border-strong)] bg-[var(--surface-secondary)]',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        data-switch-thumb=""
        className={`pointer-events-none absolute left-0.5 top-1/2 size-[18px] -translate-y-1/2 transform-gpu rounded-full bg-white shadow-sm transition-[transform,box-shadow] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

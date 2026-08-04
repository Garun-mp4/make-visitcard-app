import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

import { cn } from '@/lib/utils'

export function IconButton({
  className,
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition active:scale-[0.97]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

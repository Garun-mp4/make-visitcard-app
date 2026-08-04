import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger'

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-contrast)] border-transparent hover:bg-[var(--accent-hover)]',
  secondary:
    'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-strong)] hover:bg-[var(--surface-secondary)]',
  tertiary:
    'bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-secondary)]',
  danger: 'bg-[var(--error)] text-white border-transparent hover:brightness-95',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

export function Button({
  children,
  className,
  variant = 'primary',
  fullWidth = false,
  type = 'button',
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-[transform,background-color,border-color,opacity] duration-150 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

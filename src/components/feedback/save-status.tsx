import { AlertCircle, Check, LoaderCircle } from 'lucide-react'

import type { SaveStatus as SaveStatusValue } from '@/app/card-store'

export function SaveStatus({ status, onRetry }: { status: SaveStatusValue; onRetry?: () => void }) {
  const config = {
    idle: { label: 'Черновик', icon: null },
    dirty: { label: 'Есть изменения', icon: null },
    saving: {
      label: 'Сохраняем…',
      icon: <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />,
    },
    saved: { label: 'Сохранено', icon: <Check size={13} aria-hidden="true" /> },
    error: { label: 'Ошибка сохранения', icon: <AlertCircle size={13} aria-hidden="true" /> },
  }[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]"
      role="status"
      aria-live="polite"
    >
      {config.icon}
      {config.label}
      {status === 'error' && onRetry ? (
        <button className="font-semibold text-[var(--error)] underline" onClick={onRetry}>
          Повторить
        </button>
      ) : null}
    </span>
  )
}

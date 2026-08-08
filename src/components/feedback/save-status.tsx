import { AlertCircle, Check, LoaderCircle } from 'lucide-react'

import type { SaveError, SaveStatus as SaveStatusValue } from '@/app/card-store'
import { useLocaleText } from '@/i18n/use-locale-text'

export function SaveStatus({
  status,
  error,
  onRetry,
}: {
  status: SaveStatusValue
  error?: SaveError | null
  onRetry?: () => void
}) {
  const l = useLocaleText()
  const config = {
    idle: { label: l('Черновик', 'Draft'), icon: null },
    dirty: { label: l('Есть изменения', 'Unsaved changes'), icon: null },
    saving: {
      label: l('Сохраняем…', 'Saving…'),
      icon: <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />,
    },
    saved: { label: l('Сохранено', 'Saved'), icon: <Check size={13} aria-hidden="true" /> },
    error: {
      label: l('Ошибка сохранения', 'Save failed'),
      icon: <AlertCircle size={13} aria-hidden="true" />,
    },
  }[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]"
      role="status"
      aria-live="polite"
    >
      {config.icon}
      {config.label}
      {status === 'error' && error ? (
        <span
          className="max-w-40 truncate text-[10px] text-[var(--error)]"
          title={`${error.message}${error.requestId ? ` · ${error.requestId}` : ''}`}
        >
          {error.message}
          {error.requestId ? ` · ${error.requestId}` : ''}
        </span>
      ) : null}
      {status === 'error' && onRetry ? (
        <button className="font-semibold text-[var(--error)] underline" onClick={onRetry}>
          {l('Повторить', 'Retry')}
        </button>
      ) : null}
    </span>
  )
}

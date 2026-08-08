import { AlertTriangle, CloudOff, LockKeyhole, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { useLocaleText } from '@/i18n/use-locale-text'

export function SystemState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}) {
  return (
    <main className="app-shell grid place-items-center px-5 py-10">
      <section className="surface grid w-full max-w-md gap-5 rounded-2xl p-6 text-center shadow-[var(--shadow-floating)]">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          {icon ?? <AlertTriangle aria-hidden="true" />}
        </div>
        <div className="grid gap-2">
          <h1 className="page-title text-xl">{title}</h1>
          <p className="m-0 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
        </div>
        {actionLabel && onAction ? (
          <Button onClick={onAction}>
            <RefreshCw size={17} aria-hidden="true" />
            {actionLabel}
          </Button>
        ) : null}
      </section>
    </main>
  )
}

export function OfflineState({ onRetry }: { onRetry: () => void }) {
  const l = useLocaleText()
  return (
    <SystemState
      title={l('Нет подключения', 'No connection')}
      description={l(
        'Черновик сохранён на устройстве. Проверьте сеть и повторите.',
        'Your draft is saved on this device. Check the connection and retry.',
      )}
      actionLabel={l('Повторить', 'Retry')}
      onAction={onRetry}
      icon={<CloudOff aria-hidden="true" />}
    />
  )
}

export function UnauthorizedState({ onAction }: { onAction: () => void }) {
  const l = useLocaleText()
  return (
    <SystemState
      title={l('Откройте в Telegram', 'Open in Telegram')}
      description={l(
        'Управление визиткой доступно после безопасной авторизации через Telegram.',
        'Card management is available after secure Telegram authentication.',
      )}
      actionLabel={l('Открыть бота', 'Open bot')}
      onAction={onAction}
      icon={<LockKeyhole aria-hidden="true" />}
    />
  )
}

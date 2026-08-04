import { AlertTriangle, CloudOff, LockKeyhole, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

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

export const OfflineState = ({ onRetry }: { onRetry: () => void }) => (
  <SystemState
    title="Нет подключения"
    description="Черновик сохранён на устройстве. Проверьте сеть и повторите."
    actionLabel="Повторить"
    onAction={onRetry}
    icon={<CloudOff aria-hidden="true" />}
  />
)
export const UnauthorizedState = ({ onAction }: { onAction: () => void }) => (
  <SystemState
    title="Откройте в Telegram"
    description="Управление визиткой доступно после безопасной авторизации через Telegram."
    actionLabel="Открыть бота"
    onAction={onAction}
    icon={<LockKeyhole aria-hidden="true" />}
  />
)

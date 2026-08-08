import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { clientEnv } from '@/config/client-env'
import { telegram } from '@/lib/telegram'
import { BrowserOwnerBlockPage } from '@/pages/browser-owner-block-page'
import { useCardStore } from '@/app/card-store'
import { useAuth } from '@/features/auth/auth-provider'
import { PageSkeleton } from '@/components/feedback/page-skeleton'
import { SystemState } from '@/components/feedback/system-state'
import { useLocaleText } from '@/i18n/use-locale-text'

export default function LaunchPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const l = useLocaleText()
  const { card } = useCardStore()
  useEffect(() => {
    if (telegram.startParameter) void navigate(`/c/${telegram.startParameter}`, { replace: true })
  }, [navigate])
  if (telegram.startParameter) return null
  if (clientEnv.demoMode) return <Navigate to="/app/card" replace />
  if (auth.status === 'loading') return <PageSkeleton />
  if (auth.status === 'error')
    return (
      <SystemState
        title={l('Не удалось войти', 'Sign-in failed')}
        description={
          auth.error ?? l('Повторите попытку внутри Telegram.', 'Try again inside Telegram.')
        }
        actionLabel={l('Повторить', 'Retry')}
        onAction={auth.retry}
      />
    )
  if (auth.status === 'browser' || !telegram.available) return <BrowserOwnerBlockPage />
  return <Navigate to={card.onboardingCompleted ? '/app/card' : '/app/onboarding'} replace />
}

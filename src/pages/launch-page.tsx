import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { clientEnv } from '@/config/client-env'
import { telegram } from '@/lib/telegram'
import { BrowserOwnerBlockPage } from '@/pages/browser-owner-block-page'
import { useCardStore } from '@/app/card-store'

export default function LaunchPage() {
  const navigate = useNavigate()
  const { card } = useCardStore()
  useEffect(() => {
    if (telegram.startParameter) void navigate(`/c/${telegram.startParameter}`, { replace: true })
  }, [navigate])
  if (telegram.startParameter) return null
  if (clientEnv.demoMode) return <Navigate to="/app/card" replace />
  if (telegram.available)
    return <Navigate to={card.onboardingCompleted ? '/app/card' : '/app/onboarding'} replace />
  return <BrowserOwnerBlockPage />
}

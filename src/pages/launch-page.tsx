import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { clientEnv } from '@/config/client-env'
import { telegram } from '@/lib/telegram'
import { BrowserOwnerBlockPage } from '@/pages/browser-owner-block-page'

export default function LaunchPage() {
  const navigate = useNavigate()
  useEffect(() => {
    if (telegram.startParameter) void navigate(`/c/${telegram.startParameter}`, { replace: true })
  }, [navigate])
  if (telegram.startParameter) return null
  if (clientEnv.demoMode) return <Navigate to="/app/card" replace />
  if (telegram.available) return <Navigate to="/app/card" replace />
  return <BrowserOwnerBlockPage />
}

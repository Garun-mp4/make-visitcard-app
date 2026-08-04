import { useEffect } from 'react'

import { AppRoutes } from '@/routes/app-routes'
import { telegram } from '@/lib/telegram'

export function App() {
  useEffect(() => telegram.initialize(), [])
  return <AppRoutes />
}

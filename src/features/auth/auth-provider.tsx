import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  CardDraft,
  CardStats,
  LeadRecord,
  OwnerPreferences,
  OwnerProfile,
} from '@shared/types'
import { clientEnv } from '@/config/client-env'
import { telegram } from '@/lib/telegram'
import { apiRequest, setApiSessionToken } from '@/services/api-client'
import { prefetchOwnerRoutes } from '@/routes/prefetch'

type AuthStatus = 'demo' | 'browser' | 'loading' | 'authenticated' | 'error'

interface AuthContextValue {
  status: AuthStatus
  user: OwnerProfile | null
  error: string | null
  bootstrap: {
    card: CardDraft
    dashboard: { owner: OwnerProfile; stats: CardStats; leads: LeadRecord[] }
    preferences: OwnerPreferences
  } | null
  retry(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [attempt, setAttempt] = useState(0)
  const [user, setUser] = useState<OwnerProfile | null>(null)
  const [status, setStatus] = useState<AuthStatus>(
    clientEnv.demoMode ? 'demo' : telegram.available ? 'loading' : 'browser',
  )
  const [error, setError] = useState<string | null>(null)
  const [bootstrap, setBootstrap] = useState<AuthContextValue['bootstrap']>(null)

  useEffect(() => {
    if (clientEnv.demoMode || !telegram.available) return
    let active = true

    const authenticate = async () => {
      performance.mark('cardly-auth-start')
      setStatus('loading')
      setError(null)
      try {
        const result = await apiRequest<{
          user: OwnerProfile
          sessionToken: string
          card: CardDraft
          dashboard: { owner: OwnerProfile; stats: CardStats; leads: LeadRecord[] }
          preferences: OwnerPreferences
        }>('/api/auth/telegram', {
          method: 'POST',
          body: JSON.stringify({ initData: telegram.initData }),
        })
        if (active) {
          setApiSessionToken(result.sessionToken)
          setUser(result.user)
          setBootstrap({
            card: result.card,
            dashboard: result.dashboard,
            preferences: result.preferences,
          })
          setStatus('authenticated')
          performance.mark('cardly-bootstrap-ready')
          performance.measure(
            'cardly-auth-bootstrap',
            'cardly-auth-start',
            'cardly-bootstrap-ready',
          )
          prefetchOwnerRoutes()
        }
      } catch (reason) {
        if (active) {
          setStatus('error')
          setError(reason instanceof Error ? reason.message : 'Не удалось войти через Telegram')
        }
      }
    }

    void authenticate()
    return () => {
      active = false
    }
  }, [attempt])

  const value = useMemo(
    () => ({ status, user, error, bootstrap, retry: () => setAttempt((value) => value + 1) }),
    [bootstrap, error, status, user],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

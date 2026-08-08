import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { OwnerProfile } from '@shared/types'
import { clientEnv } from '@/config/client-env'
import { telegram } from '@/lib/telegram'
import { apiRequest, setApiSessionToken } from '@/services/api-client'

type AuthStatus = 'demo' | 'browser' | 'loading' | 'authenticated' | 'error'

interface AuthContextValue {
  status: AuthStatus
  user: OwnerProfile | null
  error: string | null
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

  useEffect(() => {
    if (clientEnv.demoMode || !telegram.available) return
    let active = true

    const authenticate = async () => {
      setStatus('loading')
      setError(null)
      try {
        const result = await apiRequest<{ user: OwnerProfile; sessionToken: string }>(
          '/api/auth/telegram',
          {
            method: 'POST',
            body: JSON.stringify({ initData: telegram.initData }),
          },
        )
        if (active) {
          setApiSessionToken(result.sessionToken)
          setUser(result.user)
          setStatus('authenticated')
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
    () => ({ status, user, error, retry: () => setAttempt((value) => value + 1) }),
    [error, status, user],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

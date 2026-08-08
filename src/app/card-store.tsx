import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { demoCard, demoLeads, demoOwner, demoStats } from '@shared/demo-data'
import type { CardDraft, CardStats, LeadRecord, OwnerProfile } from '@shared/types'
import { clientEnv } from '@/config/client-env'
import { cardRepository } from '@/services/card-repository'
import { ApiError } from '@/services/api-client'
import { useAuth } from '@/features/auth/auth-provider'
import { saveLeadStatus } from '@/services/owner-dashboard-service'

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
export interface SaveError { message: string; requestId?: string }

interface CardStoreValue {
  card: CardDraft
  owner: OwnerProfile
  stats: CardStats
  leads: LeadRecord[]
  saveStatus: SaveStatus
  saveError: SaveError | null
  online: boolean
  updateCard(updater: (card: CardDraft) => CardDraft): void
  saveNow(): Promise<void>
  resetDemo(): void
  setLeadStatus(id: string, status: LeadRecord['status']): void
}

const CardStoreContext = createContext<CardStoreValue | null>(null)

export function CardStoreProvider({ children }: PropsWithChildren) {
  const auth = useAuth()
  const [card, setCard] = useState<CardDraft | null>(clientEnv.demoMode ? demoCard : null)
  const [owner, setOwner] = useState<OwnerProfile | null>(clientEnv.demoMode ? demoOwner : null)
  const [stats, setStats] = useState<CardStats | null>(clientEnv.demoMode ? demoStats : null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<SaveError | null>(null)
  const [leads, setLeads] = useState<LeadRecord[]>(clientEnv.demoMode ? demoLeads : [])
  const [online, setOnline] = useState(navigator.onLine)
  const saveTimer = useRef<number | null>(null)
  const revision = useRef(0)
  const pendingSave = useRef(false)
  const savingPromise = useRef<Promise<void> | null>(null)
  const cardRef = useRef<CardDraft | null>(card)
  cardRef.current = card

  useEffect(() => {
    if (auth.status !== 'demo' && auth.status !== 'authenticated') return
    let active = true
    if (auth.status === 'demo') {
      void cardRepository.load(demoOwner.uid).then((saved) => {
        if (!active) return
        setCard(saved ?? demoCard)
        setOwner(demoOwner)
        setStats(demoStats)
        setLeads(demoLeads)
      })
    } else if (auth.bootstrap) {
      setCard(auth.bootstrap.card)
      setOwner(auth.bootstrap.dashboard.owner)
      setStats(auth.bootstrap.dashboard.stats)
      setLeads(auth.bootstrap.dashboard.leads)
    }
    return () => {
      active = false
    }
  }, [auth.bootstrap, auth.status])

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const saveNow = useCallback(async () => {
    if (!navigator.onLine) {
      setSaveStatus('error')
      return
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    pendingSave.current = true
    if (savingPromise.current) return savingPromise.current
    const run = async () => {
      while (pendingSave.current) {
        pendingSave.current = false
        const snapshot = cardRef.current
        if (!snapshot) return
        const capturedRevision = revision.current
        setSaveStatus('saving')
        setSaveError(null)
        try {
          const ownerUid = auth.user?.uid ?? snapshot.ownerUid
          const saved = await cardRepository.save({ ...snapshot, ownerUid })
          if (revision.current === capturedRevision) {
            cardRef.current = saved
            setCard(saved)
            setSaveStatus('saved')
          } else {
            pendingSave.current = true
            setSaveStatus('dirty')
          }
        } catch (error) {
          setSaveStatus('error')
          setSaveError(
            error instanceof ApiError
              ? { message: error.message, requestId: error.payload.requestId }
              : { message: 'Не удалось сохранить изменения' },
          )
          break
        }
      }
    }
    savingPromise.current = run().finally(() => {
      savingPromise.current = null
    })
    return savingPromise.current
  }, [auth.user?.uid])

  const updateCard = useCallback(
    (updater: (value: CardDraft) => CardDraft) => {
      setCard((current) => {
        if (!current) return current
        const next = updater(current)
        revision.current += 1
        pendingSave.current = true
        cardRef.current = next
        return next
      })
      setSaveStatus('dirty')
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => void saveNow(), 650)
    },
    [saveNow],
  )

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (saveStatus === 'dirty' || saveStatus === 'saving') event.preventDefault()
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [saveStatus])

  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    },
    [],
  )

  const ready = Boolean(card && owner && stats)
  const value = useMemo<CardStoreValue | null>(
    () => ({
      card: card!,
      owner: owner!,
      stats: stats!,
      leads,
      saveStatus,
      saveError,
      online,
      updateCard,
      saveNow,
      resetDemo: () => {
        localStorage.removeItem('cardly-demo-card-v1')
        setCard(demoCard)
        setOwner(demoOwner)
        setStats(demoStats)
        setLeads(demoLeads)
        setSaveStatus('idle')
        setSaveError(null)
      },
      setLeadStatus: (id, status) => {
        setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)))
        if (!clientEnv.demoMode) void saveLeadStatus(id, status)
      },
    }),
    [card, leads, online, owner, saveError, saveNow, saveStatus, stats, updateCard],
  )

  if (auth.status === 'authenticated' && !ready)
    return <div className="app-shell grid min-h-[100dvh] place-items-center">Загружаем Cardly…</div>
  return <CardStoreContext.Provider value={value}>{children}</CardStoreContext.Provider>
}

export function useCardStore(): CardStoreValue {
  const value = useContext(CardStoreContext)
  if (!value) throw new Error('useCardStore must be used inside CardStoreProvider')
  return value
}

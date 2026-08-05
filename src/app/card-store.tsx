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
import { useAuth } from '@/features/auth/auth-provider'
import { loadOwnerDashboard, saveLeadStatus } from '@/services/owner-dashboard-service'

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface CardStoreValue {
  card: CardDraft
  owner: OwnerProfile
  stats: CardStats
  leads: LeadRecord[]
  saveStatus: SaveStatus
  online: boolean
  updateCard(updater: (card: CardDraft) => CardDraft): void
  saveNow(): Promise<void>
  resetDemo(): void
  setLeadStatus(id: string, status: LeadRecord['status']): void
}

const CardStoreContext = createContext<CardStoreValue | null>(null)

export function CardStoreProvider({ children }: PropsWithChildren) {
  const auth = useAuth()
  const [card, setCard] = useState<CardDraft>(demoCard)
  const [owner, setOwner] = useState<OwnerProfile>(demoOwner)
  const [stats, setStats] = useState<CardStats>(demoStats)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [leads, setLeads] = useState(demoLeads)
  const [online, setOnline] = useState(navigator.onLine)
  const saveTimer = useRef<number | null>(null)
  const cardRef = useRef(card)
  cardRef.current = card

  useEffect(() => {
    if (auth.status !== 'demo' && auth.status !== 'authenticated') return
    let active = true
    const ownerUid = auth.user?.uid ?? demoOwner.uid
    void Promise.all([
      cardRepository.load(ownerUid),
      auth.status === 'authenticated' ? loadOwnerDashboard() : Promise.resolve(null),
    ]).then(([saved, dashboard]) => {
      if (!active) return
      setCard(saved ?? { ...demoCard, ownerUid })
      if (dashboard) {
        setOwner(dashboard.owner)
        setStats(dashboard.stats)
        setLeads(dashboard.leads)
      }
    })
    return () => {
      active = false
    }
  }, [auth.status, auth.user?.uid])

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
    setSaveStatus('saving')
    try {
      const ownerUid = auth.user?.uid ?? cardRef.current.ownerUid
      const saved = await cardRepository.save({ ...cardRef.current, ownerUid })
      setCard((current) => (current.updatedAt > saved.updatedAt ? current : saved))
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, [auth.user?.uid])

  const updateCard = useCallback(
    (updater: (value: CardDraft) => CardDraft) => {
      setCard((current) => {
        const next = updater(current)
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

  const value = useMemo<CardStoreValue>(
    () => ({
      card,
      owner,
      stats,
      leads,
      saveStatus,
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
      },
      setLeadStatus: (id, status) => {
        setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)))
        if (!clientEnv.demoMode) void saveLeadStatus(id, status)
      },
    }),
    [card, leads, online, owner, saveNow, saveStatus, stats, updateCard],
  )

  return <CardStoreContext.Provider value={value}>{children}</CardStoreContext.Provider>
}

export function useCardStore(): CardStoreValue {
  const value = useContext(CardStoreContext)
  if (!value) throw new Error('useCardStore must be used inside CardStoreProvider')
  return value
}

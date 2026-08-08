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
import type {
  CardDraft,
  CardSaveResult,
  CardStats,
  LeadRecord,
  OwnerPreferences,
  OwnerProfile,
  PublicSyncStatus,
} from '@shared/types'
import { clientEnv } from '@/config/client-env'
import { cardRepository } from '@/services/card-repository'
import { ApiError } from '@/services/api-client'
import { useAuth } from '@/features/auth/auth-provider'
import {
  loadOwnerDashboard,
  saveLeadStatus,
  saveOwnerPreferences,
} from '@/services/owner-dashboard-service'
import i18n, { changeLocale } from '@/i18n'
import { derivePublicSyncStatus } from '@/lib/public-sync'
import { apiRequest } from '@/services/api-client'

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
export interface SaveError {
  message: string
  requestId?: string
}

export type PublicationOperation = 'idle' | 'publishing' | 'unpublishing'

interface CardStoreValue {
  card: CardDraft
  owner: OwnerProfile
  stats: CardStats
  leads: LeadRecord[]
  preferences: OwnerPreferences
  publicSync: PublicSyncStatus
  saveStatus: SaveStatus
  saveError: SaveError | null
  publicationOperation: PublicationOperation
  publicationError: SaveError | null
  online: boolean
  updateCard(updater: (card: CardDraft) => CardDraft): void
  saveNow(): Promise<void>
  ensurePublicCardReady(): Promise<boolean>
  publishCard(slug: string): Promise<void>
  unpublishCard(): Promise<void>
  resetDemo(): void
  setLeadStatus(id: string, status: LeadRecord['status']): void
  setPreferences(patch: Partial<OwnerPreferences>): Promise<void>
  refreshDashboard(): Promise<void>
}

const CardStoreContext = createContext<CardStoreValue | null>(null)

export function CardStoreProvider({ children }: PropsWithChildren) {
  const auth = useAuth()
  const [card, setCard] = useState<CardDraft | null>(clientEnv.demoMode ? demoCard : null)
  const [owner, setOwner] = useState<OwnerProfile | null>(clientEnv.demoMode ? demoOwner : null)
  const [stats, setStats] = useState<CardStats | null>(clientEnv.demoMode ? demoStats : null)
  const [preferences, setPreferencesState] = useState<OwnerPreferences>({
    locale: demoOwner.languageCode.startsWith('en') ? 'en' : 'ru',
    leadNotificationsEnabled: true,
  })
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<SaveError | null>(null)
  const [publicSync, setPublicSync] = useState<PublicSyncStatus>(() =>
    clientEnv.demoMode
      ? derivePublicSyncStatus(demoCard)
      : { state: 'not_published', syncedAt: null, invalidPaths: [] },
  )
  const [publicationOperation, setPublicationOperation] = useState<PublicationOperation>('idle')
  const [publicationError, setPublicationError] = useState<SaveError | null>(null)
  const [leads, setLeads] = useState<LeadRecord[]>(clientEnv.demoMode ? demoLeads : [])
  const [online, setOnline] = useState(navigator.onLine)
  const saveTimer = useRef<number | null>(null)
  const revision = useRef(0)
  const pendingSave = useRef(false)
  const savingPromise = useRef<Promise<void> | null>(null)
  const publicationPromise = useRef<Promise<void> | null>(null)
  const cardRef = useRef<CardDraft | null>(card)
  const publicSyncRef = useRef(publicSync)
  const saveErrorRef = useRef<SaveError | null>(null)
  cardRef.current = card
  publicSyncRef.current = publicSync

  useEffect(() => {
    if (auth.status !== 'demo' && auth.status !== 'authenticated') return
    let active = true
    if (auth.status === 'demo') {
      void cardRepository.load(demoOwner.uid).then((saved) => {
        if (!active) return
        setCard(saved ?? demoCard)
        setPublicSync(derivePublicSyncStatus(saved ?? demoCard))
        setOwner(demoOwner)
        setStats(demoStats)
        setLeads(demoLeads)
      })
    } else if (auth.bootstrap) {
      setCard(auth.bootstrap.card)
      setPublicSync(derivePublicSyncStatus(auth.bootstrap.card))
      setOwner(auth.bootstrap.dashboard.owner)
      setStats(auth.bootstrap.dashboard.stats)
      setLeads(auth.bootstrap.dashboard.leads)
      setPreferencesState(auth.bootstrap.preferences)
      void changeLocale(auth.bootstrap.preferences.locale)
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
      const error = {
        message: i18n.language.startsWith('en') ? 'You are offline' : 'Нет подключения к сети',
      }
      saveErrorRef.current = error
      setSaveError(error)
      return
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    pendingSave.current = true
    if (savingPromise.current) return savingPromise.current
    const run = async () => {
      while (pendingSave.current) {
        if (saveTimer.current) window.clearTimeout(saveTimer.current)
        pendingSave.current = false
        const snapshot = cardRef.current
        if (!snapshot) return
        const capturedRevision = revision.current
        setSaveStatus('saving')
        saveErrorRef.current = null
        setSaveError(null)
        try {
          const ownerUid = auth.user?.uid ?? snapshot.ownerUid
          const result = await cardRepository.save({ ...snapshot, ownerUid })
          if (revision.current === capturedRevision) {
            cardRef.current = result.card
            publicSyncRef.current = result.publicSync
            setCard(result.card)
            setPublicSync(result.publicSync)
            setSaveStatus('saved')
          } else {
            pendingSave.current = true
            setSaveStatus('dirty')
          }
        } catch (error) {
          setSaveStatus('error')
          const saveError =
            error instanceof ApiError
              ? { message: error.message, requestId: error.payload.requestId }
              : {
                  message: i18n.language.startsWith('en')
                    ? 'Could not save changes'
                    : 'Не удалось сохранить изменения',
                }
          saveErrorRef.current = saveError
          setSaveError(saveError)
          break
        }
      }
    }
    savingPromise.current = run().finally(() => {
      savingPromise.current = null
    })
    return savingPromise.current
  }, [auth.user?.uid])

  const applyServerResult = useCallback((result: CardSaveResult) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    pendingSave.current = false
    revision.current += 1
    cardRef.current = result.card
    publicSyncRef.current = result.publicSync
    saveErrorRef.current = null
    setCard(result.card)
    setPublicSync(result.publicSync)
    setSaveError(null)
    setSaveStatus('saved')
  }, [])

  const ensurePublicCardReady = useCallback(async () => {
    await saveNow()
    return Boolean(
      !saveErrorRef.current &&
      cardRef.current?.publication.published &&
      publicSyncRef.current.state === 'synced',
    )
  }, [saveNow])

  const runPublicationCommand = useCallback(
    (operation: Exclude<PublicationOperation, 'idle'>, slug?: string) => {
      if (publicationPromise.current) return publicationPromise.current
      const run = async () => {
        setPublicationOperation(operation)
        setPublicationError(null)
        try {
          await saveNow()
          if (saveErrorRef.current) throw new Error(saveErrorRef.current.message)
          const current = cardRef.current
          if (!current) throw new Error('Card is not ready')
          let result: CardSaveResult
          if (clientEnv.demoMode) {
            const now = new Date().toISOString()
            result = await cardRepository.save({
              ...current,
              onboardingCompleted: operation === 'publishing' || current.onboardingCompleted,
              publication: {
                ...current.publication,
                slug: slug ?? current.publication.slug,
                published: operation === 'publishing',
                publishedAt:
                  operation === 'publishing'
                    ? (current.publication.publishedAt ?? now)
                    : current.publication.publishedAt,
                updatedAt: now,
              },
              lastPublishedAt: operation === 'publishing' ? now : current.lastPublishedAt,
              updatedAt: now,
            })
          } else {
            result = await apiRequest<CardSaveResult>(
              operation === 'publishing' ? '/api/cards/publish' : '/api/cards/unpublish',
              {
                method: 'POST',
                body: JSON.stringify(operation === 'publishing' ? { slug } : {}),
                timeoutMs: 15_000,
              },
            )
          }
          applyServerResult(result)
        } catch (error) {
          const publicationError =
            error instanceof ApiError
              ? { message: error.message, requestId: error.payload.requestId }
              : { message: error instanceof Error ? error.message : 'Publication failed' }
          setPublicationError(publicationError)
          throw error
        } finally {
          setPublicationOperation('idle')
        }
      }
      publicationPromise.current = run().finally(() => {
        publicationPromise.current = null
      })
      return publicationPromise.current
    },
    [applyServerResult, saveNow],
  )

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
      preferences,
      publicSync,
      saveStatus,
      saveError,
      publicationOperation,
      publicationError,
      online,
      updateCard,
      saveNow,
      ensurePublicCardReady,
      publishCard: (slug) => runPublicationCommand('publishing', slug),
      unpublishCard: () => runPublicationCommand('unpublishing'),
      resetDemo: () => {
        localStorage.removeItem('cardly-demo-card-v1')
        setCard(demoCard)
        setOwner(demoOwner)
        setStats(demoStats)
        setLeads(demoLeads)
        setSaveStatus('idle')
        setSaveError(null)
        setPublicSync(derivePublicSyncStatus(demoCard))
      },
      setLeadStatus: (id, status) => {
        setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)))
        if (!clientEnv.demoMode) void saveLeadStatus(id, status)
      },
      setPreferences: async (patch) => {
        const previous = preferences
        const next = { ...previous, ...patch }
        setPreferencesState(next)
        try {
          if (!clientEnv.demoMode) setPreferencesState(await saveOwnerPreferences(patch))
        } catch (error) {
          setPreferencesState(previous)
          throw error
        }
      },
      refreshDashboard: async () => {
        if (clientEnv.demoMode) return
        const dashboard = await loadOwnerDashboard()
        setOwner(dashboard.owner)
        setStats(dashboard.stats)
        setLeads(dashboard.leads)
      },
    }),
    [
      card,
      ensurePublicCardReady,
      leads,
      online,
      owner,
      preferences,
      publicSync,
      publicationError,
      publicationOperation,
      runPublicationCommand,
      saveError,
      saveNow,
      saveStatus,
      stats,
      updateCard,
    ],
  )

  if ((auth.status === 'loading' || auth.status === 'authenticated') && !ready)
    return (
      <div className="app-shell grid min-h-[100dvh] place-items-center" role="status">
        {i18n.language.startsWith('en') ? 'Loading Cardly…' : 'Загружаем Cardly…'}
      </div>
    )
  return <CardStoreContext.Provider value={value}>{children}</CardStoreContext.Provider>
}

export function useCardStore(): CardStoreValue {
  const value = useContext(CardStoreContext)
  if (!value) throw new Error('useCardStore must be used inside CardStoreProvider')
  return value
}

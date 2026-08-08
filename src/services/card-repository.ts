import { cardDraftSchema, publishableCardSchema } from '@shared/schemas'
import type { CardDraft, CardSaveResult } from '@shared/types'
import { clientEnv } from '@/config/client-env'
import { apiRequest } from '@/services/api-client'
import { derivePublicSyncStatus } from '@/lib/public-sync'

const demoStorageKey = 'cardly-demo-card-v1'

export interface CardRepository {
  load(uid: string): Promise<CardDraft | null>
  save(card: CardDraft): Promise<CardSaveResult>
}

class DemoCardRepository implements CardRepository {
  async load(): Promise<CardDraft | null> {
    const value = localStorage.getItem(demoStorageKey)
    if (!value) return null
    const result = cardDraftSchema.safeParse(JSON.parse(value) as unknown)
    return result.success ? result.data : null
  }

  async save(card: CardDraft): Promise<CardSaveResult> {
    const now = new Date().toISOString()
    const canSync = card.publication.published && publishableCardSchema.safeParse(card).success
    const next = {
      ...card,
      publication: canSync ? { ...card.publication, updatedAt: now } : card.publication,
      lastPublishedAt: canSync ? now : card.lastPublishedAt,
      updatedAt: now,
    }
    localStorage.setItem(demoStorageKey, JSON.stringify(next))
    return { card: next, publicSync: derivePublicSyncStatus(next) }
  }
}

class ApiCardRepository implements CardRepository {
  async load(): Promise<CardDraft | null> {
    const result = await apiRequest<{ card: CardDraft | null }>('/api/cards/me')
    return result.card ? cardDraftSchema.parse(result.card) : null
  }

  async save(card: CardDraft): Promise<CardSaveResult> {
    const next = { ...card, updatedAt: new Date().toISOString() }
    const result = await apiRequest<CardSaveResult>('/api/cards/me', {
      method: 'PUT',
      body: JSON.stringify(next),
    })
    return { card: cardDraftSchema.parse(result.card), publicSync: result.publicSync }
  }
}

export const cardRepository: CardRepository = clientEnv.demoMode
  ? new DemoCardRepository()
  : new ApiCardRepository()

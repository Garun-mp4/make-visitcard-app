import { cardDraftSchema } from '@shared/schemas'
import type { CardDraft } from '@shared/types'
import { clientEnv } from '@/config/client-env'
import { apiRequest } from '@/services/api-client'

const demoStorageKey = 'cardly-demo-card-v1'

export interface CardRepository {
  load(uid: string): Promise<CardDraft | null>
  save(card: CardDraft): Promise<CardDraft>
}

class DemoCardRepository implements CardRepository {
  async load(): Promise<CardDraft | null> {
    const value = localStorage.getItem(demoStorageKey)
    if (!value) return null
    const result = cardDraftSchema.safeParse(JSON.parse(value) as unknown)
    return result.success ? result.data : null
  }

  async save(card: CardDraft): Promise<CardDraft> {
    const next = { ...card, updatedAt: new Date().toISOString() }
    localStorage.setItem(demoStorageKey, JSON.stringify(next))
    return next
  }
}

class ApiCardRepository implements CardRepository {
  async load(): Promise<CardDraft | null> {
    const result = await apiRequest<{ card: CardDraft | null }>('/api/cards/me')
    return result.card ? cardDraftSchema.parse(result.card) : null
  }

  async save(card: CardDraft): Promise<CardDraft> {
    const next = { ...card, updatedAt: new Date().toISOString() }
    const result = await apiRequest<{ card: CardDraft }>('/api/cards/me', {
      method: 'PUT',
      body: JSON.stringify(next),
    })
    return cardDraftSchema.parse(result.card)
  }
}

export const cardRepository: CardRepository = clientEnv.demoMode
  ? new DemoCardRepository()
  : new ApiCardRepository()

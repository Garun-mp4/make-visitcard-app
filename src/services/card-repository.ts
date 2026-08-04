import { doc, getDoc, setDoc } from 'firebase/firestore'

import { cardDraftSchema } from '@shared/schemas'
import type { CardDraft } from '@shared/types'
import { clientEnv } from '@/config/client-env'
import { getFirebaseServices } from '@/services/firebase-client'

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

class FirebaseCardRepository implements CardRepository {
  async load(uid: string): Promise<CardDraft | null> {
    const snapshot = await getDoc(doc(getFirebaseServices().db, 'cards', uid))
    if (!snapshot.exists()) return null
    return cardDraftSchema.parse(snapshot.data())
  }

  async save(card: CardDraft): Promise<CardDraft> {
    const next = { ...card, updatedAt: new Date().toISOString() }
    await setDoc(doc(getFirebaseServices().db, 'cards', card.ownerUid), next, { merge: false })
    return next
  }
}

export const cardRepository: CardRepository = clientEnv.demoMode
  ? new DemoCardRepository()
  : new FirebaseCardRepository()

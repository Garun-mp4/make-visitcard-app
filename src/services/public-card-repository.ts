import { doc, getDoc } from 'firebase/firestore'

import { cardDraftSchema, publicCardSchema } from '@shared/schemas'
import { demoCard } from '@shared/demo-data'
import type { CardView } from '@shared/types'
import { clientEnv } from '@/config/client-env'
import { getFirebaseServices } from '@/services/firebase-client'

export async function loadPublicCard(slug: string): Promise<CardView | null> {
  if (clientEnv.demoMode) {
    const stored = localStorage.getItem('cardly-demo-card-v1')
    const parsed = stored ? cardDraftSchema.safeParse(JSON.parse(stored) as unknown) : null
    const card = parsed?.success ? parsed.data : demoCard
    return card.publication.slug === slug && card.publication.published ? card : null
  }
  const snapshot = await getDoc(doc(getFirebaseServices().db, 'publicCards', slug))
  if (!snapshot.exists()) return null
  const result = publicCardSchema.safeParse(snapshot.data())
  return result.success ? result.data : null
}

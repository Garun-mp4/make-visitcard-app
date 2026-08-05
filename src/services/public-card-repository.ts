import { cardDraftSchema, publicCardSchema } from '@shared/schemas'
import { demoCard } from '@shared/demo-data'
import type { CardView } from '@shared/types'
import { clientEnv } from '@/config/client-env'
import { ApiError, apiRequest } from '@/services/api-client'

export async function loadPublicCard(slug: string): Promise<CardView | null> {
  if (clientEnv.demoMode) {
    const stored = localStorage.getItem('cardly-demo-card-v1')
    const parsed = stored ? cardDraftSchema.safeParse(JSON.parse(stored) as unknown) : null
    const card = parsed?.success ? parsed.data : demoCard
    return card.publication.slug === slug && card.publication.published ? card : null
  }
  try {
    const response = await apiRequest<{ card: CardView }>(`/api/public/cards/${slug}`)
    const result = publicCardSchema.safeParse(response.card)
    return result.success ? result.data : null
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

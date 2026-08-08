import { publishableCardSchema } from '@shared/schemas'
import type { CardDraft, PublicSyncStatus } from '@shared/types'

export function derivePublicSyncStatus(card: CardDraft): PublicSyncStatus {
  if (!card.publication.published)
    return { state: 'not_published', syncedAt: null, invalidPaths: [] }

  const publishable = publishableCardSchema.safeParse(card)
  const publicTimestamp = card.lastPublishedAt ? Date.parse(card.lastPublishedAt) : 0
  const draftTimestamp = Date.parse(card.updatedAt)
  if (publishable.success && publicTimestamp >= draftTimestamp)
    return { state: 'synced', syncedAt: card.lastPublishedAt, invalidPaths: [] }

  return {
    state: 'pending_validation',
    syncedAt: card.lastPublishedAt,
    invalidPaths: publishable.success
      ? []
      : [...new Set(publishable.error.issues.map((issue) => issue.path.map(String).join('.')))],
  }
}

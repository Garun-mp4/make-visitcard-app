import { cardDraftSchema, publishableCardSchema } from '../../shared/schemas.js'
import type { CardDraft, CardSaveResult, PublicSyncStatus } from '../../shared/types.js'
import { sanitizePublicSnapshot } from './public-snapshot.js'

export interface CurrentCardRecord {
  card: CardDraft
  slug: string | null
  published: boolean
  publicData: unknown
}

export interface PreparedCardSave extends CardSaveResult {
  publicData: unknown
}

function issuePath(path: PropertyKey[]): string {
  return path.map(String).join('.')
}

function syncStatus(
  state: PublicSyncStatus['state'],
  syncedAt: string | null,
  invalidPaths: string[] = [],
): PublicSyncStatus {
  return { state, syncedAt, invalidPaths }
}

export function prepareCardSave(
  current: CurrentCardRecord,
  input: CardDraft,
  now: string,
): PreparedCardSave {
  const slug = current.published
    ? (current.slug ?? current.card.publication.slug)
    : input.publication.slug
  const draft = cardDraftSchema.parse({
    ...input,
    ownerUid: current.card.ownerUid,
    publication: {
      ...input.publication,
      slug,
      published: current.published,
      publishedAt: current.card.publication.publishedAt,
      updatedAt: current.card.publication.updatedAt,
    },
    lastPublishedAt: current.card.lastPublishedAt,
    createdAt: current.card.createdAt,
    updatedAt: now,
  })

  if (!current.published) {
    return {
      card: draft,
      publicData: null,
      publicSync: syncStatus('not_published', null),
    }
  }

  const publishable = publishableCardSchema.safeParse(draft)
  if (!publishable.success) {
    return {
      card: draft,
      publicData: current.publicData,
      publicSync: syncStatus('pending_validation', current.card.lastPublishedAt, [
        ...new Set(publishable.error.issues.map((issue) => issuePath(issue.path))),
      ]),
    }
  }

  const card = cardDraftSchema.parse({
    ...draft,
    publication: { ...draft.publication, updatedAt: now },
    lastPublishedAt: now,
  })
  return {
    card,
    publicData: sanitizePublicSnapshot(card),
    publicSync: syncStatus('synced', now),
  }
}

import { describe, expect, it } from 'vitest'

import { demoCard } from '@shared/demo-data'
import { derivePublicSyncStatus } from './public-sync'

describe('derivePublicSyncStatus', () => {
  it('recognizes a published card whose latest draft is live', () => {
    expect(derivePublicSyncStatus(demoCard).state).toBe('synced')
  })

  it('recognizes saved changes that are newer than the public snapshot', () => {
    const card = {
      ...demoCard,
      profile: { ...demoCard.profile, profession: '' },
      updatedAt: '2026-08-08T16:00:00.000Z',
      lastPublishedAt: '2026-08-08T15:00:00.000Z',
    }
    const result = derivePublicSyncStatus(card)
    expect(result.state).toBe('pending_validation')
    expect(result.invalidPaths).toContain('profile.profession')
  })

  it('marks an unpublished card as not published', () => {
    expect(
      derivePublicSyncStatus({
        ...demoCard,
        publication: { ...demoCard.publication, published: false },
      }).state,
    ).toBe('not_published')
  })
})

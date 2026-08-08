import { describe, expect, it } from 'vitest'

import { demoCard } from '../../shared/demo-data.js'
import { prepareCardSave } from './card-save.js'

const now = '2026-08-08T15:00:00.000Z'

describe('prepareCardSave', () => {
  it('refreshes the public snapshot for a valid published edit', () => {
    const result = prepareCardSave(
      {
        card: demoCard,
        slug: demoCard.publication.slug,
        published: true,
        publicData: { appearance: demoCard.appearance },
      },
      {
        ...demoCard,
        appearance: { ...demoCard.appearance, themeId: 'dark', accentPreset: 'violet' },
        publication: { ...demoCard.publication, slug: 'changed-by-client' },
      },
      now,
    )

    expect(result.card.publication.slug).toBe(demoCard.publication.slug)
    expect(result.card.appearance).toMatchObject({ themeId: 'dark', accentPreset: 'violet' })
    expect(result.card.lastPublishedAt).toBe(now)
    expect(result.publicSync).toEqual({ state: 'synced', syncedAt: now, invalidPaths: [] })
    expect(result.publicData).toMatchObject({
      appearance: { themeId: 'dark', accentPreset: 'violet' },
      publication: { published: true, slug: demoCard.publication.slug },
    })
  })

  it('keeps the last valid public snapshot for an incomplete published draft', () => {
    const previousPublicData = { version: 'last-valid' }
    const result = prepareCardSave(
      {
        card: demoCard,
        slug: demoCard.publication.slug,
        published: true,
        publicData: previousPublicData,
      },
      {
        ...demoCard,
        profile: { ...demoCard.profile, profession: '' },
      },
      now,
    )

    expect(result.card.profile.profession).toBe('')
    expect(result.card.lastPublishedAt).toBe(demoCard.lastPublishedAt)
    expect(result.publicData).toBe(previousPublicData)
    expect(result.publicSync.state).toBe('pending_validation')
    expect(result.publicSync.invalidPaths).toContain('profile.profession')
  })

  it('forces an unpublished draft to stay unpublished while accepting its slug', () => {
    const current = {
      ...demoCard,
      publication: { ...demoCard.publication, published: false },
    }
    const result = prepareCardSave(
      { card: current, slug: demoCard.publication.slug, published: false, publicData: null },
      {
        ...current,
        publication: { ...current.publication, slug: 'new-address', published: true },
      },
      now,
    )

    expect(result.card.publication).toMatchObject({ slug: 'new-address', published: false })
    expect(result.publicData).toBeNull()
    expect(result.publicSync).toEqual({
      state: 'not_published',
      syncedAt: null,
      invalidPaths: [],
    })
  })
})

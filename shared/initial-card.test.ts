import { describe, expect, it } from 'vitest'

import { createInitialCard } from './initial-card'

describe('createInitialCard', () => {
  it('creates an unpublished onboarding draft from the Telegram owner', () => {
    const card = createInitialCard(
      {
        uid: 'tg_42',
        telegramId: '42',
        firstName: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        photoUrl: 'https://example.com/ada.png',
        languageCode: 'en',
        isPremium: false,
        platform: 'Telegram Mini App',
      },
      '2026-08-08T08:00:00.000Z',
    )

    expect(card.ownerUid).toBe('tg_42')
    expect(card.profile.displayName).toBe('Ada Lovelace')
    expect(card.profile.avatarUrl).toBe('https://example.com/ada.png')
    expect(card.primaryAction.value).toBe('https://t.me/ada')
    expect(card.publication).toMatchObject({ slug: '', published: false })
    expect(card.onboardingCompleted).toBe(false)
    expect(card.skills).toEqual([])
    expect(card.services).toEqual([])
    expect(card.projects).toEqual([])
  })
})

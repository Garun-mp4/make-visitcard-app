import { describe, expect, it } from 'vitest'

import { createInitialCard, syncTelegramAvatar } from './initial-card'

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

describe('syncTelegramAvatar', () => {
  it('replaces a saved card avatar with the current Telegram photo', () => {
    const card = createInitialCard(
      {
        uid: 'tg_42',
        telegramId: '42',
        firstName: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        photoUrl: 'https://example.com/old.png',
        languageCode: 'en',
        isPremium: false,
        platform: 'Telegram Mini App',
      },
      '2026-08-08T08:00:00.000Z',
    )

    const synced = syncTelegramAvatar(card, 'https://example.com/new.png')

    expect(synced.profile.avatarUrl).toBe('https://example.com/new.png')
    expect(synced).not.toBe(card)
  })

  it('removes the card avatar when the Telegram photo is removed', () => {
    const card = createInitialCard(
      {
        uid: 'tg_42',
        telegramId: '42',
        firstName: 'Ada',
        lastName: '',
        username: 'ada',
        photoUrl: 'https://example.com/old.png',
        languageCode: 'en',
        isPremium: false,
        platform: 'Telegram Mini App',
      },
      '2026-08-08T08:00:00.000Z',
    )

    expect(syncTelegramAvatar(card, '').profile.avatarUrl).toBe('')
  })

  it('preserves the card reference when the Telegram photo is unchanged', () => {
    const card = createInitialCard(
      {
        uid: 'tg_42',
        telegramId: '42',
        firstName: 'Ada',
        lastName: '',
        username: 'ada',
        photoUrl: 'https://example.com/avatar.png',
        languageCode: 'en',
        isPremium: false,
        platform: 'Telegram Mini App',
      },
      '2026-08-08T08:00:00.000Z',
    )

    expect(syncTelegramAvatar(card, card.profile.avatarUrl)).toBe(card)
  })
})

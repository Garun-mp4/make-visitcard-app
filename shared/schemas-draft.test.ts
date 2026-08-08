import { describe, expect, it } from 'vitest'

import { createInitialCard } from './initial-card'
import { cardDraftSchema, publishableCardSchema } from './schemas'

const owner = {
  uid: 'tg_42',
  telegramId: '42',
  firstName: 'Ada',
  lastName: '',
  username: '',
  photoUrl: '',
  languageCode: 'en',
  isPremium: false,
  platform: 'Telegram Mini App',
}

describe('draft and publication schemas', () => {
  it('persists an incomplete draft but rejects it for publication', () => {
    const draft = createInitialCard(owner, '2026-08-08T08:00:00.000Z')

    expect(cardDraftSchema.safeParse(draft).success).toBe(true)
    expect(publishableCardSchema.safeParse(draft).success).toBe(false)
  })

  it('rejects unfinished public list items only at publication time', () => {
    const draft = {
      ...createInitialCard(owner, '2026-08-08T08:00:00.000Z'),
      links: [
        {
          id: 'link-1',
          type: 'website' as const,
          label: '',
          url: '',
          enabled: true,
          public: true,
          position: 0,
        },
      ],
    }

    expect(cardDraftSchema.safeParse(draft).success).toBe(true)
    expect(publishableCardSchema.safeParse(draft).success).toBe(false)
  })
})

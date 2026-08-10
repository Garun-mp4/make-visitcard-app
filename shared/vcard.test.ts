import { describe, expect, it } from 'vitest'

import { demoCard } from './demo-data.js'
import { createVCard, formatContactText } from './vcard.js'

describe('vCard', () => {
  it('builds a UTF-8 vCard from public contact data', () => {
    const card = {
      ...demoCard,
      links: [
        ...demoCard.links,
        {
          id: 'link-phone',
          type: 'phone' as const,
          label: 'Телефон',
          url: 'tel:+79990001122',
          enabled: true,
          public: true,
          position: 3,
        },
        {
          id: 'private-email',
          type: 'email' as const,
          label: 'Private',
          url: 'mailto:private@example.com',
          enabled: true,
          public: false,
          position: 4,
        },
      ],
    }

    const result = createVCard(card, 'https://cardly.test/c/alexey')

    expect(result).toContain('BEGIN:VCARD\r\nVERSION:3.0\r\n')
    expect(result).toContain('FN:Алексей Волков\r\n')
    expect(result).toContain('N:;Алексей Волков;;;\r\n')
    expect(result).toContain('TITLE:Product designer и frontend-разработчик\r\n')
    expect(result).toContain('TEL;TYPE=CELL:+79990001122\r\n')
    expect(result).toContain('EMAIL;TYPE=INTERNET:alexey@example.com\r\n')
    expect(result).toContain('X-SOCIALPROFILE;TYPE=telegram:https://t.me/alexey_cardly\r\n')
    expect(result).toContain('URL;TYPE=WORK:https://example.com/alexey\r\n')
    expect(result).toContain('item1.URL:https://cardly.test/c/alexey\r\n')
    expect(result).toContain('item1.X-ABLabel:Cardly\r\n')
    expect(result).not.toContain('private@example.com')
    expect(result).toMatch(/END:VCARD\r\n$/)
  })

  it('prevents CRLF injection from public text fields', () => {
    const card = {
      ...demoCard,
      profile: { ...demoCard.profile, displayName: 'Ada\r\nTEL:+10000000000' },
    }

    const result = createVCard(card, 'https://cardly.test/c/ada')

    expect(result).toContain('FN:Ada\\nTEL:+10000000000\r\n')
    expect(result.match(/\r\nTEL:/g)).toBeNull()
  })

  it('formats a readable contact summary without private links', () => {
    const result = formatContactText(demoCard, 'https://cardly.test/c/alexey', 'ru')

    expect(result).toContain('Алексей Волков')
    expect(result).toContain('Telegram: https://t.me/alexey_cardly')
    expect(result).toContain('Визитка: https://cardly.test/c/alexey')
  })
})

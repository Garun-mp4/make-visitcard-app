import { describe, expect, it } from 'vitest'

import { demoCard } from '@shared/demo-data'
import { createVCard, escapeVCard } from './vcard'

describe('vCard', () => {
  it('escapes reserved characters', () => {
    expect(escapeVCard('A, B; C\\D\nE')).toBe('A\\, B\\; C\\\\D\\nE')
  })

  it('contains only public contact data', () => {
    const result = createVCard(demoCard)
    expect(result).toContain('FN:Алексей Волков')
    expect(result).toContain('X-SOCIALPROFILE;TYPE=telegram')
    expect(result).not.toContain('782 453 109')
    expect(result).not.toContain('demo_owner')
  })
})

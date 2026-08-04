import { describe, expect, it } from 'vitest'

import { demoCard } from '@shared/demo-data'
import { sanitizePublicSnapshot } from './public-snapshot.js'

describe('public snapshot sanitizer', () => {
  it('exposes only public card fields', () => {
    const snapshot = sanitizePublicSnapshot(demoCard)
    expect(snapshot).not.toHaveProperty('ownerUid')
    expect(snapshot).not.toHaveProperty('telegramId')
    expect(JSON.stringify(snapshot)).not.toContain(demoCard.ownerUid)
    expect(snapshot.links.every((link) => link.enabled && link.public)).toBe(true)
  })

  it('removes hidden sections', () => {
    const snapshot = sanitizePublicSnapshot({
      ...demoCard,
      appearance: { ...demoCard.appearance, showSkills: false, showProjects: false },
    })
    expect(snapshot.skills).toEqual([])
    expect(snapshot.projects).toEqual([])
  })
})

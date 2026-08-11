import { describe, expect, it, vi } from 'vitest'

import { copyShareSourceLink } from './share-sources-service'

describe('share source clipboard fallback', () => {
  it('reports manual fallback when clipboard copy fails', async () => {
    await expect(
      copyShareSourceLink('https://cardly.test/c/ada', vi.fn().mockResolvedValue(false)),
    ).resolves.toBe('manual')
  })

  it('reports copied when clipboard succeeds', async () => {
    await expect(
      copyShareSourceLink('https://cardly.test/c/ada', vi.fn().mockResolvedValue(true)),
    ).resolves.toBe('copied')
  })
})

import { describe, expect, it, vi } from 'vitest'

import { shareOrCopy } from './share'

describe('shareOrCopy', () => {
  it('falls back to copy when sharing is denied', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
    })
    const copy = vi.fn().mockResolvedValue(true)
    await expect(shareOrCopy({ url: 'https://cardly.test/c/ada' }, copy)).resolves.toBe('copied')
    expect(copy).toHaveBeenCalledWith('https://cardly.test/c/ada')
  })

  it('returns manual when both browser APIs fail', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    await expect(
      shareOrCopy({ url: 'https://cardly.test/c/ada' }, vi.fn().mockResolvedValue(false)),
    ).resolves.toBe('manual')
  })
})

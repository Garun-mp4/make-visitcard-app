import { describe, expect, it, vi } from 'vitest'

import { shareOrCopy } from './share'

describe('shareOrCopy', () => {
  it('opens the native share sheet before using any fallback', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    const copy = vi.fn().mockResolvedValue(true)

    await expect(
      shareOrCopy({ title: 'Ada', text: 'Designer', url: 'https://cardly.test/c/ada' }, copy),
    ).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith({
      title: 'Ada',
      text: 'Designer',
      url: 'https://cardly.test/c/ada',
    })
    expect(copy).not.toHaveBeenCalled()
  })

  it('does not copy the link when the user closes the native share sheet', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')),
    })
    const copy = vi.fn().mockResolvedValue(true)

    await expect(shareOrCopy({ url: 'https://cardly.test/c/ada' }, copy)).resolves.toBe('cancelled')
    expect(copy).not.toHaveBeenCalled()
  })

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

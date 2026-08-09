// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { renderQrPng } from './qr-image.js'

describe('QR image renderer', () => {
  it('renders a non-empty 1024px PNG for the public card URL', async () => {
    const image = await renderQrPng('https://cardly.test/c/ada')

    expect(image.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
    expect(image.byteLength).toBeGreaterThan(5_000)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn().mockResolvedValue({ ok: true }) }))

vi.mock('@/services/api-client', () => ({ apiRequest }))
vi.mock('@/config/client-env', () => ({ clientEnv: { demoMode: false } }))
vi.mock('@/lib/telegram', () => ({ telegram: { available: true } }))

import { recordPublicEvent } from './public-analytics'

describe('public analytics', () => {
  beforeEach(() => apiRequest.mockClear())

  it.each(['primary_cta_click', 'link_click', 'project_open', 'share'] as const)(
    'records %s without blocking navigation',
    (type) => {
      recordPublicEvent('ada', type, 'target-1')
      expect(apiRequest).toHaveBeenCalledWith('/api/public/cards/ada/events', {
        method: 'POST',
        body: JSON.stringify({ type, source: 'telegram', targetId: 'target-1' }),
        keepalive: true,
      })
    },
  )
})

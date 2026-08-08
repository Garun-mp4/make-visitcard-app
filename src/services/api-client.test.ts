import { afterEach, describe, expect, it, vi } from 'vitest'

import { apiRequest, setApiSessionToken } from './api-client'

describe('apiRequest', () => {
  afterEach(() => {
    setApiSessionToken(null)
    vi.unstubAllGlobals()
  })

  it('sends the in-memory bearer session with authenticated API requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    setApiSessionToken('signed-session')

    await apiRequest('/api/cards/me')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer signed-session')
  })

  it('turns an exceeded request timeout into a retryable API error', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_path: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            )
          }),
      ),
    )

    const request = expect(
      apiRequest('/api/cards/unpublish', { method: 'POST', timeoutMs: 50 }),
    ).rejects.toMatchObject({
      status: 408,
      payload: { code: 'request_timeout' },
    })
    await vi.advanceTimersByTimeAsync(51)
    await request
    vi.useRealTimers()
  })
})

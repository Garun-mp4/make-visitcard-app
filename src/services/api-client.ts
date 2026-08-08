interface ApiErrorPayload {
  code: string
  message: string
  requestId: string
  details?: unknown
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: ApiErrorPayload,
  ) {
    super(payload.message)
  }
}

let sessionToken: string | null = null

export function setApiSessionToken(token: string | null): void {
  sessionToken = token
}

export interface ApiRequestInit extends RequestInit {
  timeoutMs?: number
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { timeoutMs, ...requestInit } = init
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`)
  const timeoutController = timeoutMs ? new AbortController() : null
  const signal = timeoutController
    ? init.signal
      ? AbortSignal.any([init.signal, timeoutController.signal])
      : timeoutController.signal
    : init.signal
  const timeout = timeoutController ? setTimeout(() => timeoutController.abort(), timeoutMs) : null
  let response: Response
  try {
    response = await fetch(path, {
      ...requestInit,
      headers,
      credentials: 'same-origin',
      signal,
    })
  } catch (error) {
    if (timeoutController?.signal.aborted)
      throw new ApiError(408, {
        code: 'request_timeout',
        message: 'Сервер не ответил вовремя. Повторите попытку',
        requestId: 'client-timeout',
      })
    throw error
  } finally {
    if (timeout) clearTimeout(timeout)
  }
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const fallback: ApiErrorPayload = {
      code: 'request_failed',
      message: 'Не удалось выполнить запрос',
      requestId: response.headers.get('x-request-id') ?? 'unknown',
    }
    throw new ApiError(response.status, (data as ApiErrorPayload | null) ?? fallback)
  }
  return data as T
}

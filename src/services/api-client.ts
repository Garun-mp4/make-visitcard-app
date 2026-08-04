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

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  idToken?: string,
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (idToken) headers.set('Authorization', `Bearer ${idToken}`)

  const response = await fetch(path, { ...init, headers, credentials: 'same-origin' })
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

import { shareSourceTokenSchema } from '@shared/schemas'

const memoryVisits = new Map<string, string>()

function uuid(): string {
  const cryptoApi = typeof globalThis.crypto === 'object' ? globalThis.crypto : undefined
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID()
  if (cryptoApi?.getRandomValues) {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
}

function readVisit(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return memoryVisits.get(key) ?? null
  }
}

function writeVisit(key: string, value: string) {
  memoryVisits.set(key, value)
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Some embedded browsers deny storage access. The in-memory value still
    // keeps repeated events in this document tied to one visit.
  }
}

export function getPublicVisitContext(slug: string) {
  const key = `cardly:visit:${slug}`
  let visitId = readVisit(key)
  if (!visitId) {
    visitId = uuid()
    writeVisit(key, visitId)
  }
  const parsedToken = shareSourceTokenSchema.safeParse(
    new URLSearchParams(window.location.search).get('ref'),
  )
  return {
    visitId,
    eventId: uuid(),
    ...(parsedToken.success ? { sourceToken: parsedToken.data } : {}),
  }
}

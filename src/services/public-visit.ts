import { shareSourceTokenSchema } from '@shared/schemas'

function uuid(): string {
  return crypto.randomUUID()
}

export function getPublicVisitContext(slug: string) {
  const key = `cardly:visit:${slug}`
  let visitId = sessionStorage.getItem(key)
  if (!visitId) {
    visitId = uuid()
    sessionStorage.setItem(key, visitId)
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

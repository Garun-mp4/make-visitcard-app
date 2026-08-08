import type { AnalyticsEvent } from '@shared/types'
import { clientEnv } from '@/config/client-env'
import { apiRequest } from '@/services/api-client'
import { telegram } from '@/lib/telegram'

export function recordPublicEvent(
  slug: string,
  type: AnalyticsEvent['type'],
  targetId?: string,
): void {
  if (clientEnv.demoMode || !slug) return
  void apiRequest(`/api/public/cards/${slug}/events`, {
    method: 'POST',
    body: JSON.stringify({
      type,
      source: telegram.available ? 'telegram' : 'web',
      ...(targetId ? { targetId } : {}),
    }),
    keepalive: true,
  }).catch(() => undefined)
}

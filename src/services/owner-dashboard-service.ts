import type {
  CardStats,
  LeadRecord,
  OwnerPreferences,
  OwnerProfile,
  PeriodStats,
  StatsPeriod,
} from '@shared/types'
import { apiRequest } from '@/services/api-client'

export interface OwnerDashboard {
  owner: OwnerProfile
  stats: CardStats
  leads: LeadRecord[]
}

export function loadOwnerDashboard(): Promise<OwnerDashboard> {
  return apiRequest<OwnerDashboard>('/api/owner/dashboard')
}

export async function loadOwnerStats(period: StatsPeriod): Promise<PeriodStats> {
  const result = await apiRequest<{ stats: PeriodStats }>(`/api/owner/stats?period=${period}`)
  const stats = result.stats
  return {
    ...stats,
    funnel: stats.funnel ?? {
      views: stats.totals.views,
      interest: Math.min(stats.totals.views, stats.totals.projectOpens + stats.totals.linkClicks),
      contacts: Math.min(stats.totals.views, stats.totals.primaryClicks),
      leads: Math.min(stats.totals.views, stats.totals.leads),
      sampleSufficient: stats.totals.views >= 10,
    },
    sources: stats.sources ?? [
      {
        id: null,
        name: 'Direct',
        token: null,
        archived: false,
        views: stats.totals.views,
        leads: stats.totals.leads,
        conversion:
          stats.totals.views >= 10
            ? Math.round((stats.totals.leads / stats.totals.views) * 100)
            : null,
      },
    ],
    interest: stats.interest ?? [
      { label: 'projects', value: stats.totals.projectOpens },
      { label: 'services', value: 0 },
      { label: 'links', value: stats.totals.linkClicks },
    ],
  }
}

export function saveLeadStatus(id: string, status: LeadRecord['status']): Promise<{ ok: true }> {
  return apiRequest(`/api/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function saveOwnerPreferences(
  patch: Partial<OwnerPreferences>,
): Promise<OwnerPreferences> {
  const result = await apiRequest<{ preferences: OwnerPreferences }>('/api/owner/preferences', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return result.preferences
}

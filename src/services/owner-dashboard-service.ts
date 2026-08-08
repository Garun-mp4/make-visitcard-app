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
  return result.stats
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

import type { CardStats, LeadRecord, OwnerProfile } from '@shared/types'
import { apiRequest } from '@/services/api-client'

export interface OwnerDashboard {
  owner: OwnerProfile
  stats: CardStats
  leads: LeadRecord[]
}

export function loadOwnerDashboard(): Promise<OwnerDashboard> {
  return apiRequest<OwnerDashboard>('/api/owner/dashboard')
}

export function saveLeadStatus(id: string, status: LeadRecord['status']): Promise<{ ok: true }> {
  return apiRequest(`/api/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

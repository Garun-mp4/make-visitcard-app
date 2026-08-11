import type { z } from 'zod'

import type {
  analyticsEventSchema,
  appearanceSchema,
  cardDraftSchema,
  leadSchema,
  linkSchema,
  profileSchema,
  projectSchema,
  publicCardSchema,
  serviceSchema,
  skillSchema,
  telegramUserSchema,
  shareSourceCreateSchema,
  shareSourcePatchSchema,
  publicLeadSubmissionSchema,
} from './schemas.js'

export type CardDraft = z.infer<typeof cardDraftSchema>
export type PublicCard = z.infer<typeof publicCardSchema>
export type CardView = Pick<
  CardDraft,
  | 'profile'
  | 'primaryAction'
  | 'skills'
  | 'links'
  | 'services'
  | 'projects'
  | 'appearance'
  | 'publication'
  | 'updatedAt'
>
export type CardProfile = z.infer<typeof profileSchema>
export type Appearance = z.infer<typeof appearanceSchema>
export type Skill = z.infer<typeof skillSchema>
export type CardLink = z.infer<typeof linkSchema>
export type Service = z.infer<typeof serviceSchema>
export type Project = z.infer<typeof projectSchema>
export type LeadInput = z.infer<typeof leadSchema>
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>
export type PublicLeadSubmission = z.infer<typeof publicLeadSubmissionSchema>
export type ShareSourceCreate = z.infer<typeof shareSourceCreateSchema>
export type ShareSourcePatch = z.infer<typeof shareSourcePatchSchema>
export type TelegramUser = z.infer<typeof telegramUserSchema>

export interface OwnerProfile {
  uid: string
  telegramId: string
  firstName: string
  lastName: string
  username: string
  photoUrl: string
  languageCode: string
  isPremium: boolean
  platform: string
}

export interface OwnerPreferences {
  locale: 'ru' | 'en'
  leadNotificationsEnabled: boolean
}

export interface LeadRecord extends Omit<LeadInput, 'website'> {
  id: string
  ownerUid: string
  cardSlug: string
  status: 'new' | 'read' | 'archived'
  createdAt: string
}

export interface DailyMetric {
  date: string
  views: number
}

export interface CardStats {
  totalViews: number
  totalPrimaryClicks: number
  totalLinkClicks: number
  totalProjectOpens: number
  totalLeads: number
  totalShares: number
  daily: DailyMetric[]
  popularActions: Array<{ label: string; value: number }>
}

export type StatsPeriod = '7' | '30' | 'all'

export type PublicSyncState = 'not_published' | 'synced' | 'pending_validation'

export interface PublicSyncStatus {
  state: PublicSyncState
  syncedAt: string | null
  invalidPaths: string[]
}

export interface CardSaveResult {
  card: CardDraft
  publicSync: PublicSyncStatus
}

export interface PeriodStats {
  period: StatsPeriod
  range: { from: string | null; to: string | null }
  totals: {
    views: number
    primaryClicks: number
    linkClicks: number
    projectOpens: number
    leads: number
    shares: number
  }
  deltas: { views: number | null; primaryClicks: number | null; leads: number | null }
  series: Array<{ label: string; views: number }>
  averageViews: number
  popularActions: Array<{ label: 'primary' | 'links' | 'projects' | 'share'; value: number }>
  funnel: FunnelStats
  sources: ShareSourceStats[]
  interest: Array<{ label: 'projects' | 'services' | 'links'; value: number }>
}

export interface ShareSource {
  id: string
  name: string
  token: string
  archived: boolean
  views?: number
  createdAt: string
  updatedAt: string
}

export interface ShareSourceStats {
  id: string | null
  name: string
  token: string | null
  archived: boolean
  views: number
  leads: number
  conversion: number | null
}

export interface FunnelStats {
  views: number
  interest: number
  contacts: number
  leads: number
  sampleSufficient: boolean
}

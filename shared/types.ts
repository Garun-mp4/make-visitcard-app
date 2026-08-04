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

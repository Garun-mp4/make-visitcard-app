import { z } from 'zod'

export const reservedSlugs = new Set([
  'admin',
  'api',
  'app',
  'assets',
  'cardly',
  'editor',
  'firebase',
  'health',
  'login',
  'profile',
  'public',
  'settings',
  'signup',
  'stats',
  'support',
  'telegram',
  'vercel',
])

export const slugPattern = /^[a-z0-9](?:[a-z0-9]|-(?!-)){1,28}[a-z0-9]$/

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(slugPattern, 'Используйте строчные латинские буквы, цифры и одиночные дефисы')
  .refine((slug) => !reservedSlugs.has(slug), 'Этот адрес зарезервирован')

const controlCharacterPattern = /[\u0000-\u001f\u007f]/

export function isSafeExternalUrl(value: string, allowHttp = false): boolean {
  if (controlCharacterPattern.test(value)) return false

  try {
    const url = new URL(value)
    if (url.protocol === 'https:' || url.protocol === 'mailto:' || url.protocol === 'tel:') {
      return true
    }
    if (allowHttp && url.protocol === 'http:') return true
    return false
  } catch {
    return false
  }
}

export const safeUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => isSafeExternalUrl(value, process.env.NODE_ENV !== 'production'),
    'Небезопасная ссылка',
  )

const draftUrlSchema = z.string().trim().max(2048)
const optionalSafeUrlSchema = z.union([z.literal(''), safeUrlSchema])

export const availabilitySchema = z.enum(['available', 'busy', 'open_to_offers', 'unavailable'])
export const workFormatSchema = z.enum(['remote', 'hybrid', 'office', 'flexible'])
export const themeIdSchema = z.enum(['clean', 'dark', 'editorial'])
export const primaryActionTypeSchema = z.enum([
  'telegram',
  'email',
  'phone',
  'website',
  'booking',
  'custom',
])

export const profileSchema = z.object({
  displayName: z.string().trim().max(60),
  profession: z.string().trim().max(80),
  bio: z.string().trim().max(300),
  avatarUrl: draftUrlSchema,
  location: z.string().trim().max(80),
  workFormat: workFormatSchema,
  availabilityStatus: availabilitySchema,
  availabilityText: z.string().trim().max(100),
})

export const primaryActionSchema = z.object({
  type: primaryActionTypeSchema,
  label: z.string().trim().max(40),
  value: z.string().trim().max(2048),
  enabled: z.boolean(),
})

export const skillSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().trim().max(30),
  position: z.number().int().nonnegative(),
})

export const linkSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum([
    'telegram',
    'website',
    'github',
    'behance',
    'youtube',
    'vk',
    'linkedin',
    'pinterest',
    'email',
    'phone',
    'custom',
  ]),
  label: z.string().trim().max(60),
  url: draftUrlSchema,
  enabled: z.boolean(),
  public: z.boolean(),
  position: z.number().int().nonnegative(),
})

export const serviceSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().max(80),
  description: z.string().trim().max(240),
  priceType: z.enum(['fixed', 'from', 'negotiable', 'hidden']),
  price: z.number().nonnegative().nullable(),
  currency: z.enum(['RUB', 'USD', 'EUR']),
  durationText: z.string().trim().max(80),
  enabled: z.boolean(),
  position: z.number().int().nonnegative(),
})

export const projectSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().max(100),
  category: z.string().trim().max(60),
  description: z.string().trim().max(400),
  coverUrl: draftUrlSchema,
  projectUrl: draftUrlSchema,
  enabled: z.boolean(),
  position: z.number().int().nonnegative(),
})

export const appearanceSchema = z.object({
  themeId: themeIdSchema,
  accentPreset: z.enum(['green', 'orange', 'blue', 'violet', 'red']),
  avatarShape: z.enum(['circle', 'rounded', 'square']),
  visibleSections: z.array(z.enum(['skills', 'services', 'projects', 'contacts', 'lead'])),
  showLocation: z.boolean(),
  showAvailability: z.boolean(),
  showServices: z.boolean(),
  showProjects: z.boolean(),
  showSkills: z.boolean(),
  showContactForm: z.boolean(),
})

export const publicationSchema = z.object({
  slug: z.union([z.literal(''), slugSchema]),
  published: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
})

export const cardDraftSchema = z.object({
  ownerUid: z.string().min(1).max(128),
  profile: profileSchema,
  primaryAction: primaryActionSchema,
  skills: z.array(skillSchema).max(10),
  links: z.array(linkSchema).max(10),
  services: z.array(serviceSchema).max(6),
  projects: z.array(projectSchema).max(6),
  appearance: appearanceSchema,
  publication: publicationSchema,
  onboardingCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastPublishedAt: z.string().datetime().nullable(),
})

const publishableProfileSchema = profileSchema.extend({
  displayName: z.string().trim().min(2).max(60),
  profession: z.string().trim().min(2).max(80),
  avatarUrl: optionalSafeUrlSchema,
})

const publishablePrimaryActionSchema = primaryActionSchema.extend({
  label: z.string().trim().min(2).max(40),
  value: z.string().trim().min(2).max(2048),
  enabled: z.literal(true),
})

const publishableSkillSchema = skillSchema.extend({
  label: z.string().trim().min(1).max(30),
})

const publishableLinkSchema = linkSchema.extend({
  label: z.string().trim().min(1).max(60),
  url: safeUrlSchema,
})

const publishableServiceSchema = serviceSchema.extend({
  title: z.string().trim().min(2).max(80),
})

const publishableProjectSchema = projectSchema.extend({
  title: z.string().trim().min(2).max(100),
  coverUrl: optionalSafeUrlSchema,
  projectUrl: optionalSafeUrlSchema,
})

export const publishableCardSchema = cardDraftSchema.superRefine((card, context) => {
  const checks: Array<[z.ZodType, unknown, (string | number)[]]> = [
    [publishableProfileSchema, card.profile, ['profile']],
    [publishablePrimaryActionSchema, card.primaryAction, ['primaryAction']],
    [slugSchema, card.publication.slug, ['publication', 'slug']],
  ]
  card.skills.forEach((item, index) =>
    checks.push([publishableSkillSchema, item, ['skills', index]]),
  )
  card.links.forEach((item, index) => {
    if (item.enabled && item.public) checks.push([publishableLinkSchema, item, ['links', index]])
  })
  card.services.forEach((item, index) => {
    if (item.enabled) checks.push([publishableServiceSchema, item, ['services', index]])
  })
  card.projects.forEach((item, index) => {
    if (item.enabled) checks.push([publishableProjectSchema, item, ['projects', index]])
  })
  for (const [schema, value, prefix] of checks) {
    const result = schema.safeParse(value)
    if (!result.success) {
      for (const issue of result.error.issues)
        context.addIssue({ ...issue, path: [...prefix, ...issue.path] })
    }
  }
})

export const publicCardSchema = z.object({
  profile: publishableProfileSchema,
  primaryAction: publishablePrimaryActionSchema,
  skills: z.array(publishableSkillSchema).max(10),
  links: z.array(publishableLinkSchema).max(10),
  services: z.array(publishableServiceSchema).max(6),
  projects: z.array(publishableProjectSchema).max(6),
  appearance: appearanceSchema,
  publication: publicationSchema,
  updatedAt: z.string().datetime(),
})

export const leadSchema = z.object({
  senderName: z.string().trim().min(2).max(80),
  senderContact: z.string().trim().min(3).max(160),
  message: z.string().trim().min(5).max(1000),
  source: z.enum(['web', 'telegram', 'share', 'unknown']),
  website: z.string().max(0),
})

export const ownerPreferencesSchema = z.object({
  locale: z.enum(['ru', 'en']),
  leadNotificationsEnabled: z.boolean(),
})

export const ownerPreferencesPatchSchema = ownerPreferencesSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Укажите хотя бы одну настройку')

export const analyticsEventSchema = z.object({
  type: z.enum([
    'card_view',
    'primary_cta_click',
    'link_click',
    'project_open',
    'lead_submit',
    'share',
  ]),
  source: z.enum(['web', 'telegram', 'share', 'unknown']).default('unknown'),
  targetId: z.string().trim().max(80).optional(),
})

export const telegramUserSchema = z.object({
  id: z.number().int().positive().safe(),
  first_name: z.string().min(1).max(128),
  last_name: z.string().max(128).optional(),
  username: z.string().max(64).optional(),
  language_code: z.string().max(16).optional(),
  is_premium: z.boolean().optional(),
  photo_url: z.string().url().optional(),
})

export const startParameterSchema = slugSchema

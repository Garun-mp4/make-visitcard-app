import type { CardDraft, OwnerProfile } from './types.js'

export function createInitialCard(owner: OwnerProfile, timestamp = new Date().toISOString()): CardDraft {
  const displayName = [owner.firstName, owner.lastName].filter(Boolean).join(' ').trim()
  const telegramUrl = owner.username ? `https://t.me/${owner.username}` : ''
  const english = owner.languageCode.toLowerCase().startsWith('en')

  return {
    ownerUid: owner.uid,
    profile: {
      displayName,
      profession: '',
      bio: '',
      avatarUrl: owner.photoUrl,
      location: '',
      workFormat: 'remote',
      availabilityStatus: 'available',
      availabilityText: english ? 'Available for a new project' : 'Доступен для нового проекта',
    },
    primaryAction: {
      type: 'telegram',
      label: english ? 'Message on Telegram' : 'Написать в Telegram',
      value: telegramUrl,
      enabled: Boolean(telegramUrl),
    },
    skills: [],
    links: telegramUrl
      ? [
          {
            id: 'telegram-profile',
            type: 'telegram',
            label: 'Telegram',
            url: telegramUrl,
            enabled: true,
            public: true,
            position: 0,
          },
        ]
      : [],
    services: [],
    projects: [],
    appearance: {
      themeId: 'clean',
      accentPreset: 'green',
      avatarShape: 'circle',
      visibleSections: ['skills', 'services', 'projects', 'contacts', 'lead'],
      showLocation: true,
      showAvailability: true,
      showServices: true,
      showProjects: true,
      showSkills: true,
      showContactForm: true,
    },
    publication: { slug: '', published: false, publishedAt: null, updatedAt: null },
    onboardingCompleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastPublishedAt: null,
  }
}

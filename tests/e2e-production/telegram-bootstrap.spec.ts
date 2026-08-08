import { expect, test } from '@playwright/test'

const owner = {
  uid: 'tg_42',
  telegramId: '42',
  firstName: 'Garun',
  lastName: '',
  username: 'garun_web',
  photoUrl: '',
  languageCode: 'ru',
  isPremium: false,
  platform: 'Telegram Mini App',
}

test('Telegram bootstrap creates and persists a clean onboarding draft', async ({ page }) => {
  let savedCard = {
    ownerUid: owner.uid,
    profile: {
      displayName: 'Garun',
      profession: '',
      bio: '',
      avatarUrl: '',
      location: '',
      workFormat: 'remote',
      availabilityStatus: 'available',
      availabilityText: 'Доступен для нового проекта',
    },
    primaryAction: {
      type: 'telegram',
      label: 'Написать в Telegram',
      value: 'https://t.me/garun_web',
      enabled: true,
    },
    skills: [],
    links: [
      {
        id: 'telegram-profile',
        type: 'telegram',
        label: 'Telegram',
        url: 'https://t.me/garun_web',
        enabled: true,
        public: true,
        position: 0,
      },
    ],
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
    createdAt: '2026-08-08T08:00:00.000Z',
    updatedAt: '2026-08-08T08:00:00.000Z',
    lastPublishedAt: null,
  }
  const dashboard = {
    owner,
    stats: {
      totalViews: 0,
      totalPrimaryClicks: 0,
      totalLinkClicks: 0,
      totalProjectOpens: 0,
      totalLeads: 0,
      totalShares: 0,
      daily: [],
      popularActions: [],
    },
    leads: [],
  }

  await page.addInitScript(() => {
    ;(window as unknown as Record<string, unknown>).Telegram = {
      WebApp: {
        initData: 'signed-init-data',
        initDataUnsafe: {
          user: { id: 42, first_name: 'Garun', username: 'garun_web', language_code: 'ru' },
        },
        ready() {},
        expand() {},
        onEvent() {},
        offEvent() {},
      },
    }
  })
  await page.route('https://telegram.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  )
  await page.route('**/api/auth/telegram', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: owner,
        sessionToken: 'session',
        card: savedCard,
        dashboard,
        preferences: { locale: 'ru', leadNotificationsEnabled: true },
      }),
    })
  })
  await page.route('**/api/cards/me', async (route) => {
    if (route.request().method() === 'PUT') {
      savedCard = {
        ...JSON.parse(route.request().postData() ?? '{}'),
        updatedAt: new Date().toISOString(),
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          card: savedCard,
          publicSync: { state: 'not_published', syncedAt: null, invalidPaths: [] },
        }),
      })
    } else
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ card: savedCard }),
      })
  })

  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Ваша профессиональная визитка — внутри Telegram' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await page.getByLabel('Имя').fill('Garun QA')
  await expect.poll(() => savedCard.profile.displayName).toBe('Garun QA')
  expect(savedCard.profile.displayName).toBe('Garun QA')
  expect(savedCard.publication).toMatchObject({ slug: '', published: false })
  expect(savedCard.skills).toEqual([])

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByLabel('Имя')).toHaveValue('Garun QA')
})

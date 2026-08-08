import { expect, test } from '@playwright/test'

import { demoCard } from '../../shared/demo-data'

const owner = {
  uid: demoCard.ownerUid,
  telegramId: '42',
  firstName: 'Алексей',
  lastName: 'Волков',
  username: 'alexey_cardly',
  photoUrl: '',
  languageCode: 'ru',
  isPremium: false,
  platform: 'Telegram Mini App',
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as unknown as Record<string, unknown>).Telegram = {
      WebApp: {
        initData: 'signed-init-data',
        initDataUnsafe: {
          user: { id: 42, first_name: 'Алексей', username: 'alexey_cardly', language_code: 'ru' },
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
})

test('published edits go live and unpublish is serialized', async ({ page }, testInfo) => {
  let savedCard = structuredClone(demoCard)
  let publicCard: typeof demoCard | null = structuredClone(demoCard)
  let unpublishCount = 0
  let saveCount = 0
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

  await page.route('**/api/auth/telegram', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: owner,
        sessionToken: 'session',
        card: savedCard,
        dashboard,
        preferences: { locale: 'ru', leadNotificationsEnabled: true },
      }),
    }),
  )
  await page.route('**/api/cards/me', async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ card: savedCard }),
      })
      return
    }
    saveCount += 1
    const now = new Date().toISOString()
    savedCard = {
      ...JSON.parse(route.request().postData() ?? '{}'),
      publication: { ...savedCard.publication, updatedAt: now },
      lastPublishedAt: now,
      updatedAt: now,
    }
    publicCard = structuredClone(savedCard)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        card: savedCard,
        publicSync: { state: 'synced', syncedAt: now, invalidPaths: [] },
      }),
    })
  })
  await page.route('**/api/cards/unpublish', async (route) => {
    unpublishCount += 1
    const now = new Date().toISOString()
    savedCard = {
      ...savedCard,
      publication: { ...savedCard.publication, published: false, updatedAt: now },
      updatedAt: now,
    }
    publicCard = null
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        card: savedCard,
        publicSync: { state: 'not_published', syncedAt: null, invalidPaths: [] },
      }),
    })
  })
  await page.route('**/api/public/cards/alexey', (route) =>
    publicCard
      ? route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ card: publicCard }),
        })
      : route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'card_not_found',
            message: 'Визитка не найдена',
            requestId: 'e2e',
          }),
        }),
  )
  await page.route('**/api/public/cards/alexey/events', (route) =>
    route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    }),
  )

  await page.goto('/app/editor/appearance')
  await page.getByRole('button', { name: /Dark/ }).click()
  await expect(page.getByText('Сохранено')).toBeVisible()

  await page.goto('/c/alexey')
  await expect(page.locator('[data-public-theme="dark"]')).toBeVisible()

  await page.goto('/app/editor/publish')
  await expect(page.getByText('Все сохранённые изменения опубликованы.')).toBeVisible()
  await expect(page.getByRole('textbox', { name: /Адрес визитки/ })).toHaveCount(0)
  const widths = testInfo.project.name === 'telegram-mobile' ? [320, 390, 420] : [1440]
  for (const width of widths) {
    await page.setViewportSize({
      width,
      height: testInfo.project.name === 'telegram-mobile' ? 844 : 1024,
    })
    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(metrics.scrollWidth, `horizontal overflow at ${width}px`).toBe(metrics.clientWidth)
  }
  await page.screenshot({
    path: testInfo.outputPath(`publication-${testInfo.project.name}.png`),
    fullPage: true,
  })

  const savesBeforeUnpublish = saveCount
  await page.getByRole('button', { name: 'Снять с публикации' }).click()
  await page.getByRole('button', { name: 'Снять', exact: true }).click()
  await expect(page.getByText('Не опубликовано')).toBeVisible()
  expect(unpublishCount).toBe(1)
  expect(saveCount).toBe(savesBeforeUnpublish + 1)

  await page.goto('/c/alexey')
  await expect(page.getByRole('heading', { name: 'Визитка не найдена' })).toBeVisible()
})

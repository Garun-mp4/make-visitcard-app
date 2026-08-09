import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cardly-locale', 'ru'))
  await page.route('https://telegram.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  )
})

test('demo owner navigation and editor autosave', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Визитка' })).toBeVisible()
  await page.screenshot({
    path: `artifacts/visual-qa/owner-card-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await page.locator('nav[aria-label="Основная навигация"]:visible a[href="/app/editor"]').click()
  await page.getByRole('link', { name: 'Основное' }).click()
  const name = page.getByLabel('Имя')
  await name.fill('Алексей Тест')
  await expect(page.getByText('Сохранено')).toBeVisible()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(name).toHaveValue('Алексей Тест')
})

test('public card supports all themes and lead form', async ({ page }, testInfo) => {
  await page.goto('/c/alexey')
  await expect(page.getByRole('heading', { name: 'Алексей Волков' })).toBeVisible()
  await page.screenshot({
    path: `artifacts/visual-qa/public-clean-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Finflow' }).click()
  await expect(page.getByRole('dialog')).toContainText('Finflow')
  await page.getByRole('button', { name: 'Закрыть проект' }).click()
  await page.locator('#public-lead-form').scrollIntoViewIfNeeded()
  await page.getByLabel('Имя').fill('Мария')
  await page.getByRole('textbox', { name: 'Контакт', exact: true }).fill('maria@example.com')
  await page.getByRole('textbox', { name: 'Сообщение', exact: true }).fill('Хочу обсудить проект')
  await page.getByRole('button', { name: 'Отправить заявку' }).click()
  await expect(page.getByRole('status')).toContainText('Заявка отправлена')
})

test('theme switching persists into the public card', async ({ page }, testInfo) => {
  for (const theme of ['Dark', 'Editorial'] as const) {
    await page.goto('/app/editor/appearance')
    await page.getByRole('button', { name: new RegExp(theme) }).click()
    await expect(page.getByText('Сохранено')).toBeVisible()
    await page.goto('/c/alexey')
    await expect(page.locator(`[data-public-theme="${theme.toLowerCase()}"]`)).toBeVisible()
    await page.screenshot({
      path: `artifacts/visual-qa/public-${theme.toLowerCase()}-${testInfo.project.name}.png`,
      fullPage: true,
    })
  }
})

test('all accent presets color the public card across themes', async ({ page }) => {
  const cases = [
    { accent: 'green', theme: 'Clean', themeId: 'clean', rgb: 'rgb(31, 107, 79)' },
    { accent: 'orange', theme: 'Dark', themeId: 'dark', rgb: 'rgb(184, 91, 36)' },
    { accent: 'blue', theme: 'Editorial', themeId: 'editorial', rgb: 'rgb(50, 103, 168)' },
    { accent: 'violet', theme: 'Dark', themeId: 'dark', rgb: 'rgb(113, 83, 166)' },
    { accent: 'red', theme: 'Clean', themeId: 'clean', rgb: 'rgb(169, 78, 78)' },
  ] as const

  for (const { accent, theme, themeId, rgb } of cases) {
    await page.goto('/app/editor/appearance')
    await page.getByRole('button', { name: new RegExp(theme) }).click()
    await page.getByRole('button', { name: `Акцент ${accent}` }).click()
    await expect(page.getByText('Сохранено')).toBeVisible()

    await page.goto('/c/alexey')
    const publicCard = page.locator(
      `[data-public-theme="${themeId}"][data-public-accent="${accent}"]`,
    )
    await expect(publicCard).toBeVisible()
    await expect(publicCard.locator('[data-accent-surface="primary"]')).toHaveCSS(
      'background-color',
      rgb,
    )
  }
})

test('switch thumb stays inside its track and animates between states', async ({ page }) => {
  await page.goto('/app/editor/appearance')
  const control = page.getByRole('switch', { name: 'Город' })
  const thumb = control.locator('span')

  const expectThumbInsideTrack = async () => {
    const trackBox = await control.boundingBox()
    const thumbBox = await thumb.boundingBox()
    expect(trackBox).not.toBeNull()
    expect(thumbBox).not.toBeNull()
    expect(thumbBox!.x).toBeGreaterThanOrEqual(trackBox!.x + 2)
    expect(thumbBox!.x + thumbBox!.width).toBeLessThanOrEqual(trackBox!.x + trackBox!.width - 2)
  }

  await expect(control).toHaveAttribute('aria-checked', 'true')
  await expectThumbInsideTrack()
  await expect(thumb).toHaveCSS('transition-duration', '0.18s')

  await control.click()
  await expect(control).toHaveAttribute('aria-checked', 'false')
  await expectThumbInsideTrack()

  await control.focus()
  await page.keyboard.press('Space')
  await expect(control).toHaveAttribute('aria-checked', 'true')
  await expectThumbInsideTrack()
})

test('unknown route renders a not-found state', async ({ page }) => {
  await page.goto('/not-found')
  await expect(page.getByRole('heading')).toContainText('не найдена')
})

test('new editor rows start empty and language changes the whole navigation', async ({ page }) => {
  await page.goto('/app/editor/contacts')
  await page.getByRole('button', { name: 'Добавить' }).click()
  await expect(page.getByLabel('Название ссылки').last()).toHaveValue('')
  await expect(page.getByLabel('URL ссылки').last()).toHaveValue('')

  await page.goto('/app/profile')
  await page.getByRole('button', { name: /Язык интерфейса/ }).click()
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Statistics' })).toBeVisible()
})

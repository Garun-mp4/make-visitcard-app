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
  await expect(page.getByRole('button', { name: /Загрузить фото/ })).toHaveCount(0)
  await expect(page.locator('input[type="file"]')).toHaveCount(0)
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

test('editor and profile headers do not show inert overflow menus', async ({ page }) => {
  for (const path of ['/app/editor', '/app/profile']) {
    await page.goto(path)
    const header = page.locator('header.page-header')
    await expect(header).toBeVisible()
    await expect(header).not.toContainText('•••')
  }
})

test('repeating initial setup requires explicit confirmation', async ({ page }) => {
  await page.goto('/app/profile')
  await page.getByRole('button', { name: 'Повторить первичную настройку' }).click()

  const dialog = page.getByRole('alertdialog', { name: 'Повторить первичную настройку?' })
  await expect(dialog).toBeVisible()
  await expect(page).toHaveURL(/\/app\/profile$/)

  await dialog.getByRole('button', { name: 'Отмена' }).click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/app\/profile$/)

  await page.getByRole('button', { name: 'Повторить первичную настройку' }).click()
  await dialog.getByRole('button', { name: 'Повторить' }).click()
  await expect(page).toHaveURL(/\/app\/onboarding\/revisit$/)
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

test('project editor uploads a cover, tracks limits and keeps an empty URL private', async ({
  page,
}) => {
  await page.goto('/app/editor/projects')
  await page.getByRole('button', { name: 'Добавить' }).click()

  const editor = page.getByRole('dialog', { name: 'Редактировать проект' })
  await expect(editor).toBeVisible()
  await expect(editor.getByText('0/100')).toBeVisible()
  await expect(editor.getByText('0/60')).toBeVisible()
  await expect(editor.getByText('0/400')).toBeVisible()
  await expect(editor.getByText('0/2048')).toBeVisible()

  await editor.getByLabel('Название проекта').fill('Новый кейс')
  await editor.getByLabel('Категория').fill('Веб-дизайн')
  await editor.getByLabel('Описание').fill('Редизайн первого экрана продукта.')
  await editor.getByLabel('Изображение проекта').setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
  })
  await expect(editor.getByRole('img', { name: 'Обложка проекта' })).toBeVisible()

  const visibility = editor.getByRole('switch', { name: 'Показывать проект' })
  await visibility.click()
  await expect(visibility).toHaveAttribute('aria-checked', 'true')
  await editor.getByRole('button', { name: 'Закрыть' }).click()
  await expect(page.getByText('Сохранено')).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)

  await page.goto('/c/alexey')
  await page.getByRole('button', { name: /Новый кейс/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Новый кейс')
  await expect(page.getByRole('button', { name: /Открыть проект/ })).toHaveCount(0)
})

test('statistics exposes leads as a visible section and keeps the period', async ({
  page,
}, testInfo) => {
  await page.goto('/app/stats')

  await expect(page.getByRole('navigation', { name: 'Раздел статистики' })).toBeVisible()
  await expect(page.getByLabel('Открыть заявки')).toHaveCount(0)
  await page.getByRole('button', { name: '30 дней' }).click()
  await page.getByRole('link', { name: /Заявки.*1/ }).click()

  await expect(page).toHaveURL(/\/app\/stats\/leads\?period=30$/)
  await expect(page.getByRole('link', { name: 'Статистика' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('link', { name: /Заявки.*1/ })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('button', { name: 'Новые' })).toBeVisible()
  await page.screenshot({
    path: `artifacts/visual-qa/stats-leads-${testInfo.project.name}.png`,
    fullPage: true,
  })

  await page.getByRole('button', { name: 'Новые' }).click()
  await expect(page.getByText('Мария Орлова')).toBeVisible()
  await expect(page.getByText('Илья Морозов')).toHaveCount(0)

  await page.getByRole('button', { name: 'Прочитанные' }).click()
  await expect(page.getByText('Мария Орлова')).toHaveCount(0)
  await expect(page.getByText('Илья Морозов')).toBeVisible()

  await page.getByRole('link', { name: 'Обзор' }).click()
  await expect(page.getByRole('button', { name: '30 дней' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => document.documentElement.clientWidth),
  )
})

test('owner and public card Share buttons open the native share sheet', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data: ShareData) => {
        const calls = JSON.parse(
          sessionStorage.getItem('cardly-share-calls') ?? '[]',
        ) as ShareData[]
        sessionStorage.setItem('cardly-share-calls', JSON.stringify([...calls, data]))
        return Promise.resolve()
      },
    })
  })

  await page.goto('/app/card')
  await page.getByRole('button', { name: 'Поделиться', exact: true }).first().click()
  await expect
    .poll(() =>
      page.evaluate(
        () => (JSON.parse(sessionStorage.getItem('cardly-share-calls') ?? '[]') as ShareData[])[0],
      ),
    )
    .toMatchObject({ title: 'Алексей Волков', url: expect.stringMatching(/\/c\/alexey$/) })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/c/alexey')
  await page.getByRole('button', { name: 'Поделиться', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () => (JSON.parse(sessionStorage.getItem('cardly-share-calls') ?? '[]') as ShareData[])[1],
      ),
    )
    .toMatchObject({
      title: 'Алексей Волков',
      text: 'Product designer и frontend-разработчик',
      url: expect.stringMatching(/\/c\/alexey$/),
    })
})

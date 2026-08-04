import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
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
  await page.getByRole('button', { name: 'Написать', exact: true }).click()
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

test('unknown route renders a not-found state', async ({ page }) => {
  await page.goto('/not-found')
  await expect(page.getByRole('heading')).toContainText('не найдена')
})

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e-production',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-production' }]],
  use: { baseURL: 'http://127.0.0.1:5174', trace: 'on-first-retry', screenshot: 'only-on-failure' },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: !process.env.CI,
    env: { VITE_DEMO_MODE: 'false' },
  },
  projects: [
    {
      name: 'telegram-mobile',
      use: { ...devices['iPhone 13 Mini'], viewport: { width: 320, height: 844 } },
    },
    {
      name: 'telegram-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1024 } },
    },
  ],
})

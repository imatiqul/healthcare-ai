import { defineConfig, devices } from '@playwright/test';

/**
 * Cloud E2E test configuration — runs against deployed Azure infrastructure.
 * No local webServer needed; tests hit live SWA and ACA endpoints.
 */
export default defineConfig({
  testDir: './e2e-cloud',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html'], ['list']],
  timeout: 90_000,   // 90 s — MF2 version-first init can take 30-40s on cold CI (fetching 7 MFE remoteEntry files)
  use: {
    baseURL: process.env.SHELL_URL || 'https://gentle-tree-03115af0f.7.azurestaticapps.net',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',   // capture video on first retry for easier debugging
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

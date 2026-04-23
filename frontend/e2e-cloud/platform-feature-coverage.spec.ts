import { test, expect } from './fixtures';
import fs from 'node:fs';
import path from 'node:path';

type PlatformFeature = {
  name: string;
  route: string;
};

const SIDEBAR_GROUPS_ALL_OPEN = JSON.stringify({
  'nav.group.main': true,
  'nav.group.business': true,
  'nav.group.clinical': true,
  'nav.group.analytics': true,
  'nav.group.patient': true,
  'nav.group.governance': true,
  'nav.group.admin': true,
});

const manifestPath = path.resolve(process.cwd(), 'e2e-cloud', 'platform-feature-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PlatformFeature[];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe.configure({ mode: 'parallel' });

test.describe('Platform Feature Coverage — Cloud', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((groups) => {
      localStorage.setItem('hq:onboarded-v38', 'done');
      localStorage.setItem('hq:sidebar-groups', groups);
    }, SIDEBAR_GROUPS_ALL_OPEN);
  });

  for (const feature of manifest) {
    test(`[route:${feature.route}] ${feature.name} route renders`, async ({ page }) => {
      if (!feature.route.startsWith('/demo')) {
        // Keep route tests deterministic by forcing API offline behavior.
        // Most pages implement a demo-data fallback in their catch paths.
        await page.route('**/api/v1/**', async (route) => {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'stubbed offline backend for route coverage test' }),
          });
        });
      }

      await page.goto(feature.route);

      if (feature.route === '/') {
        await expect(page).toHaveURL(/\/$/);
      } else {
        await expect(page).toHaveURL(new RegExp(`${escapeRegex(feature.route)}$`));
      }

      await expect(page.locator('body')).not.toBeEmpty();

      if (feature.route.startsWith('/demo')) {
        await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 });
      } else {
        await expect(page.getByTestId('shell-sidebar')).toBeVisible({ timeout: 20_000 });
        await expect(page.locator('main')).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(/Unable to load/i)).toHaveCount(0);
      }
    });
  }
});

/**
 * Shared test fixtures for cloud E2E tests.
 *
 * Stubs the startup probe so backendOnline resolves to false instantly.
 * All guarded components then use demo data with zero APIM calls.
 *
 * Tests that need live API responses should register their own page.route()
 * inside beforeEach or the test body — Playwright applies routes in
 * reverse-registration order (last wins), so test-level routes take
 * priority over this fixture.
 */

import { test as base, expect } from '@playwright/test';

export const test = base.extend<object>({
  page: async ({ page }, use) => {
    // Return 404 from the probe → startupProbe() catch-block fires immediately
    // → setBackendOnline(false) in <100 ms → no APIM calls, no CORS errors.
    await page.route('**/api/v1/agents/stats', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'backend not deployed' }),
      }),
    );
    await use(page);
  },
});

export { expect };

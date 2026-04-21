import { test, expect } from '@playwright/test';

test.describe('Shell App — Cloud Navigation', () => {
  test('shell loads and shows the dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Healthcare AI/i);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('sidebar navigation links are present', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside, nav, [class*="sidebar"], [class*="Sidebar"]').first();
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Voice Sessions')).toBeVisible();
    await expect(sidebar.getByText('AI Triage')).toBeVisible();
    await expect(sidebar.getByText('Scheduling')).toBeVisible();
    await expect(sidebar.getByText('Population Health')).toBeVisible();
    await expect(sidebar.getByText('Revenue Cycle')).toBeVisible();
  });

  // Phase 41 — new sidebar nav items
  test('sidebar shows Clinical Alerts nav item', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside, nav, [class*="sidebar"], [class*="Sidebar"]').first();
    await expect(sidebar.getByText('Clinical Alerts')).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar shows Reports & Export nav item', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside, nav, [class*="sidebar"], [class*="Sidebar"]').first();
    await expect(sidebar.getByText('Reports & Export')).toBeVisible({ timeout: 10_000 });
  });

  test('can navigate to voice page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Voice Sessions').click();
    await expect(page).toHaveURL(/\/voice/);
  });

  test('can navigate to triage page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('AI Triage').click();
    await expect(page).toHaveURL(/\/triage/);
  });

  test('can navigate to scheduling page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Scheduling').click();
    await expect(page).toHaveURL(/\/scheduling/);
  });

  test('can navigate to population health page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Population Health').click();
    await expect(page).toHaveURL(/\/population-health/);
  });

  test('can navigate to revenue page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Revenue Cycle').click();
    await expect(page).toHaveURL(/\/revenue/);
  });

  // Phase 41 — new route navigation
  test('can navigate to Clinical Alerts page via sidebar', async ({ page }) => {
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.goto('/');
    await page.getByText('Clinical Alerts').click();
    await expect(page).toHaveURL(/\/alerts/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('can navigate to Reports & Export page via sidebar', async ({ page }) => {
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.goto('/');
    await page.getByText('Reports & Export').click();
    await expect(page).toHaveURL(/\/admin\/reports/);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

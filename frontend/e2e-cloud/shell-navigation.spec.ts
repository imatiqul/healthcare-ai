import { test, expect } from '@playwright/test';

test.describe('Shell App — Cloud Navigation', () => {
  test('shell loads and shows the dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HealthQ/i);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('sidebar navigation links are present', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('nav, [class*="sidebar"], [class*="Sidebar"]').first();
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Voice Sessions')).toBeVisible();
    await expect(sidebar.getByText('AI Triage')).toBeVisible();
    await expect(sidebar.getByText('Scheduling')).toBeVisible();
    await expect(sidebar.getByText('Population Health')).toBeVisible();
    await expect(sidebar.getByText('Revenue Cycle')).toBeVisible();
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
});

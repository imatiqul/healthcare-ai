# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shell-navigation.spec.ts >> Shell App — Cloud Navigation >> can navigate to triage page
- Location: e2e-cloud\shell-navigation.spec.ts:27:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByText('AI Triage')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Shell App — Cloud Navigation', () => {
  4  |   test('shell loads and shows the dashboard', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page).toHaveTitle(/HealthQ/i);
  7  |     await expect(page.locator('body')).not.toBeEmpty();
  8  |   });
  9  | 
  10 |   test('sidebar navigation links are present', async ({ page }) => {
  11 |     await page.goto('/');
  12 |     const sidebar = page.locator('nav, [class*="sidebar"], [class*="Sidebar"]').first();
  13 |     await expect(sidebar.getByText('Dashboard')).toBeVisible();
  14 |     await expect(sidebar.getByText('Voice Sessions')).toBeVisible();
  15 |     await expect(sidebar.getByText('AI Triage')).toBeVisible();
  16 |     await expect(sidebar.getByText('Scheduling')).toBeVisible();
  17 |     await expect(sidebar.getByText('Population Health')).toBeVisible();
  18 |     await expect(sidebar.getByText('Revenue Cycle')).toBeVisible();
  19 |   });
  20 | 
  21 |   test('can navigate to voice page', async ({ page }) => {
  22 |     await page.goto('/');
  23 |     await page.getByText('Voice Sessions').click();
  24 |     await expect(page).toHaveURL(/\/voice/);
  25 |   });
  26 | 
  27 |   test('can navigate to triage page', async ({ page }) => {
  28 |     await page.goto('/');
> 29 |     await page.getByText('AI Triage').click();
     |                                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  30 |     await expect(page).toHaveURL(/\/triage/);
  31 |   });
  32 | 
  33 |   test('can navigate to scheduling page', async ({ page }) => {
  34 |     await page.goto('/');
  35 |     await page.getByText('Scheduling').click();
  36 |     await expect(page).toHaveURL(/\/scheduling/);
  37 |   });
  38 | 
  39 |   test('can navigate to population health page', async ({ page }) => {
  40 |     await page.goto('/');
  41 |     await page.getByText('Population Health').click();
  42 |     await expect(page).toHaveURL(/\/population-health/);
  43 |   });
  44 | 
  45 |   test('can navigate to revenue page', async ({ page }) => {
  46 |     await page.goto('/');
  47 |     await page.getByText('Revenue Cycle').click();
  48 |     await expect(page).toHaveURL(/\/revenue/);
  49 |   });
  50 | });
  51 | 
```
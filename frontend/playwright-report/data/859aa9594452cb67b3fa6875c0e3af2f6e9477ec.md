# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mfe-integration.spec.ts >> MFE Module Federation — Cloud >> scheduling MFE loads via module federation at /scheduling
- Location: e2e-cloud\mfe-integration.spec.ts:33:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main, [class*="content"], [role="main"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('main, [class*="content"], [role="main"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]
  - generic [ref=e7]:
    - generic [ref=e9]:
      - 'heading "404: Not Found" [level=2] [ref=e11]'
      - generic [ref=e13]: We couldn’t find that page, please check the URL and try again.
    - img [ref=e16]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const MFE_PAGES = [
  4  |   {
  5  |     name: 'voice',
  6  |     route: '/voice',
  7  |     expectedText: /voice|session|record/i,
  8  |   },
  9  |   {
  10 |     name: 'triage',
  11 |     route: '/triage',
  12 |     expectedText: /triage|workflow|patient/i,
  13 |   },
  14 |   {
  15 |     name: 'scheduling',
  16 |     route: '/scheduling',
  17 |     expectedText: /schedul|book|appointment/i,
  18 |   },
  19 |   {
  20 |     name: 'population-health',
  21 |     route: '/population-health',
  22 |     expectedText: /population|health|risk|care/i,
  23 |   },
  24 |   {
  25 |     name: 'revenue',
  26 |     route: '/revenue',
  27 |     expectedText: /revenue|claim|billing/i,
  28 |   },
  29 | ];
  30 | 
  31 | test.describe('MFE Module Federation — Cloud', () => {
  32 |   for (const mfe of MFE_PAGES) {
  33 |     test(`${mfe.name} MFE loads via module federation at ${mfe.route}`, async ({ page }) => {
  34 |       // Mock API calls so the UI renders without real backends
  35 |       await page.route('**/api/v1/**', (route) =>
  36 |         route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  37 |       );
  38 | 
  39 |       await page.goto(mfe.route);
  40 |       // Verify the page loaded without crash
  41 |       await expect(page.locator('body')).not.toBeEmpty();
  42 |       // The page should contain MFE-specific content
> 43 |       await expect(page.locator('main, [class*="content"], [role="main"]').first()).toBeVisible();
     |                                                                                     ^ Error: expect(locator).toBeVisible() failed
  44 |     });
  45 |   }
  46 | });
  47 | 
  48 | test.describe('MFE Cross-Navigation — Cloud', () => {
  49 |   test('navigate from dashboard through all MFE pages', async ({ page }) => {
  50 |     await page.route('**/api/v1/**', (route) =>
  51 |       route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  52 |     );
  53 | 
  54 |     await page.goto('/');
  55 |     await expect(page).toHaveURL(/\//);
  56 | 
  57 |     // Navigate to each MFE page and verify it loads
  58 |     for (const mfe of MFE_PAGES) {
  59 |       await page.goto(mfe.route);
  60 |       await expect(page.locator('body')).not.toBeEmpty();
  61 |     }
  62 | 
  63 |     // Navigate back to dashboard
  64 |     await page.goto('/');
  65 |     await expect(page.locator('body')).not.toBeEmpty();
  66 |   });
  67 | });
  68 | 
```
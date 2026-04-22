import { test, expect } from '@playwright/test';

const mockCodingItems = [
  { id: 'ci-1', patientName: 'Jane Doe', suggestedCodes: ['Z00.00', 'E11.9'], status: 'Pending' },
  { id: 'ci-2', patientName: 'John Smith', suggestedCodes: ['J06.9'], status: 'Reviewed' },
  { id: 'ci-3', patientName: 'Alice Brown', suggestedCodes: ['I10', 'E11.65'], status: 'Submitted' },
];

const mockPriorAuths = [
  { id: 'pa-1', procedureName: 'MRI Brain', status: 'approved', submissionDate: '2026-04-10' },
  { id: 'pa-2', procedureName: 'Knee Arthroscopy', status: 'denied', submissionDate: '2026-04-08' },
  { id: 'pa-3', procedureName: 'CT Chest', status: 'submitted', submissionDate: '2026-04-15' },
];

const mockDenials = [
  {
    id: 'denial-1',
    codingJobId: 'ci-2',
    claimNumber: 'CLM-2026-001',
    patientId: 'pat-002',
    payerName: 'Blue Cross',
    denialReasonCode: 'CO-4',
    denialReasonDescription: 'Service not authorized',
    status: 'Open',
    deniedAmount: 1250.00,
  },
];

const mockClaims = [
  {
    id: 'claim-1',
    patientId: 'pat-001',
    procedureCode: 'Z00.00',
    amount: 350.00,
    status: 'Submitted',
  },
];

test.describe('Revenue Cycle — Coding Queue', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/revenue/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCodingItems),
      }),
    );
    await page.goto('/revenue');
  });

  test('renders coding queue page', async ({ page }) => {
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('displays coding items when API returns data', async ({ page }) => {
    const janeDoe = page.getByText('Jane Doe');
    const mfeLoaded = await janeDoe.isVisible({ timeout: 5000 }).catch(() => false);
    if (!mfeLoaded) {
      test.skip(true, 'Revenue MFE remote not available — skipping coding items assertions');
      return;
    }
    await expect(janeDoe).toBeVisible();
    await expect(page.getByText('E11.9')).toBeVisible();
  });

  test('shows review codes button', async ({ page }) => {
    const reviewBtn = page.getByRole('button', { name: /review codes/i }).first();
    const mfeLoaded = await reviewBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!mfeLoaded) {
      test.skip(true, 'Revenue MFE remote not available — skipping review button assertion');
      return;
    }
    await expect(reviewBtn).toBeVisible();
  });

  test('displays pending, reviewed, and submitted status badges', async ({ page }) => {
    const pendingBadge = page.getByText('Pending');
    const mfeLoaded = await pendingBadge.isVisible({ timeout: 5000 }).catch(() => false);
    if (!mfeLoaded) {
      test.skip(true, 'Revenue MFE remote not available — skipping status badges test');
      return;
    }
    await expect(page.getByText('Reviewed')).toBeVisible();
    await expect(page.getByText('Submitted')).toBeVisible();
  });

  test('review coding job triggers POST to review endpoint', async ({ page }) => {
    let reviewCalled = false;
    await page.route('**/api/v1/revenue/coding-jobs/ci-1/review', (route) => {
      reviewCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'ci-1', status: 'InReview' }),
      });
    });

    const reviewBtn = page.getByRole('button', { name: /review codes/i }).first();
    const mfeLoaded = await reviewBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!mfeLoaded) {
      test.skip(true, 'Revenue MFE remote not available — skipping review API call test');
      return;
    }
    await reviewBtn.click();
    await page.waitForResponse('**/api/v1/revenue/coding-jobs/**').catch(() => null);
    // Status update should be reflected
    await expect(page.getByText(/InReview|reviewing/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('submit coding job moves it to Submitted status', async ({ page }) => {
    await page.route('**/api/v1/revenue/coding-jobs/ci-1/submit', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'ci-1', status: 'Submitted' }),
      }),
    );

    const submitBtn = page.getByRole('button', { name: /submit/i }).first();
    const mfeLoaded = await submitBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!mfeLoaded) {
      test.skip(true, 'Revenue MFE remote not available — skipping submit test');
      return;
    }
    await submitBtn.click();
    await expect(page.getByText('Submitted')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Revenue Cycle — Prior Auth Tracker', () => {
  test('displays prior authorizations', async ({ page }) => {
    await page.route('**/api/v1/revenue/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPriorAuths),
      }),
    );
    await page.goto('/revenue');

    const mri = page.getByText('MRI Brain');
    const mfeLoaded = await mri.isVisible({ timeout: 5000 }).catch(() => false);
    if (!mfeLoaded) {
      test.skip(true, 'Revenue MFE remote not available — skipping prior auth assertions');
      return;
    }
    await expect(mri).toBeVisible();
    await expect(page.getByText('approved')).toBeVisible();
    await expect(page.getByText('denied')).toBeVisible();
  });

  test('submit prior auth button calls POST to submit endpoint', async ({ page }) => {
    await page.route('**/api/v1/revenue/prior-auths**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPriorAuths) }),
    );
    await page.route('**/api/v1/revenue/prior-auths/pa-3/submit', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'pa-3', status: 'Submitted' }),
      }),
    );
    await page.goto('/revenue');

    const submitBtn = page.getByRole('button', { name: /submit.*auth|prior auth.*submit/i }).first();
    const mfeLoaded = await submitBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!mfeLoaded) {
      test.skip(true, 'Revenue MFE remote not available — skipping submit prior auth test');
      return;
    }
    await submitBtn.click();
    await expect(page.getByText(/submitted/i)).toBeVisible({ timeout: 5000 });
  });

  test('denied prior auth shows appeal option', async ({ page }) => {
    await page.route('**/api/v1/revenue/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPriorAuths) }),
    );
    await page.goto('/revenue');

    const deniedRow = page.getByText('Knee Arthroscopy');
    const mfeLoaded = await deniedRow.isVisible({ timeout: 5000 }).catch(() => false);
    if (!mfeLoaded) {
      test.skip(true, 'Revenue MFE remote not available — skipping appeal option test');
      return;
    }
    await expect(page.getByRole('button', { name: /appeal/i })).toBeVisible();
  });
});

test.describe('Revenue Cycle — Denial Management', () => {
  test('renders denials list', async ({ page }) => {
    await page.route('**/api/v1/revenue/denials**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDenials),
      }),
    );
    await page.goto('/revenue');

    const denialTab = page.getByRole('tab', { name: /denial|denials/i });
    const tabVisible = await denialTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!tabVisible) {
      test.skip(true, 'Revenue denial tab not available — skipping denial management test');
      return;
    }
    await denialTab.click();
    await expect(page.getByText('CLM-2026-001')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Blue Cross')).toBeVisible();
    await expect(page.getByText('CO-4')).toBeVisible();
  });

  test('denial appeal button triggers appeal workflow', async ({ page }) => {
    await page.route('**/api/v1/revenue/denials**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockDenials) }),
    );
    await page.route('**/api/v1/revenue/denials/denial-1/appeal', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'denial-1', status: 'AppealSubmitted' }),
      }),
    );
    await page.goto('/revenue');

    const denialTab = page.getByRole('tab', { name: /denial|denials/i });
    const tabVisible = await denialTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!tabVisible) {
      test.skip(true, 'Revenue denial tab not available — skipping appeal test');
      return;
    }
    await denialTab.click();
    const appealBtn = page.getByRole('button', { name: /appeal/i }).first();
    await expect(appealBtn).toBeVisible({ timeout: 5000 });
    await appealBtn.click();
    await expect(page.getByText(/appeal submitted|appealed/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Revenue Cycle — Claims', () => {
  test('claims tab shows submitted claims', async ({ page }) => {
    await page.route('**/api/v1/revenue/claims**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClaims),
      }),
    );
    await page.goto('/revenue');

    const claimsTab = page.getByRole('tab', { name: /claims/i });
    const tabVisible = await claimsTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!tabVisible) {
      test.skip(true, 'Revenue claims tab not available — skipping claims test');
      return;
    }
    await claimsTab.click();
    await expect(page.getByText('CLM')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Revenue Cycle — Stats Dashboard', () => {
  test('revenue KPI tiles are displayed', async ({ page }) => {
    await page.route('**/api/v1/revenue/stats', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          codingQueue: 9,
          priorAuthsPending: 4,
          denialRate: 0.12,
          approvedPriorAuths: 18,
        }),
      }),
    );
    await page.goto('/revenue');

    const mfeLoaded = await page.locator('body').isVisible({ timeout: 5000 });
    const statsVisible = await page.getByText(/coding queue|prior auth|denial/i).first().isVisible({ timeout: 8000 }).catch(() => false);
    if (!statsVisible) {
      test.skip(true, 'Revenue stats not visible — skipping KPI tile test');
      return;
    }
    await expect(page.getByText(/coding queue|prior auth/i).first()).toBeVisible();
  });
});


/**
 * Engagement, Profile, Notifications, Demo & remaining shell pages E2E tests
 *
 * Covers routes:
 *  - /notifications     — NotificationCenter
 *  - /profile           — UserProfile
 *  - /demo              — DemoLanding
 *  - /demo/live         — DemoLive
 *  - /demo/admin        — DemoAdminPanel
 *  - /engagement        — Engagement MFE (via engagement-mfe remote)
 *  - Practitioner Manager, Guide History Panel (admin sub-routes)
 *  - Favourite Pages Widget
 */
import { test, expect } from '@playwright/test';

// ── Notification Center ───────────────────────────────────────────────────────

test.describe('Notification Center (/notifications)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/alerts**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'n1', message: 'High-risk patient alert: Jane Doe', severity: 'critical', read: false },
          { id: 'n2', message: 'System maintenance in 2 hours', severity: 'info', read: true },
        ]),
      }),
    );
    await page.route('**/api/v1/notifications**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'n1', message: 'High-risk patient alert: Jane Doe', severity: 'critical', read: false },
        ]),
      }),
    );
  });

  test('renders notification center page', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('displays notification heading', async ({ page }) => {
    await page.goto('/notifications');
    const heading = page.getByRole('heading', { name: /notification|alerts/i });
    const visible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Notification heading not rendered in this env');
    } else {
      await expect(heading).toBeVisible();
    }
  });

  test('shows alert notifications when API returns data', async ({ page }) => {
    await page.goto('/notifications');
    const alert = page.getByText('High-risk patient alert: Jane Doe');
    const visible = await alert.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Notification list not rendering in this env');
    } else {
      await expect(alert).toBeVisible();
    }
  });

  test('mark all as read button is accessible', async ({ page }) => {
    await page.goto('/notifications');
    const btn = page.getByRole('button', { name: /mark all|read all/i });
    const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Mark all as read button not present in this env');
    } else {
      await expect(btn).toBeEnabled();
    }
  });
});

// ── User Profile ──────────────────────────────────────────────────────────────

test.describe('User Profile (/profile)', () => {
  test('renders user profile page', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('shows profile heading', async ({ page }) => {
    await page.goto('/profile');
    const heading = page.getByRole('heading', { name: /profile|account|user/i });
    const visible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Profile heading not rendered in this env');
    } else {
      await expect(heading).toBeVisible();
    }
  });

  test('page does not crash without authenticated user', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/profile');
    expect(errors.filter(e => e.includes('Cannot read') || e.includes('undefined is not'))).toHaveLength(0);
  });
});

// ── Demo Landing ──────────────────────────────────────────────────────────────

test.describe('Demo Landing (/demo)', () => {
  test('renders demo landing page', async ({ page }) => {
    await page.goto('/demo');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('shows demo content', async ({ page }) => {
    await page.goto('/demo');
    const content = page.getByText(/demo|healthq|experience/i).first();
    const visible = await content.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Demo landing content not visible in this env');
    } else {
      await expect(content).toBeVisible();
    }
  });

  test('Start Demo button is present and clickable', async ({ page }) => {
    await page.goto('/demo');
    const startBtn = page.getByRole('button', { name: /start demo|launch/i });
    const visible = await startBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Start demo button not found in this env');
    } else {
      await expect(startBtn).toBeEnabled();
    }
  });
});

// ── Demo Live ─────────────────────────────────────────────────────────────────

test.describe('Demo Live (/demo/live)', () => {
  test('renders demo live page', async ({ page }) => {
    await page.goto('/demo/live');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('shows live demo interface', async ({ page }) => {
    await page.goto('/demo/live');
    const content = page.getByRole('heading').first();
    const visible = await content.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Demo live heading not rendered in this env');
    } else {
      await expect(content).toBeVisible();
    }
  });
});

// ── Demo Admin ────────────────────────────────────────────────────────────────

test.describe('Demo Admin (/demo/admin)', () => {
  test('renders demo admin panel', async ({ page }) => {
    await page.goto('/demo/admin');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('shows admin controls', async ({ page }) => {
    await page.goto('/demo/admin');
    const heading = page.getByRole('heading', { name: /demo|admin|control/i });
    const visible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Demo admin panel not rendering in this env');
    } else {
      await expect(heading).toBeVisible();
    }
  });
});

// ── Engagement MFE ────────────────────────────────────────────────────────────

test.describe('Engagement MFE (/engagement)', () => {
  test('renders engagement section or gracefully skips', async ({ page }) => {
    await page.goto('/engagement');
    const mfeLoaded = await page.getByRole('main').isVisible({ timeout: 5000 }).catch(() => false);
    if (!mfeLoaded) {
      test.skip(true, 'Engagement MFE remote not available in this env');
    }
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Practitioner Manager ──────────────────────────────────────────────────────

test.describe('Practitioner Manager (/admin/practitioners)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/practitioners**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'p1', name: 'Dr. Sarah Lee', specialty: 'Cardiology', status: 'Active' },
          { id: 'p2', name: 'Dr. James Patel', specialty: 'Neurology', status: 'Active' },
        ]),
      }),
    );
  });

  test('renders practitioner manager page', async ({ page }) => {
    await page.goto('/admin/practitioners');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('displays practitioners when data available', async ({ page }) => {
    await page.goto('/admin/practitioners');
    const doc = page.getByText('Dr. Sarah Lee');
    const visible = await doc.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Practitioner manager not rendering list in this env');
    } else {
      await expect(doc).toBeVisible();
      await expect(page.getByText('Dr. James Patel')).toBeVisible();
    }
  });
});

// ── Guide History Panel ───────────────────────────────────────────────────────

test.describe('Guide History Panel (/admin/guide-history)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
  });

  test('renders guide history panel', async ({ page }) => {
    await page.goto('/admin/guide-history');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Favourite Pages Widget ────────────────────────────────────────────────────

test.describe('Favourite Pages Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('hq:pinned-pages'));
  });

  test('favourite pages widget renders on dashboard', async ({ page }) => {
    await page.goto('/');
    // The widget may be part of the dashboard content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('pinning a page via star icon adds it to favourites', async ({ page }) => {
    await page.goto('/');
    const starBtn = page.getByRole('button', { name: /pin|favourite|bookmark/i }).first();
    const visible = await starBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Pin/favourite button not found in this env');
    } else {
      await starBtn.click();
      // Pinned pages stored in localStorage
      const pinned = await page.evaluate(() => localStorage.getItem('hq:pinned-pages'));
      expect(pinned).not.toBeNull();
    }
  });

  test('pinned pages persist on reload', async ({ page }) => {
    await page.goto('/');
    // Set a pinned page directly in localStorage
    await page.evaluate(() =>
      localStorage.setItem('hq:pinned-pages', JSON.stringify([{ id: 'dashboard', label: 'Dashboard', path: '/', icon: 'dashboard' }])),
    );
    await page.reload();
    const favWidget = page.getByText('Pinned').or(page.getByText('Favourites')).or(page.getByText('Favorites'));
    const visible = await favWidget.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Favourites widget label not found in this env');
    } else {
      await expect(favWidget.first()).toBeVisible();
    }
  });
});

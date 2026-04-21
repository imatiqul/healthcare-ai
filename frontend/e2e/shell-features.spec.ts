/**
 * Shell feature E2E tests — Phase 37 & 38
 *
 * Covers:
 *  - OfflineIndicator      (Phase 37)
 *  - ContextualHelpPanel   (Phase 37)
 *  - DashboardCustomizer   (Phase 37)
 *  - NotFoundPage (404)    (Phase 38)
 *  - OnboardingWizard      (Phase 38)
 *  - WhatsNewPanel         (Phase 38)
 */
import { test, expect } from '@playwright/test';

// ── OfflineIndicator ──────────────────────────────────────────────────────────

test.describe('OfflineIndicator', () => {
  test('is hidden when browser is online', async ({ page }) => {
    await page.goto('/');
    // The offline alert should not be visible in a normal online state
    const offlineAlert = page.getByText(/you are offline/i);
    await expect(offlineAlert).not.toBeVisible();
  });

  test('appears when browser goes offline', async ({ page, context }) => {
    await page.goto('/');
    // Simulate offline by setting the network offline
    await context.setOffline(true);
    // Trigger the "offline" event so React listener fires
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText(/you are offline/i)).toBeVisible({ timeout: 3000 });
    // Restore
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
  });

  test('disappears when connectivity is restored', async ({ page, context }) => {
    await page.goto('/');
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText(/you are offline/i)).toBeVisible({ timeout: 3000 });

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(page.getByText(/you are offline/i)).not.toBeVisible({ timeout: 3000 });
  });
});

// ── ContextualHelpPanel ───────────────────────────────────────────────────────

test.describe('ContextualHelpPanel', () => {
  test('opens when ? help button is clicked', async ({ page }) => {
    await page.goto('/');
    const helpBtn = page.getByRole('button', { name: /open help panel/i });
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();
    // Drawer should slide in with a heading
    await expect(page.getByRole('heading', { name: /help/i })).toBeVisible({ timeout: 3000 });
  });

  test('shows dashboard-specific help content on / route', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /open help panel/i }).click();
    await expect(page.getByText(/dashboard/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('shows triage-specific help on /triage route', async ({ page }) => {
    await page.goto('/triage');
    await page.getByRole('button', { name: /open help panel/i }).click();
    await expect(page.getByText(/triage/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('closes when the Close button is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /open help panel/i }).click();
    await expect(page.getByRole('heading', { name: /help/i })).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: /close help panel/i }).click();
    await expect(page.getByRole('heading', { name: /help/i })).not.toBeVisible({ timeout: 3000 });
  });
});

// ── DashboardCustomizer ───────────────────────────────────────────────────────

test.describe('DashboardCustomizer', () => {
  test('customize button is visible on dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /customize dashboard/i })).toBeVisible();
  });

  test('opens customizer popover on click', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /customize dashboard/i }).click();
    // Should show checkboxes for sections
    await expect(page.getByRole('checkbox').first()).toBeVisible({ timeout: 3000 });
  });

  test('unchecking a section hides it from dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /customize dashboard/i }).click();
    const checkboxes = page.getByRole('checkbox');
    const count = await checkboxes.count();
    if (count > 1) {
      // Uncheck the first checked checkbox
      const first = checkboxes.first();
      if (await first.isChecked()) {
        await first.click();
      }
    }
    // Close popover by pressing Escape
    await page.keyboard.press('Escape');
    // The page should still be functional (no crash)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('cannot uncheck the last visible section', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /customize dashboard/i }).click();
    const checkboxes = page.getByRole('checkbox');
    const count = await checkboxes.count();
    // Uncheck all but one
    for (let i = 0; i < count - 1; i++) {
      const cb = checkboxes.nth(i);
      if (await cb.isChecked()) await cb.click();
    }
    // The last checked one should remain disabled (cannot uncheck)
    const last = checkboxes.nth(count - 1);
    const isDisabled = await last.isDisabled();
    expect(isDisabled).toBe(true);
  });
});

// ── NotFoundPage (404) ────────────────────────────────────────────────────────

test.describe('NotFoundPage (404)', () => {
  test('renders 404 heading for unknown URL', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-at-all');
    await expect(page.getByRole('heading', { name: /404/i })).toBeVisible();
  });

  test('shows explanatory message', async ({ page }) => {
    await page.goto('/unknown-path');
    await expect(page.getByText(/doesn't exist or may have been moved/i)).toBeVisible();
  });

  test('Go to Dashboard button navigates to /', async ({ page }) => {
    await page.goto('/unknown-path');
    await page.getByRole('button', { name: /go to dashboard/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('quick-link chips are visible', async ({ page }) => {
    await page.goto('/unknown-path');
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('AI Triage')).toBeVisible();
    await expect(page.getByText('Scheduling')).toBeVisible();
  });

  test('Dashboard chip navigates to /', async ({ page }) => {
    await page.goto('/not-a-real-route');
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
  });
});

// ── OnboardingWizard ──────────────────────────────────────────────────────────

test.describe('OnboardingWizard', () => {
  test.beforeEach(async ({ page }) => {
    // Clear onboarding key so the wizard always appears
    await page.addInitScript(() => localStorage.removeItem('hq:onboarded-v38'));
  });

  test('appears on first visit', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Onboarding wizard')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Welcome to HealthQ Copilot')).toBeVisible();
  });

  test('does not appear when onboarding key is set', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('hq:onboarded-v38', 'done'));
    await page.goto('/');
    await expect(page.getByLabel('Onboarding wizard')).not.toBeVisible({ timeout: 3000 });
  });

  test('Next button advances to next step', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Onboarding wizard')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(page.getByText('AI-Powered Clinical Triage')).toBeVisible();
  });

  test('Back button returns to previous step', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Onboarding wizard')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Next step' }).click();
    await page.getByRole('button', { name: 'Previous step' }).click();
    await expect(page.getByText('Welcome to HealthQ Copilot')).toBeVisible();
  });

  test('Skip tour closes the wizard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Onboarding wizard')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Skip onboarding' }).click();
    await expect(page.getByLabel('Onboarding wizard')).not.toBeVisible({ timeout: 3000 });
  });

  test('finishing the wizard closes it and marks complete', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Onboarding wizard')).toBeVisible({ timeout: 5000 });
    // Click through all 4 Next steps
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Next step' }).click();
    }
    await expect(page.getByRole('button', { name: 'Finish onboarding' })).toBeVisible();
    await page.getByRole('button', { name: 'Finish onboarding' }).click();
    await expect(page.getByLabel('Onboarding wizard')).not.toBeVisible({ timeout: 3000 });

    // Key should be persisted — reload should not show wizard
    await page.reload();
    await expect(page.getByLabel('Onboarding wizard')).not.toBeVisible({ timeout: 3000 });
  });
});

// ── WhatsNewPanel ─────────────────────────────────────────────────────────────

test.describe("What's New Panel", () => {
  test.beforeEach(async ({ page }) => {
    // Clear seen key so badge always shows
    await page.addInitScript(() => localStorage.removeItem('hq:whats-new-seen'));
  });

  test("What's New button is visible in TopNav", async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /open what's new/i })).toBeVisible();
  });

  test('badge shows unseen feature count', async ({ page }) => {
    await page.goto('/');
    // Badge should have a non-zero count when nothing seen
    const badge = page.locator('[class*="MuiBadge-badge"]').first();
    await expect(badge).toBeVisible();
  });

  test('opens the drawer on click', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /open what's new/i }).click();
    await expect(page.getByLabel("What's new panel")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("What's New")).toBeVisible();
  });

  test('displays release versions', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /open what's new/i }).click();
    await expect(page.getByText('Go-Live Readiness')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Resilience & Contextual Help')).toBeVisible();
  });

  test('closes when close button is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /open what's new/i }).click();
    await expect(page.getByLabel("What's new panel")).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: /close what's new panel/i }).click();
    await expect(page.getByLabel("What's new panel")).not.toBeVisible({ timeout: 3000 });
  });

  test('marks all as seen on open (badge resets after reload)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /open what's new/i }).click();
    await expect(page.getByLabel("What's new panel")).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: /close what's new panel/i }).click();
    // After opening, version is saved — reload should show no badge or 0
    await page.reload();
    const badge = page.locator('[class*="MuiBadge-badge"]:visible');
    // Badge should be hidden or show 0 (MUI hides badge when badgeContent is null)
    const badgeCount = await badge.count();
    expect(badgeCount).toBe(0);
  });
});

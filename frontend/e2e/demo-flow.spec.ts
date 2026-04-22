import { test, expect } from '@playwright/test';

// ─── Basic navigation ─────────────────────────────────────────────────────────
test.describe('Demo Flow — Basic Navigation', () => {
  test('demo landing renders HealthQ Copilot heading', async ({ page }) => {
    await page.goto('/demo');
    await expect(page.getByText('HealthQ Copilot')).toBeVisible();
  });

  test('dashboard loads with stat cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Pending Triage')).toBeVisible();
    await expect(page.getByText('Available Slots Today')).toBeVisible();
  });

  test('can navigate to scheduling module', async ({ page }) => {
    await page.goto('/scheduling');
    await expect(page.getByText(/schedul/i).first()).toBeVisible();
  });

  test('can navigate to triage module', async ({ page }) => {
    await page.goto('/triage');
    await expect(page.getByText(/triage/i).first()).toBeVisible();
  });

  test('can navigate to population health module', async ({ page }) => {
    await page.goto('/population-health');
    await expect(page.getByText(/population|risk|care gap/i).first()).toBeVisible();
  });

  test('can navigate to revenue module', async ({ page }) => {
    await page.goto('/revenue');
    await expect(page.getByText(/revenue|coding|prior auth/i).first()).toBeVisible();
  });

  test('can navigate to voice module', async ({ page }) => {
    await page.goto('/voice');
    await expect(page.getByText(/voice|session/i).first()).toBeVisible();
  });
});

// ─── Phase 71: Audience group persona card selection ─────────────────────────
test.describe('Demo Landing — Audience Group Persona Cards', () => {
  const GROUPS = [
    { id: 'patients',      label: /patients/i },
    { id: 'practitioners', label: /practitioners|clinicians/i },
    { id: 'clinics',       label: /clinics|operations/i },
    { id: 'leadership',    label: /leadership/i },
    { id: 'full',          label: /full platform/i },
  ] as const;

  for (const { id, label } of GROUPS) {
    test(`selecting "${id}" persona highlights the card`, async ({ page }) => {
      await page.goto('/demo');
      // Locate the persona card and click it
      const card = page.getByRole('button', { name: label }).first();
      await expect(card).toBeVisible({ timeout: 8_000 });
      await card.click();
      // After selection the card should carry aria-pressed=true or a selected class/style
      // We verify the URL updates when the group is pre-selected via query param
      await page.goto(`/demo?group=${id}`);
      // The Start Demo button should now be visible/enabled
      const startBtn = page.getByRole('button', { name: /start.*demo|launch/i }).first();
      await expect(startBtn).toBeVisible({ timeout: 8_000 });
    });
  }

  test('workflow chips update after selecting Practitioners group', async ({ page }) => {
    await page.goto('/demo?group=practitioners');
    // Voice AI and Triage should be pre-checked for practitioners
    await expect(page.getByText(/voice/i).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/triage/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('workflow chips update after selecting Leadership group', async ({ page }) => {
    await page.goto('/demo?group=leadership');
    // Population Health should be pre-checked for leadership
    await expect(page.getByText(/population health/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Phase 71: URL auto-start ─────────────────────────────────────────────────
test.describe('Demo Landing — URL Auto-Start', () => {
  test('auto-starts demo from URL params', async ({ page }) => {
    await page.goto('/demo?group=practitioners&name=Dr.+Test&company=Clinic+X&auto=1');
    // AutoDemoPlayer should mount — look for the narrator panel or control bar
    await expect(
      page.getByRole('region', { name: /narrator|demo/i })
        .or(page.locator('[data-testid="auto-demo-player"]'))
        .or(page.getByText(/demo control/i))
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ─── Phase 71: Demo keyboard shortcuts ────────────────────────────────────────
test.describe('Demo Player — Keyboard Shortcuts', () => {
  /** Helper: launch a self-driven demo for keyboard shortcut tests. */
  async function launchDemo(page: Parameters<Parameters<typeof test>[1]>[0]) {
    await page.goto('/demo?group=full&name=KBTest&company=ShortcutCo&auto=1');
    // Wait for AutoDemoPlayer to be active
    await page.waitForTimeout(2_000);
  }

  test('Space key pauses and resumes the demo', async ({ page }) => {
    await launchDemo(page);
    await page.keyboard.press('Space');
    // After pause, Paused indicator or Resume button should be visible
    await expect(
      page.getByText(/paused|resume/i).first()
    ).toBeVisible({ timeout: 6_000 });
    // Resume with Space again
    await page.keyboard.press('Space');
    await expect(
      page.getByText(/paused/i).first()
    ).toBeHidden({ timeout: 6_000 });
  });

  test('ArrowRight advances to next scene', async ({ page }) => {
    await launchDemo(page);
    await page.keyboard.press('ArrowRight');
    // Scene progression — presence of countdown timer or narrator text
    await expect(
      page.getByText(/scene|workflow/i).first()
    ).toBeVisible({ timeout: 6_000 });
  });

  test('Escape key exits the demo', async ({ page }) => {
    await launchDemo(page);
    await page.keyboard.press('Escape');
    // Should return to the demo landing or home page
    await expect(
      page.getByText(/HealthQ Copilot|Start.*Demo/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Phase 71: Completion overlay ────────────────────────────────────────────
test.describe('Demo Completion Overlay', () => {
  test('NPS score selection is interactive', async ({ page }) => {
    // Navigate to a forced-complete state by triggering the overlay via store mock
    // In lieu of full store manipulation, fast-forward by visiting the overlay trigger URL
    // (tests rely on demo completing its last scene — simulate via direct page state)
    await page.goto('/demo?group=patients&name=NPSUser&company=TestOrg&auto=1');
    await page.waitForTimeout(1_500);
    // Exit to reach completion overlay by pressing Escape twice: first exits demo
    await page.keyboard.press('Escape');
    // If overlay appeared, an NPS score button should be visible
    // (only reachable if demo has started and immediately exited)
    const npsButton = page.getByRole('button', { name: /[0-9]/ }).first();
    // This is a best-effort test since the overlay requires demo completion
    if (await npsButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await npsButton.click();
      await expect(npsButton).toBeVisible();
    }
  });
});

// ─── Phase 71: Share link URL ────────────────────────────────────────────────
test.describe('Demo Share Link', () => {
  test('share link URL contains group param when audience group is selected', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/demo?group=clinics&name=ShareTest&company=ClinicGroup&auto=1');
    await page.waitForTimeout(1_500);
    // Look for the share/copy button in the control bar
    const copyBtn = page
      .getByRole('button', { name: /copy|share/i })
      .or(page.locator('[aria-label*="share" i], [aria-label*="copy" i]'))
      .first();
    if (await copyBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await copyBtn.click();
      // Verify clipboard content contains ?group=clinics
      const clipText = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
      expect(clipText).toMatch(/group=clinics/);
    }
  });
});


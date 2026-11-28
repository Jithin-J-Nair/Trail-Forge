import { expect, test } from '@playwright/test';

/**
 * Optional smoke: landing → /app empty → labeled demo.
 * FPP/walk skipped — headless WebGL is flaky per Phase 8 plan.
 */
test.describe('TrailForge smoke', () => {
  test('landing shows brand and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('TrailForge').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Generate a tour/i })).toBeVisible();
    await expect(page.getByText('© OpenStreetMap contributors')).toBeVisible();
  });

  test('app without demo shows honest empty canvas', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByTestId('empty-canvas')).toBeVisible();
    await expect(page.getByText('DEMO DATA')).toHaveCount(0);
  });

  test('app?demo=1 shows DEMO DATA badge', async ({ page }) => {
    await page.goto('/app?demo=1');
    await expect(page.getByText('DEMO DATA')).toBeVisible({ timeout: 15_000 });
  });

  test.skip('walk route (FPP) — skipped: headless WebGL unreliable', async () => {
    // Intentionally skipped — re-enable when CI has stable WebGL.
  });
});

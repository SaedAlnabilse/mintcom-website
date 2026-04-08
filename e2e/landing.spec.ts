import { test, expect } from '@playwright/test';

test.describe('Landing Page Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject cookie consent to avoid the banner intercepting clicks
    await page.addInitScript(() => {
      window.localStorage.setItem('paymint-cookie-consent', JSON.stringify({
        essential: true,
        analytics: true,
        marketing: true,
        functional: true
      }));
    });
  });

  test('should load the landing page and show key sections', async ({ page }) => {
    await page.goto('/');
    
    // Check for Logo
    await expect(page.locator('nav img[alt="PayMint"]').first()).toBeVisible();

    // Check for Hero Section (Get Started button)
    // Use getByRole for more robust matching
    await expect(page.getByRole('link', { name: /Get Started/i }).first()).toBeVisible();

    // Check for Footer
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should navigate to legal pages', async ({ page, context }) => {
    await page.goto('/');
    
    // Privacy Policy in footer has target="_blank"
    // We wait for the new page to be created
    const [privacyPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('link', { name: /Privacy Policy/i }).last().click()
    ]);
    
    await expect(privacyPage).toHaveURL(/\/legal\/privacy/);
    await expect(privacyPage.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

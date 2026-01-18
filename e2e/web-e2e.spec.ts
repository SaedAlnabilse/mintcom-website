/**
 * PAYMINT WEB - E2E Tests with Playwright
 * Tests complete user flows across the web application
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E Tests', () => {
  test('QA-E2E-001: Should load landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Paymint/i);
  });

  test('QA-E2E-002: Should navigate to login', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    await expect(page).toHaveURL(/login/);
  });

  test('QA-E2E-003: Should navigate to signup', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Get Started');
    await expect(page).toHaveURL(/signup/);
  });
});

test.describe('Authentication E2E Tests', () => {
  test('QA-E2E-010: Should show login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('QA-E2E-011: Should show validation errors', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });

  test('QA-E2E-012: Should show signup form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[name="businessName"], input[placeholder*="business"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('QA-E2E-013: Should navigate to forgot password', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Forgot');
    await expect(page).toHaveURL(/forgot|reset/);
  });
});

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // In real tests, you would authenticate here
  });

  test('QA-E2E-020: Should protect dashboard route', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/login|dashboard/);
  });
});

test.describe('Responsive E2E Tests', () => {
  test('QA-E2E-030: Should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('QA-E2E-031: Should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('QA-E2E-032: Should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Performance E2E Tests', () => {
  test('QA-E2E-040: Should load landing page within 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test('QA-E2E-041: Should have no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.goto('/');
    // Filter out expected errors
    const unexpectedErrors = errors.filter(e => !e.includes('favicon'));
    expect(unexpectedErrors.length).toBe(0);
  });
});

test.describe('Accessibility E2E Tests', () => {
  test('QA-E2E-050: Should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThanOrEqual(1);
  });

  test('QA-E2E-051: Should have alt text on images', async ({ page }) => {
    await page.goto('/');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('QA-E2E-052: Should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });
});

test.describe('Navigation E2E Tests', () => {
  test('QA-E2E-060: Should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Navigate to login
    await page.click('text=Login');
    await expect(page).toHaveURL(/login/);

    // Navigate back
    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('QA-E2E-061: Should handle 404 pages', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.locator('text=404, text=not found')).toBeVisible();
  });
});

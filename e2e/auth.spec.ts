import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Inject cookie consent to avoid the banner intercepting clicks
    await page.addInitScript(() => {
      window.localStorage.setItem('mintcom-cookie-consent', JSON.stringify({
        essential: true,
        analytics: true,
        marketing: true,
        functional: true
      }));
    });
  });

  test('should navigate to signup page and show validation errors', async ({ page }) => {
    await page.goto('/signup');
    
    // Check if the page title is correct (using more robust selector)
    await expect(page.getByRole('heading', { name: /Create Your Account/i })).toBeVisible();

    // To trigger zod validation errors, we might need to touch the fields or submit
    await page.click('button[type="submit"]');

    // Check for validation errors based on en.json
    // We use getByText or specific locators for more robust matching
    await expect(page.getByText('First name must be at least 2 characters')).toBeVisible();
    await expect(page.getByText('Last name must be at least 2 characters')).toBeVisible();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    // Use the specific ID to avoid conflict with the criteria list text
    await expect(page.locator('#password-error')).toContainText('Password must be at least 8 characters');
    await expect(page.getByText('You must agree to the Privacy Policy and Terms of Service')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/signup');
    const passwordInput = page.locator('input#password');
    // The button has aria-label="Show password" or "Hide password"
    const toggleButton = page.locator('button[aria-label*="password"]');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    // There are two password inputs (password and confirmPassword), so we might have multiple buttons
    await toggleButton.first().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.first().click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

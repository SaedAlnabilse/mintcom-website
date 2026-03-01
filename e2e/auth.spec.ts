import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('should navigate to signup page and show validation errors', async ({ page }) => {
    await page.goto('/signup');
    
    // Check if the page title is correct (using more robust selector)
    await expect(page.locator('h2')).toContainText(/Create Your Account/i);

    // To trigger zod validation errors, we might need to touch the fields or submit
    // Based on the code, handleSubmit is used, so clicking submit should work.
    // However, empty fields might not show "required" if not explicitly set in zod (it uses .min(2))
    await page.click('button[type="submit"]');

    // Check for validation errors based on en.json
    await expect(page.locator('text=First name must be at least 2 characters')).toBeVisible();
    await expect(page.locator('text=Last name must be at least 2 characters')).toBeVisible();
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    await expect(page.locator('text=You must agree to the Privacy Policy and Terms of Service')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/signup');
    const passwordInput = page.locator('input#password');
    // The button has aria-label="Show password" or "Hide password"
    const toggleButton = page.locator('button[aria-label*="password"]');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.first().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.first().click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

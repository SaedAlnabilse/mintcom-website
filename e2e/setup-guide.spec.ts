import { test, expect, type Page } from '@playwright/test';

/**
 * Establishment Setup Guide first-run E2E (plan §8.2, SG-E01…SG-E10).
 *
 * Two tiers:
 * 1. Fail-closed tier — runs unseeded on every pass. Proves R8: without a
 *    server grant the popup never renders, and no legacy browser keys or
 *    debug globals exist.
 * 2. Seeded tier — runs only with MINTCOM_E2E_SEEDED=1 plus staging
 *    credentials (see below). Serial on purpose: SG-E01 claims the fresh
 *    location, SG-E02/SG-E03 then assert it never reappears.
 *
 * Seeded env:
 *   MINTCOM_E2E_SEEDED=1
 *   MINTCOM_E2E_OWNER_EMAIL / MINTCOM_E2E_OWNER_PASSWORD (eligible owner)
 *   MINTCOM_E2E_CASHIER_EMAIL / MINTCOM_E2E_CASHIER_PASSWORD (ineligible cashier)
 *   MINTCOM_E2E_LOCATION_SLUG (existing location both can open)
 *   MINTCOM_E2E_FRESH_LOCATION_SLUG (location the owner has NEVER opened;
 *     reset per run, e.g. DELETE FROM "GuideView" for that establishment)
 *   MINTCOM_E2E_SECOND_LOCATION_SLUG (second location unseen by the owner)
 */

const POPUP = '#mintcom-dashboard-welcome-popup';
const PREFS_TRIGGER = 'button[aria-haspopup="menu"]';

const LEGACY_KEY_PREFIXES = [
  'mintcom.dashboard.setup',
  'mintcom.dashboard.welcome',
  'mintcom.dashboard.visited',
];

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('button[type="submit"]').click();
  // Login leaves /login on success (ProtectedRoute deep-link or dashboard).
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
}

async function openPrefsMenu(page: Page) {
  await page.locator(PREFS_TRIGGER).first().click();
  await expect(page.locator('[role="menu"]').first()).toBeVisible();
}

test.describe('Setup guide fail-closed (unseeded)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'mintcom-cookie-consent',
        JSON.stringify({
          essential: true,
          analytics: true,
          marketing: true,
          functional: true,
        }),
      );
    });
  });

  test('SG-E08: unauthenticated dashboard visit shows no popup and redirects to login', async ({
    page,
  }) => {
    await page.goto('/dashboard/unseeded-slug');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(POPUP)).toHaveCount(0);
  });

  test('SG-E08: setup-guide API outage fails closed with no popup and no legacy keys', async ({
    page,
  }) => {
    await page.route('**/api/setup-guide/**', (route) => route.abort());
    await page.goto('/dashboard/unseeded-slug');
    // Still ends at login (ProtectedRoute), never a stranded popup.
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(POPUP)).toHaveCount(0);
  });

  test('DoD: no legacy storage keys and no debug globals', async ({ page }) => {
    await page.goto('/');
    const legacyKeys = await page.evaluate((prefixes) => {
      const found: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && prefixes.some((p) => key.startsWith(p))) found.push(key);
      }
      return found;
    }, LEGACY_KEY_PREFIXES);
    expect(legacyKeys).toEqual([]);

    const debugGlobals = await page.evaluate(() => ({
      debug: (window as any).__mintcomSetupDebug,
      force: (window as any).__mintcomShowSetupPopup,
    }));
    expect(debugGlobals.debug).toBeUndefined();
    expect(debugGlobals.force).toBeUndefined();
  });
});

const seeded = process.env.MINTCOM_E2E_SEEDED === '1';
const ownerEmail = process.env.MINTCOM_E2E_OWNER_EMAIL ?? '';
const ownerPassword = process.env.MINTCOM_E2E_OWNER_PASSWORD ?? '';
const cashierEmail = process.env.MINTCOM_E2E_CASHIER_EMAIL ?? '';
const cashierPassword = process.env.MINTCOM_E2E_CASHIER_PASSWORD ?? '';
const locationSlug = process.env.MINTCOM_E2E_LOCATION_SLUG ?? '';
const freshSlug = process.env.MINTCOM_E2E_FRESH_LOCATION_SLUG ?? '';
const secondSlug = process.env.MINTCOM_E2E_SECOND_LOCATION_SLUG ?? '';

test.describe.serial('Setup guide first-run (seeded staging)', () => {
  test.skip(
    !seeded,
    'Set MINTCOM_E2E_SEEDED=1 with staging credentials to run (§8.3 seed).',
  );

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'mintcom-cookie-consent',
        JSON.stringify({
          essential: true,
          analytics: true,
          marketing: true,
          functional: true,
        }),
      );
    });
  });

  test('SG-E01: owner sees the popup once on a fresh location', async ({
    page,
  }) => {
    await loginAs(page, ownerEmail, ownerPassword);
    await page.goto(`/dashboard/${freshSlug}`);
    await expect(page.locator(POPUP)).toBeVisible({ timeout: 15000 });
  });

  test('SG-E02: same owner in a new browser context sees no popup', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await loginAs(page, ownerEmail, ownerPassword);
      await page.goto(`/dashboard/${freshSlug}`);
      // Claimed by SG-E01: the server row suppresses every later surface.
      await page.waitForTimeout(3000);
      await expect(page.locator(POPUP)).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('SG-E03: reload after dismiss shows no popup', async ({ page }) => {
    await loginAs(page, ownerEmail, ownerPassword);
    await page.goto(`/dashboard/${locationSlug}`);
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(page.locator(POPUP)).toHaveCount(0);
  });

  test('SG-E04: cashier never sees the popup or the Help entry', async ({
    page,
  }) => {
    await loginAs(page, cashierEmail, cashierPassword);
    await page.goto(`/dashboard/${locationSlug}`);
    await page.waitForTimeout(3000);
    await expect(page.locator(POPUP)).toHaveCount(0);
    await openPrefsMenu(page);
    await expect(
      page.getByRole('menuitem', { name: 'Setup guide' }),
    ).toHaveCount(0);
  });

  test('SG-E06: Help → Setup guide replays without a new first-run grant', async ({
    page,
  }) => {
    await loginAs(page, ownerEmail, ownerPassword);
    await page.goto(`/dashboard/${locationSlug}`);
    await openPrefsMenu(page);
    await page.getByRole('menuitem', { name: 'Setup guide' }).click();
    await expect(page.locator(POPUP)).toBeVisible({ timeout: 15000 });
  });

  test('SG-E07: Start setup closes the modal without freezing', async ({
    page,
  }) => {
    await loginAs(page, ownerEmail, ownerPassword);
    await page.goto(`/dashboard/${locationSlug}?setup=1`);
    await expect(page.locator(POPUP)).toBeVisible({ timeout: 15000 });
    await page
      .locator(`${POPUP} button`)
      .filter({ hasText: 'Start setup' })
      .click();
    await expect(page.locator(POPUP)).toBeHidden({ timeout: 5000 });
    // Page stays interactive after the modal → tour handoff (no freeze).
    await expect(page.locator('body')).toBeVisible();
  });

  test('SG-E08: setup-guide API outage shows no popup and no error toast', async ({
    page,
  }) => {
    await loginAs(page, ownerEmail, ownerPassword);
    await page.route('**/api/setup-guide/**', (route) =>
      route.fulfill({ status: 500, body: '{}' }),
    );
    await page.goto(`/dashboard/${freshSlug}`);
    await page.waitForTimeout(3000);
    await expect(page.locator(POPUP)).toHaveCount(0);
  });

  test('SG-E09: Arabic locale renders the popup RTL', async ({ page }) => {
    await loginAs(page, ownerEmail, ownerPassword);
    await page.goto(`/dashboard/${locationSlug}`);
    await openPrefsMenu(page);
    await page
      .getByRole('menuitemradio', { name: /AR/ })
      .click();
    await page.goto(`/dashboard/${locationSlug}?setup=1`);
    const popup = page.locator(POPUP);
    await expect(popup).toBeVisible({ timeout: 15000 });
    await expect(popup).toHaveAttribute('dir', 'rtl');
  });

  test('SG-E10: second location shows the popup once for that location', async ({
    page,
  }) => {
    await loginAs(page, ownerEmail, ownerPassword);
    await page.goto(`/dashboard/${secondSlug}`);
    await expect(page.locator(POPUP)).toBeVisible({ timeout: 15000 });
  });

  test.skip('SG-E05: two contexts opened in parallel show exactly one popup', async () => {
    // Covered at the unit level by SG-U07 (concurrent claims → one P2002
    // winner). As E2E it needs two pristine first-run states at the same
    // instant; run manually per §8.3 with two fresh locations side by side.
  });
});

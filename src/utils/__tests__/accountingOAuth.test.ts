import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAccountingRedirectUri } from '../accountingOAuth';

describe('getAccountingRedirectUri', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    delete (window as any).location;
    window.location = {
      origin: 'http://localhost:5173',
      pathname: '/dashboard/test-store/settings',
      search: '?tab=accounting&foo=bar',
      hash: '#section',
    } as any;
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  it('returns clean origin + /accounting/callback without query params or location slugs', () => {
    const uri = getAccountingRedirectUri();
    expect(uri).toBe('http://localhost:5173/accounting/callback');
    expect(uri).not.toContain('?tab=accounting');
    expect(uri).not.toContain('test-store');
  });

  it('rewrites 127.0.0.1 to localhost for Xero compatibility', () => {
    window.location = {
      origin: 'http://127.0.0.1:5173',
      pathname: '/dashboard/test-store/settings',
    } as any;

    const uri = getAccountingRedirectUri();
    expect(uri).toBe('http://localhost:5173/accounting/callback');
  });

  it('prioritizes explicit customEnvUri if passed or defined', () => {
    const custom = 'https://app.mintcompos.com/accounting/callback';
    const uri = getAccountingRedirectUri(custom);
    expect(uri).toBe('https://app.mintcompos.com/accounting/callback');
  });
});

describe('OAuth callback payload shape', () => {
  /**
   * The API runs its ValidationPipe with forbidNonWhitelisted, so any field
   * the DTO does not declare is a 400 reading "property <name> should not
   * exist" — which is what reached an owner as "Connection Failed" after the
   * server took ownership of the redirect URI.
   *
   * There are TWO call sites (the settings tab and the dedicated callback
   * page) and only one was updated the first time, so this reads the sources
   * directly rather than trusting that a future edit touches both.
   */
  const CALL_SITES = [
    'src/components/settings/AccountingSettingsTab.tsx',
    'src/pages/dashboard/AccountingCallbackPage.tsx',
  ];

  it.each(CALL_SITES)('%s does not send redirectUri to the API', async (file) => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');

    // Strip comments so the explanatory notes about the bug do not match.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    expect(code).not.toMatch(/redirectUri\s*[,:]/);
  });

  it.each(CALL_SITES)('%s posts the OAuth callback with state', async (file) => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');

    // state is required now: the server refuses a callback without it.
    expect(source).toMatch(/\/callback`,\s*\{[\s\S]{0,200}?\bstate\b/);
  });
});

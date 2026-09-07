import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAccountingRedirectUri } from '../accountingOAuth';

describe('getAccountingRedirectUri', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location
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

  it('returns clean origin + pathname without query params or hash', () => {
    const uri = getAccountingRedirectUri();
    expect(uri).toBe('http://localhost:5173/dashboard/test-store/settings');
    expect(uri).not.toContain('?tab=accounting');
    expect(uri).not.toContain('#section');
  });

  it('rewrites 127.0.0.1 to localhost for Xero compatibility', () => {
    window.location = {
      origin: 'http://127.0.0.1:5173',
      pathname: '/dashboard/test-store/settings',
    } as any;

    const uri = getAccountingRedirectUri();
    expect(uri).toBe('http://localhost:5173/dashboard/test-store/settings');
  });

  it('prioritizes explicit customEnvUri if passed or defined', () => {
    const custom = 'https://app.mintcompos.com/oauth/accounting/callback';
    const uri = getAccountingRedirectUri(custom);
    expect(uri).toBe('https://app.mintcompos.com/oauth/accounting/callback');
  });
});

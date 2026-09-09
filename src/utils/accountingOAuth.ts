/**
 * Resolves the exact redirect URI to use for Xero and QuickBooks OAuth flows.
 * 
 * Uses a dedicated, location-agnostic callback route:
 * - Local development: http://localhost:5173/accounting/callback
 * - Production:        https://app.mintcompos.com/accounting/callback
 * 
 * Rules:
 * 1. Honors explicit VITE_XERO_REDIRECT_URI if set in the environment.
 * 2. Rewrites 127.0.0.1 to localhost (Xero strictly rejects 127.0.0.1 and requires localhost for local dev).
 * 3. Returns the clean /accounting/callback pathname (no query params, no dynamic location slugs).
 */
export const getAccountingRedirectUri = (customEnvUri?: string): string => {
  const stripTrailingSlash = (uri: string): string =>
    uri.length > 0 ? uri.replace(/\/+$/, '') : uri;

  const envUri = (customEnvUri ?? (import.meta.env?.VITE_XERO_REDIRECT_URI as string | undefined))?.trim();
  if (envUri) {
    // Providers compare character-for-character: `.../callback` vs
    // `.../callback/` is a mismatch that surfaces only as
    // "Invalid redirect_uri" at Xero. Normalize to match the server
    // (AccountingRedirectService.assertUsable).
    return stripTrailingSlash(envUri);
  }

  if (typeof window === 'undefined') {
    return '';
  }

  let origin = window.location.origin;
  if (origin.includes('//127.0.0.1')) {
    origin = origin.replace('//127.0.0.1', '//localhost');
  }

  return `${origin}/accounting/callback`;
};

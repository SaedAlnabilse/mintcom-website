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
  const envUri = (customEnvUri ?? (import.meta.env?.VITE_XERO_REDIRECT_URI as string | undefined))?.trim();
  if (envUri) {
    return envUri;
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

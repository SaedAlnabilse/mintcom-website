/**
 * Resolves the exact redirect URI to use for Xero and QuickBooks OAuth flows.
 * 
 * Follows Xero OAuth 2.0 specifications:
 * - Standard Auth Code Flow: https://developer.xero.com/documentation/guides/oauth2/auth-flow/
 * - Troubleshooting Guide: https://developer.xero.com/documentation/guides/oauth2/troubleshooting
 * 
 * Rules:
 * 1. Honors explicit VITE_XERO_REDIRECT_URI if set in the environment.
 * 2. Rewrites 127.0.0.1 to localhost (Xero rejects 127.0.0.1 and requires localhost for local development).
 * 3. Strips query parameters and hash so the redirect URI matches character-for-character with developer portal registration.
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

  return `${origin}${window.location.pathname}`;
};

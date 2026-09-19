import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// Apple "logo" mark. Uses currentColor so it adapts to light/dark themes.
const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden>
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

export interface AppleAuthCredential {
  identityToken: string;
  nonce: string;
  firstName?: string;
  lastName?: string;
}

interface AppleAuthButtonProps {
  onSuccess: (credential: AppleAuthCredential) => void;
  onError?: (error: string) => void;
  /** Optional gate run before launching the Apple popup. Return false to abort. */
  onBeforeSignIn?: () => boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  disabled?: boolean;
  /**
   * Server-issued raw nonce. Step-up passes the nonce from its challenge so the
   * backend can prove the identity token was minted for *this* verification
   * rather than replayed from an earlier sign-in.
   */
  nonce?: string;
}

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: (config?: { nonce?: string; state?: string }) => Promise<{
          authorization?: { id_token?: string; code?: string; state?: string };
          user?: { name?: { firstName?: string; lastName?: string }; email?: string };
        }>;
      };
    };
  }
}

const APPLE_JS_SRC =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

// The env vars win when provided; these are just the fallback defaults.
const DEFAULT_APPLE_SERVICE_ID = 'com.mintcom.website.service';
const DEFAULT_APPLE_REDIRECT_URI =
  'https://api.mintcompos.com/api/accounts/apple-callback';

export const APPLE_SERVICE_ID = (
  import.meta.env.VITE_APPLE_SERVICE_ID || DEFAULT_APPLE_SERVICE_ID
).trim();

export const APPLE_REDIRECT_URI = (
  import.meta.env.VITE_APPLE_REDIRECT_URI || DEFAULT_APPLE_REDIRECT_URI
).trim();

// Apple Sign in with Apple is only enabled when a Service ID is configured.
export const APPLE_AUTH_ENABLED = Boolean(APPLE_SERVICE_ID);

let appleInitialized = false;

/**
 * SHA-256 hex digest, used to hash the nonce before handing it to Apple.
 *
 * The backend (`/api/accounts/apple-auth`) re-hashes the *raw* nonce it receives
 * with SHA-256 and compares it to the `nonce` claim inside the identity token.
 * Apple's web flow embeds the nonce we pass to `signIn()` verbatim, so we must
 * pass the hashed value to Apple and send the raw value to the backend. This is
 * exactly what the mobile (`@invertase`) libraries do internally.
 */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomString(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function AppleAuthButton({
  onSuccess,
  onError,
  onBeforeSignIn,
  text = 'continue_with',
  disabled = false,
  nonce: externalNonce,
}: AppleAuthButtonProps) {
  const { t } = useTranslation();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load Apple's Sign in with Apple JS SDK.
  useEffect(() => {
    if (!APPLE_AUTH_ENABLED) return;

    if (window.AppleID) {
      setIsScriptLoaded(true);
      return;
    }

    const existing = document.querySelector(`script[src="${APPLE_JS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => setIsScriptLoaded(true));
      if (window.AppleID) setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = APPLE_JS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.error('[AppleAuth] Failed to load Sign in with Apple JS');
      onError?.(t('auth.errors.appleLoadFailed'));
    };
    document.head.appendChild(script);
  }, [onError, t]);

  // Initialize Apple once the script is ready.
  useEffect(() => {
    if (!isScriptLoaded || !window.AppleID || appleInitialized) return;

    try {
      window.AppleID.auth.init({
        clientId: APPLE_SERVICE_ID,
        scope: 'name email',
        redirectURI: APPLE_REDIRECT_URI,
        usePopup: true,
      });
      appleInitialized = true;
    } catch (error) {
      console.error('[AppleAuth] Failed to initialize:', error);
      onError?.(t('auth.errors.appleConfigMissing'));
    }
  }, [isScriptLoaded, onError, t]);

  const handleClick = useCallback(async () => {
    if (disabled || isLoading) return;

    // Let the parent run any pre-checks (e.g. "accept terms" gate on signup).
    if (onBeforeSignIn && !onBeforeSignIn()) return;

    if (!window.AppleID || !appleInitialized) {
      onError?.(t('auth.errors.appleUnavailable'));
      return;
    }

    setIsLoading(true);
    try {
      const rawNonce = externalNonce || randomString();
      const hashedNonce = await sha256Hex(rawNonce);

      const data = await window.AppleID.auth.signIn({
        nonce: hashedNonce,
        state: randomString(),
      });

      const identityToken = data?.authorization?.id_token;
      if (!identityToken) {
        onError?.(t('auth.errors.appleNoToken'));
        return;
      }

      // Apple only returns the user's name on the *first* authorization.
      onSuccess({
        identityToken,
        nonce: rawNonce,
        firstName: data?.user?.name?.firstName,
        lastName: data?.user?.name?.lastName,
      });
    } catch (error: unknown) {
      const code = String((error as { error?: unknown })?.error ?? '').toLowerCase();

      // User dismissed the popup / aborted — stay silent like the mobile app.
      if (
        code === 'popup_closed_by_user' ||
        code === 'user_cancelled_authorize' ||
        code === 'user_trigger_new_signin_flow'
      ) {
        return;
      }

      if (code === 'invalid_client' || code === 'invalid_request') {
        console.error('[AppleAuth] Configuration error:', error);
        onError?.(t('auth.errors.appleConfigMissing'));
        return;
      }

      console.error('[AppleAuth] Sign-in failed:', error);
      onError?.(t('auth.errors.appleUnavailable'));
    } finally {
      setIsLoading(false);
    }
  }, [
    disabled,
    isLoading,
    onBeforeSignIn,
    onSuccess,
    onError,
    t,
    externalNonce,
  ]);

  if (!APPLE_AUTH_ENABLED) return null;

  const buttonText = {
    signin_with: t('auth.apple.signInWith'),
    signup_with: t('auth.apple.signUpWith'),
    continue_with: t('auth.apple.continueWith'),
  }[text];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading || !isScriptLoaded}
      aria-label={buttonText}
      className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-900 shadow-sm transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      <AppleIcon />
      <span>{isLoading ? t('common.connecting') : buttonText}</span>
    </button>
  );
}

export default AppleAuthButton;

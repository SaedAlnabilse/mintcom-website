import { useEffect, useCallback, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Official multicolor Google "G" mark (brand colors).
const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      fill="#EA4335"
    />
  </svg>
);

interface GoogleAuthButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  disabled?: boolean;
  /**
   * Server-issued nonce to embed in the id_token.
   *
   * Login generates its own (checked client-side only). Step-up must pass the
   * nonce from its challenge so the backend can prove the token was minted for
   * *this* verification and is not one captured from an earlier sign-in.
   */
  nonce?: string;
  /**
   * Force Google to re-authenticate rather than silently reusing a live
   * session. Step-up defends against someone holding an already-signed-in
   * browser, so simply picking an account would prove nothing.
   */
  forceReauth?: boolean;
}

// Public OAuth client ID. The env var still wins, but keeping the known public
// client ID here prevents the Google UI from disappearing on builds where the
// deploy environment forgot to define VITE_GOOGLE_CLIENT_ID.
const DEFAULT_GOOGLE_CLIENT_ID =
  '661509890911-nhmhvntnrllqh36vd4s0jdvnkkaqdgt3.apps.googleusercontent.com';

export const GOOGLE_CLIENT_ID = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID
).trim();

/**
 * OpenID Connect implicit flow in a popup.
 *
 * We open accounts.google.com/o/oauth2/v2/auth as a REAL top-level popup from
 * a REAL <button> we fully own (same styling as AppleAuthButton). Google
 * redirects the popup back to /google-callback.html on our origin, which posts
 * the `id_token` to this window and closes itself.
 *
 * The id_token is a Google ID token with `aud` = this client ID — the exact
 * shape the backend's `verifyIdToken` already accepts from the old GIS
 * credential flow, so POST /api/accounts/google-auth is unchanged.
 *
 * The popup callback URL must be listed under "Authorized redirect URIs" for
 * this OAuth client in Google Cloud Console (per environment):
 *   https://mintcompos.com/google-callback.html
 *   https://www.mintcompos.com/google-callback.html
 *   http://localhost:5173/google-callback.html
 */
const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const CALLBACK_PATH = '/google-callback.html';
// Must match public/google-callback.js
const MESSAGE_TYPE = 'mintcom:google-auth';
const RESULT_STORAGE_KEY = 'mintcom:google-auth-result';

interface GoogleAuthResult {
  type: string;
  idToken: string;
  state: string;
  error: string;
}

export interface GoogleAuthButtonHandle {
  triggerPrompt: () => void;
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

/** Decode a JWT payload without verifying — verification happens on the backend. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export const GoogleAuthButton = forwardRef<GoogleAuthButtonHandle, GoogleAuthButtonProps>(
  (
    {
      onSuccess,
      onError,
      text = 'continue_with',
      disabled = false,
      nonce: externalNonce,
      forceReauth = false,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    // Keep latest handlers in refs so the message listener never goes stale.
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    useEffect(() => {
      onSuccessRef.current = onSuccess;
      onErrorRef.current = onError;
    }, [onError, onSuccess]);

    // The state/nonce of the in-flight popup, if any.
    const pendingRef = useRef<{ state: string; nonce: string } | null>(null);
    const popupRef = useRef<Window | null>(null);
    const pollTimerRef = useRef<number | undefined>(undefined);

    const finishFlow = useCallback(() => {
      pendingRef.current = null;
      popupRef.current = null;
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = undefined;
      }
      setIsLoading(false);
    }, []);

    const handleResult = useCallback(
      (result: GoogleAuthResult) => {
        const pending = pendingRef.current;
        // Ignore results that don't match the popup WE opened (stale/foreign).
        if (!pending || result.state !== pending.state) return;

        if (result.error) {
          finishFlow();
          // User closed Google's consent screen / clicked cancel — stay silent.
          if (result.error !== 'access_denied' && result.error !== 'interaction_required') {
            console.error('[GoogleAuth] OAuth error:', result.error);
            onErrorRef.current?.(t('auth.errors.googleUnavailable'));
          }
          return;
        }

        if (!result.idToken) {
          finishFlow();
          onErrorRef.current?.(t('auth.errors.googleUnavailable'));
          return;
        }

        // Replay protection: the token must carry the nonce from THIS attempt.
        const payload = decodeJwtPayload(result.idToken);
        if (!payload || payload.nonce !== pending.nonce) {
          finishFlow();
          console.error('[GoogleAuth] id_token nonce mismatch — dropping token');
          onErrorRef.current?.(t('auth.errors.googleUnavailable'));
          return;
        }

        finishFlow();
        onSuccessRef.current(result.idToken);
      },
      [finishFlow, t]
    );

    // Listen for the popup's result: postMessage normally, localStorage as a
    // fallback when COOP severs window.opener.
    useEffect(() => {
      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        const data = event.data as GoogleAuthResult | undefined;
        if (data?.type !== MESSAGE_TYPE) return;
        handleResult(data);
      };

      const onStorage = (event: StorageEvent) => {
        if (event.key !== RESULT_STORAGE_KEY || !event.newValue) return;
        try {
          const data = JSON.parse(event.newValue) as GoogleAuthResult;
          if (data?.type === MESSAGE_TYPE) {
            handleResult(data);
            window.localStorage.removeItem(RESULT_STORAGE_KEY);
          }
        } catch {
          // Ignore malformed storage payloads.
        }
      };

      window.addEventListener('message', onMessage);
      window.addEventListener('storage', onStorage);
      return () => {
        window.removeEventListener('message', onMessage);
        window.removeEventListener('storage', onStorage);
      };
    }, [handleResult]);

    // Abort cleanly on unmount.
    useEffect(() => {
      return () => {
        if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      };
    }, []);

    const handleClick = useCallback(() => {
      if (!GOOGLE_CLIENT_ID || disabled || isLoading) return;

      const state = randomString();
      const nonce = externalNonce || randomString();

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: `${window.location.origin}${CALLBACK_PATH}`,
        response_type: 'id_token',
        scope: 'openid email profile',
        state,
        nonce,
        // `login` makes Google ask for credentials again instead of accepting
        // an existing session — the whole point of a step-up check.
        prompt: forceReauth ? 'login' : 'select_account',
      });

      const width = 480;
      const height = 640;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

      // window.open must run synchronously inside the click to avoid blockers.
      const popup = window.open(
        `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`,
        'mintcom-google-auth',
        `popup=yes,width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        console.error('[GoogleAuth] Popup blocked');
        onErrorRef.current?.(t('auth.errors.googleUnavailable'));
        return;
      }

      pendingRef.current = { state, nonce };
      popupRef.current = popup;
      setIsLoading(true);

      // If the user closes the popup without finishing, reset the button.
      // Grace period: the result message can land shortly after `closed` flips.
      pollTimerRef.current = window.setInterval(() => {
        if (popupRef.current && popupRef.current.closed) {
          window.clearInterval(pollTimerRef.current);
          pollTimerRef.current = undefined;
          window.setTimeout(() => {
            if (pendingRef.current) finishFlow();
          }, 700);
        }
      }, 400);
    }, [disabled, isLoading, finishFlow, t, externalNonce, forceReauth]);

    useImperativeHandle(ref, () => ({
      triggerPrompt: handleClick,
    }));

    if (!GOOGLE_CLIENT_ID) {
      return null;
    }

    const buttonText = {
      signin_with: t('auth.google.signInWith'),
      signup_with: t('auth.google.signUpWith'),
      continue_with: t('auth.google.continueWith'),
      signin: t('auth.google.signIn'),
    }[text];

    // Deliberately identical styling to AppleAuthButton.
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        aria-label={buttonText}
        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-900 shadow-sm transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
          <GoogleIcon size={18} />
        </span>
        <span>{isLoading ? t('common.connecting') : buttonText}</span>
      </button>
    );
  }
);

GoogleAuthButton.displayName = 'GoogleAuthButton';

// Divider component for "or" separator
export function AuthDivider() {
  const { t } = useTranslation();
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-stone-200 dark:to-white/10" />
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-zinc-400">
        {t('common.or')}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-stone-200 dark:to-white/10" />
    </div>
  );
}

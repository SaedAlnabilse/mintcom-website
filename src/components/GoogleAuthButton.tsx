import { useEffect, useCallback, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
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
  isOverlay?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; getNotDisplayedReason: () => string }) => void) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

// Public OAuth client ID. The env var still wins, but keeping the known public
// client ID here prevents the Google UI from disappearing on builds where the
// deploy environment forgot to define VITE_GOOGLE_CLIENT_ID.
const DEFAULT_GOOGLE_CLIENT_ID =
  '661509890911-nhmhvntnrllqh36vd4s0jdvnkkaqdgt3.apps.googleusercontent.com';

export const GOOGLE_CLIENT_ID = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID
).trim();

type GoogleCredentialCallback = (credential: string) => void;

let initializedGoogleClientId: string | null = null;
let activeGoogleCredentialCallback: GoogleCredentialCallback | null = null;

export interface GoogleAuthButtonHandle {
  triggerPrompt: () => void;
}

export const GoogleAuthButton = forwardRef<GoogleAuthButtonHandle, GoogleAuthButtonProps>(
  ({ onSuccess, onError, text = 'continue_with', disabled = false }, ref) => {
    const { t, i18n } = useTranslation();
    const { resolvedTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    // Load Google Identity Services script
    useEffect(() => {
      if (!GOOGLE_CLIENT_ID) {
        console.warn('[GoogleAuth] No Google client ID configured');
        return;
      }

      // Check if script is already loaded
      if (window.google?.accounts?.id) {
        setIsScriptLoaded(true);
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => setIsScriptLoaded(true));
        return;
      }

      // Load the Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setIsScriptLoaded(true);
      script.onerror = () => {
        console.error('[GoogleAuth] Failed to load Google Identity Services');
        onError?.(t('auth.errors.googleLoadFailed'));
      };
      document.head.appendChild(script);

      return () => {
        // Cleanup is optional since script is global
      };
    }, [onError, t]);

    // Initialize Google Sign-In when script is loaded
    useEffect(() => {
      if (!isScriptLoaded || !window.google || !GOOGLE_CLIENT_ID) return;

      const credentialCallback: GoogleCredentialCallback = (credential) => {
        setIsLoading(false);
        onSuccess(credential);
      };

      // Small delay to ensure the buttonRef div is rendered in the DOM
      const timeoutId = setTimeout(() => {
        try {
          activeGoogleCredentialCallback = credentialCallback;

          if (initializedGoogleClientId !== GOOGLE_CLIENT_ID) {
            window.google!.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: (response) => {
                if (response.credential) {
                  activeGoogleCredentialCallback?.(response.credential);
                }
              },
              auto_select: false,
              cancel_on_tap_outside: true,
            });
            initializedGoogleClientId = GOOGLE_CLIENT_ID;
          }

          // Use renderButton for correct incognito/strict cookie support
          if (buttonRef.current) {
            buttonRef.current.replaceChildren();
            window.google!.accounts.id.renderButton(
              buttonRef.current,
              {
                type: 'standard',
                theme: resolvedTheme === 'dark' ? 'filled_black' : 'outline',
                size: 'large',
                text: text,
                shape: 'rectangular',
                logo_alignment: 'center',
                width: buttonRef.current.parentElement?.offsetWidth || 400,
                locale: i18n.language,
              }
            );
          }
        } catch (error) {
          console.error('[GoogleAuth] Failed to initialize:', error);
          onError?.(t('auth.errors.googleInitFailed'));
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (activeGoogleCredentialCallback === credentialCallback) {
          activeGoogleCredentialCallback = null;
        }
        if (buttonRef.current) {
          buttonRef.current.replaceChildren();
        }
      };
    }, [isScriptLoaded, onSuccess, onError, t, text, i18n.language, resolvedTheme]);

    // We can no longer trigger the popup programmatically with standard GIS.
    // If triggerPrompt is called, we can only try prompt() which may fail in incognito,
    // so we advise the user to interact with the rendered button directly if blocked.
    const handleClick = useCallback(() => {
      if (!window.google || !GOOGLE_CLIENT_ID || disabled || isLoading) return;

      setIsLoading(true);

      try {
        window.google.accounts.id.prompt((notification) => {
          setIsLoading(false);
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason();
            console.warn('[GoogleAuth] Prompt not displayed:', reason);

            if (reason === 'opt_out_or_no_session') {
              onError?.(t('auth.errors.googleNoSession'));
              // Instruct user since programmatic popup is blocked
              toast.error(t('auth.errors.clickGoogleDirectly', 'Please click the "Sign in with Google" button directly to continue.'));
            } else if (reason === 'suppressed_by_user') {
              onError?.(t('auth.errors.googleCancelled'));
            } else {
              onError?.(t('auth.errors.googleUnavailable'));
            }
          }
        });
      } catch (error) {
        setIsLoading(false);
        console.error('[GoogleAuth] Error showing prompt:', error);
        onError?.(t('auth.errors.googlePromptFailed'));
      }
    }, [disabled, isLoading, onError, t]);

    // Expose the triggerPrompt method to the parent
    useImperativeHandle(ref, () => ({
      triggerPrompt: handleClick,
    }));

    // Don't render if no client ID configured
    if (!GOOGLE_CLIENT_ID) {
      return null;
    }

    const buttonText = {
      signin_with: t('auth.google.signInWith'),
      signup_with: t('auth.google.signUpWith'),
      continue_with: t('auth.google.continueWith'),
      signin: t('auth.google.signIn'),
    }[text];

    return (
      <div className={`relative w-full ${disabled || isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {!isScriptLoaded && (
          <div
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-100"
          >
            <GoogleIcon />
            <span>{t('common.connecting')}</span>
          </div>
        )}

        {isScriptLoaded && (
          <div
            ref={buttonRef}
            aria-label={buttonText}
            className="google-auth-button overflow-hidden rounded-xl [&>div]:!w-full [&_iframe]:!w-full"
          />
        )}
      </div>
    );
  }
);

// Divider component for "or" separator
export function AuthDivider() {
  const { t } = useTranslation();
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200 dark:to-white/10" />
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
        {t('common.or')}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200 dark:to-white/10" />
    </div>
  );
}


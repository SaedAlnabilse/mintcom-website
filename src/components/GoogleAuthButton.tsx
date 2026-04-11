import { useEffect, useCallback, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

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

// Get Google Client ID from environment
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export interface GoogleAuthButtonHandle {
  triggerPrompt: () => void;
}

export const GoogleAuthButton = forwardRef<GoogleAuthButtonHandle, GoogleAuthButtonProps>(
  ({ onSuccess, onError, text = 'continue_with', disabled = false, isOverlay = false }, ref) => {
    const { t, i18n } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    // Load Google Identity Services script
    useEffect(() => {
      if (!GOOGLE_CLIENT_ID) {
        console.warn('[GoogleAuth] No VITE_GOOGLE_CLIENT_ID found in environment');
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

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              setIsLoading(false);
              onSuccess(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Use renderButton for correct incognito/strict cookie support
        if (buttonRef.current) {
          window.google.accounts.id.renderButton(
            buttonRef.current,
            {
              type: 'standard',
              theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
              size: 'large',
              text: text, // 'signin_with', 'signup_with', 'continue_with', 'signin'
              shape: 'rectangular',
              logo_alignment: 'center',
              width: buttonRef.current.parentElement?.offsetWidth || undefined,
              locale: i18n.language,
            }
          );
        }
      } catch (error) {
        console.error('[GoogleAuth] Failed to initialize:', error);
        onError?.(t('auth.errors.googleInitFailed'));
      }
    }, [isScriptLoaded, onSuccess, onError, t, text, i18n.language]);

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

    if (isOverlay) {
      return (
        <div className={`absolute inset-0 z-20 overflow-hidden opacity-[0.01] ${disabled || isLoading ? 'pointer-events-none' : ''}`}>
          <div ref={buttonRef} className="w-full h-full flex items-center justify-center transform scale-y-[1.5] scale-x-[1.02] [&>div]:w-full [&_iframe]:w-full" />
        </div>
      );
    }

    return (
      <div className={`relative w-full ${disabled || isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Custom Visual Button */}
        <motion.button
          type="button"
          disabled={disabled || isLoading || !isScriptLoaded}
          whileHover={{ scale: disabled ? 1 : 1.01 }}
          whileTap={{ scale: disabled ? 1 : 0.99 }}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span>{isLoading ? t('common.connecting') : buttonText}</span>
        </motion.button>

        {/* Invisible Google Button Overlay targeting strictly the button area */}
        {!disabled && !isLoading && isScriptLoaded && (
          <div className="absolute inset-0 z-10 w-full h-full overflow-hidden opacity-[0.01]">
            <div ref={buttonRef} className="w-full h-full flex items-center justify-center [&>div]:w-full [&_iframe]:w-full" />
          </div>
        )}
      </div>
    );
  }
);

// Divider component for "or" separator
export function AuthDivider() {
  const { t } = useTranslation();
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
          {t('common.or')}
        </span>
      </div>
    </div>
  );
}


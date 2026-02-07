import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';

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
            }
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

// Get Google Client ID from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function GoogleAuthButton({ onSuccess, onError, text = 'continue_with', disabled = false }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

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
      onError?.('Failed to load Google Sign-In');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup is optional since script is global
    };
  }, [onError]);

  // Initialize Google Sign-In when script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !window.google || !GOOGLE_CLIENT_ID) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    } catch (error) {
      console.error('[GoogleAuth] Failed to initialize:', error);
      onError?.('Failed to initialize Google Sign-In');
    }
  }, [isScriptLoaded, onSuccess, onError]);

  const handleClick = useCallback(() => {
    if (!window.google || !GOOGLE_CLIENT_ID || disabled || isLoading) return;

    setIsLoading(true);

    try {
      window.google.accounts.id.prompt((notification) => {
        setIsLoading(false);
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          console.warn('[GoogleAuth] Prompt not displayed:', reason);

          // If One Tap doesn't work, we could fall back to popup
          // For now, show an error
          if (reason === 'opt_out_or_no_session') {
            onError?.('Please sign in to your Google account first');
          } else if (reason === 'suppressed_by_user') {
            onError?.('Google Sign-In was cancelled');
          } else {
            onError?.('Google Sign-In is not available');
          }
        } else if (notification.isSkippedMoment()) {
          // User dismissed the prompt
          console.log('[GoogleAuth] User skipped the prompt');
        }
      });
    } catch (error) {
      setIsLoading(false);
      console.error('[GoogleAuth] Error showing prompt:', error);
      onError?.('Failed to open Google Sign-In');
    }
  }, [disabled, isLoading, onError]);

  // Don't render if no client ID configured
  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  const buttonText = {
    signin_with: 'Sign in with Google',
    signup_with: 'Sign up with Google',
    continue_with: 'Continue with Google',
    signin: 'Google',
  }[text];

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading || !isScriptLoaded}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      <span>{isLoading ? 'Connecting...' : buttonText}</span>
    </motion.button>
  );
}

// Divider component for "or" separator
export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
          or
        </span>
      </div>
    </div>
  );
}

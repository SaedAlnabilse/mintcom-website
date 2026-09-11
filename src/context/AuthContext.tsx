import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../config/api';
import i18n from '../i18n';
import { LogoutOverlay } from '../components/LogoutOverlay';
import { LoginOverlay } from '../components/LoginOverlay';
import type { Account, Establishment } from '../types';
import { hasPendingAccountDeletion } from '../utils/deletionRecovery';

interface AuthContextType {
  // Account (Main Account)
  account: Account | null;
  establishments: Establishment[];
  currentEstablishment: Establishment | null;

  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;

  // Account auth methods
  register: (data: RegisterData) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: (
    credential: string,
    subscribeToNews?: boolean,
    intent?: 'login' | 'signup',
  ) => Promise<AuthResult>;
  loginWithApple: (
    data: AppleAuthData,
    intent?: 'login' | 'signup',
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;

  // Verification methods
  verifyEmail: (token: string) => Promise<AuthResult>;
  resendVerification: (email: string) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (token: string, password: string) => Promise<AuthResult>;

  // Establishment methods
  setCurrentEstablishment: (establishment: Establishment) => void;
  refreshEstablishments: () => Promise<Establishment[]>;
  refreshProfile: () => Promise<void>;
  updateEstablishmentsCurrency: (currency: string) => void;

  // Account update
  updateAccount: (updates: Partial<Account>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  subscribeToNews?: boolean;
  // Records the user's acceptance of the Terms of Service and Privacy Policy.
  acceptedTerms: boolean;
}

interface AppleAuthData {
  identityToken: string;
  nonce: string;
  firstName?: string;
  lastName?: string;
  subscribeToNews?: boolean;
}

interface AuthResult {
  success: boolean;
  error?: string;
  code?: string;
  statusCode?: number;
  message?: string;
  isSecondaryAdmin?: boolean;
  // True when the account has no establishments yet, so the user must be sent
  // straight into onboarding instead of the marketing/landing page.
  needsOnboarding?: boolean;
  // Establishments at login time, so callers can compute the post-login
  // destination (single location -> dashboard, multi -> picker) without
  // racing the async context state update.
  establishments?: Establishment[];
  // Pending-deletion owners must enter the dedicated recovery flow before any
  // onboarding or portal routing decisions are made.
  requiresAccountRecovery?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OWNER_SESSION_ACTIVE_CODE = 'OWNER_SESSION_ACTIVE';
const OWNER_SESSION_ACTIVE_MESSAGE =
  'Another device is already logged in to this owner account. Please sign out from that device to continue here, or reset your password to sign out everywhere.';

const getAuthErrorCode = (error: any): string | undefined => {
  const responseData = error?.response?.data;
  return typeof responseData?.code === 'string' ? responseData.code : undefined;
};

const getAuthErrorMessage = (error: any, fallback: string): string => {
  const responseData = error?.response?.data;

  if (responseData?.code === OWNER_SESSION_ACTIVE_CODE) {
    return OWNER_SESSION_ACTIVE_MESSAGE;
  }

  if (typeof responseData?.message === 'string') {
    return responseData.message;
  }

  if (Array.isArray(responseData?.message)) {
    return responseData.message.join('\n');
  }

  if (typeof responseData?.error === 'string') {
    return responseData.error;
  }

  return fallback;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [currentEstablishment, setCurrentEstablishmentState] = useState<Establishment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Check if user needs to complete onboarding (no establishments)
  const needsOnboarding =
    account !== null &&
    !hasPendingAccountDeletion(account) &&
    establishments.length === 0;

  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAuth = async () => {
    try {
      const savedAccount = localStorage.getItem('account');
      // Use sessionStorage for currentEstablishment - this is per-tab, allowing multiple tabs with different establishments
      const savedEstablishment = sessionStorage.getItem('currentEstablishment');

      if (savedAccount) {
        const accountData = JSON.parse(savedAccount);
        setAccount(accountData);

        if (savedEstablishment) {
          setCurrentEstablishmentState(JSON.parse(savedEstablishment));
        }

        // Fetch fresh data - this will validate the HttpOnly cookie
        try {
          const refreshTasks: Promise<any>[] = [refreshEstablishments()];

          // Secondary admins/employees log in through /api/accounts/login but
          // /api/accounts/profile returns the owner profile and can overwrite session identity.
          if (!accountData.isSecondaryAdmin) {
            refreshTasks.push(refreshProfile());
          } else {
            console.log('[Auth] Skipping owner profile refresh for secondary admin session');
          }

          await Promise.all(refreshTasks);
        } catch (error: any) {
          // If establishments fetch fails with 401, the cookie isn't working
          // This is a cross-origin cookie issue
          console.error('[Auth] Failed to fetch data - cookie issue?', error.response?.status);

          if (error.response?.status === 401) {
            // Don't clear auth - let the user stay "logged in" with cached data
            // But show a warning that some features may not work
            console.warn('[Auth] Cookie not being sent properly - APIs will fail');
            toast.error(i18n.t('auth.errors.sessionIssue'));
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const cachedRaw = localStorage.getItem('account');
      const cachedAccount: Account | null = cachedRaw ? JSON.parse(cachedRaw) : null;
      const activeAccount = account || cachedAccount;

      // Never refresh secondary admin profile from owner-only endpoint
      if (activeAccount?.isSecondaryAdmin) {
        console.log('[Auth] Skipping /api/accounts/profile for secondary admin session');
        return;
      }

      console.log('[Auth] Refreshing profile...');
      const response = await api.get('/api/accounts/profile');
      if (response.data) {
        setAccount(prev => {
          const baseAccount = prev || activeAccount;
          const updatedAccount: Account = {
            ...baseAccount,
            ...response.data,
            defaultPaymentMethod: response.data.defaultPaymentMethod
          };
          localStorage.setItem('account', JSON.stringify(updatedAccount));
          return updatedAccount;
        });
        console.log('[Auth] Profile refreshed');
      }
    } catch (error) {
      console.error('[Auth] Failed to refresh profile:', error);
    }
  };

  const loadRecoveryAwareEstablishments = async (
    accountData: Account,
    loginEstablishments: Establishment[] | null | undefined,
  ): Promise<Establishment[]> => {
    let finalEstablishments = loginEstablishments || [];

    // Login responses intentionally stay compact and can contain active rows
    // only. The owner list endpoint also returns future manual-deletion rows,
    // which must be loaded before deciding that this is a brand-new account.
    if (!accountData.isSecondaryAdmin) {
      try {
        const response = await api.get('/api/establishments');
        finalEstablishments = response.data || [];
      } catch (error) {
        console.error('[Auth] Failed to load recovery-aware establishments:', error);
      }
    }

    setEstablishments(finalEstablishments);
    if (finalEstablishments.length > 0) {
      const defaultEstablishment = finalEstablishments[0];
      setCurrentEstablishmentState(defaultEstablishment);
      sessionStorage.setItem(
        'currentEstablishment',
        JSON.stringify(defaultEstablishment),
      );
    } else {
      setCurrentEstablishmentState(null);
      sessionStorage.removeItem('currentEstablishment');
    }

    return finalEstablishments;
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    try {
      const response = await api.post('/api/accounts/register', data);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Account created! Please check your email to verify.',
        };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.',
      };
    }
  };

  const hydrateLoggedInAccount = async (
    accountData: Account,
    estList: Establishment[],
    extraMessage?: string,
  ): Promise<AuthResult> => {
    setLoginSuccess(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    localStorage.setItem('account', JSON.stringify(accountData));
    setAccount(accountData);
    const finalEstablishments = await loadRecoveryAwareEstablishments(
      accountData,
      estList,
    );

    setTimeout(() => {
      setIsLoggingIn(false);
      setLoginSuccess(false);
    }, 500);

    return {
      success: true,
      isSecondaryAdmin: !!accountData.isSecondaryAdmin,
      requiresAccountRecovery: hasPendingAccountDeletion(accountData),
      needsOnboarding:
        !hasPendingAccountDeletion(accountData) &&
        finalEstablishments.length === 0,
      establishments: finalEstablishments,
      ...(extraMessage ? { message: extraMessage } : {}),
    };
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoggingIn(true);
    setLoginSuccess(false);

    try {
      // Run Api call
      const response = await api.post('/api/accounts/login', { email, password, platform: 'web' });

      // The accessToken is now set as an HttpOnly cookie by the server
      // We only receive account and establishments data in the response body
      if (response.data.account) {
        return await hydrateLoggedInAccount(
          response.data.account,
          response.data.establishments,
        );
      }

      setIsLoggingIn(false);
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      // Short delay so the user at least sees the spinner if the error is instant
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoggingIn(false);
      if (!error.response) {
        return {
          success: false,
          error: 'Cannot reach the Mintcom server from this website domain. Please try again, or contact support if it continues.',
        };
      }
      return {
        success: false,
        code: getAuthErrorCode(error),
        statusCode: error?.response?.status,
        error: getAuthErrorMessage(error, 'Invalid email or password'),
      };
    }
  };

  const loginWithGoogle = async (
    credential: string,
    subscribeToNews?: boolean,
    intent: 'login' | 'signup' = 'signup',
  ): Promise<AuthResult> => {
    setIsLoggingIn(true);
    setLoginSuccess(false);

    try {
      // Send the Google ID token to our backend for verification.
      // intent=login refuses to create a new account (login page); signup may create one.
      const response = await api.post('/api/accounts/google-auth', {
        credential,
        subscribeToNews,
        platform: 'web',
        intent,
      });

      if (response.data.account) {
        return await hydrateLoggedInAccount(
          response.data.account,
          response.data.establishments,
          response.data.isNewUser ? 'Account created successfully!' : 'Welcome back!',
        );
      }

      setIsLoggingIn(false);
      return { success: false, error: 'Google login failed' };
    } catch (error: any) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoggingIn(false);
      return {
        success: false,
        code: getAuthErrorCode(error),
        error: getAuthErrorMessage(error, 'Google authentication failed. Please try again.'),
      };
    }
  };

  const loginWithApple = async (
    data: AppleAuthData,
    intent: 'login' | 'signup' = 'signup',
  ): Promise<AuthResult> => {
    setIsLoggingIn(true);
    setLoginSuccess(false);

    try {
      // Send the Apple identity token (plus the raw nonce and first-auth name)
      // to our backend. The backend hashes the nonce and verifies the token.
      // intent=login refuses to create a new account; signup may create one.
      const response = await api.post('/api/accounts/apple-auth', {
        identityToken: data.identityToken,
        nonce: data.nonce,
        firstName: data.firstName,
        lastName: data.lastName,
        subscribeToNews: data.subscribeToNews,
        platform: 'web',
        intent,
      });

      if (response.data.account) {
        return await hydrateLoggedInAccount(
          response.data.account,
          response.data.establishments,
          response.data.isNewUser ? 'Account created successfully!' : 'Welcome back!',
        );
      }

      setIsLoggingIn(false);
      return { success: false, error: 'Apple login failed' };
    } catch (error: any) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoggingIn(false);
      return {
        success: false,
        code: getAuthErrorCode(error),
        error: getAuthErrorMessage(error, 'Apple authentication failed. Please try again.'),
      };
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      // Call the logout endpoint to clear the HttpOnly cookie
      // Add a minimum delay to show the animation
      await Promise.all([
        api.post('/api/accounts/logout').catch(e => console.error('Logout API failed:', e)),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);
    } catch (error) {
      console.error('Logout process error:', error);
    } finally {
      // Clear local state regardless of API call result
      localStorage.removeItem('account');
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('currentEstablishment');

      // IMPORTANT: We do NOT call setAccount(null) here.
      // Calling setAccount(null) triggers ProtectedRoute to redirect to /login via React Router.
      // Then window.location.href reloads the page.
      // This causes the "double login screen" or "flicker" effect.
      // By skipping setAccount(null), the user stays on the current screen (covered by the overlay)
      // until the hard reload happens.

      window.location.href = '/login';
    }
  };

  const verifyEmail = async (token: string): Promise<AuthResult> => {
    try {
      const response = await api.post('/api/accounts/verify-email', { token });
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Verification failed',
      };
    }
  };

  const resendVerification = async (email: string): Promise<AuthResult> => {
    try {
      const response = await api.post('/api/accounts/resend-verification', { email });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to resend code',
      };
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    try {
      const response = await api.post('/api/accounts/forgot-password', { email });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send reset email',
      };
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<AuthResult> => {
    try {
      const response = await api.post('/api/accounts/reset-password', { token, newPassword });
      localStorage.removeItem('account');
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('currentEstablishment');
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reset password',
      };
    }
  };

  const setCurrentEstablishment = (establishment: Establishment) => {
    setCurrentEstablishmentState(establishment);
    // Use sessionStorage so each tab can have its own establishment
    sessionStorage.setItem('currentEstablishment', JSON.stringify(establishment));
  };

  const refreshEstablishments = async (): Promise<Establishment[]> => {
    try {
      console.log('[Auth] Fetching establishments...');
      // The HttpOnly cookie will be sent automatically with the request
      const response = await api.get('/api/establishments');
      console.log('[Auth] Establishments fetched:', response.data?.length || 0);

      const finalEstablishments = response.data || [];
      setEstablishments(finalEstablishments);

      // Update current establishment (priority: sessionStorage -> localStorage -> default first)
      const sessionEst = sessionStorage.getItem('currentEstablishment');
      const localEstId = localStorage.getItem('selectedEstablishmentId');

      if (sessionEst) {
        const parsed = JSON.parse(sessionEst);
        const updated = finalEstablishments.find((e: Establishment) => e.id === parsed.id);
        if (updated) {
          setCurrentEstablishment(updated);
          return finalEstablishments;
        }
      }

      if (localEstId) {
        const updated = finalEstablishments.find((e: Establishment) => e.id === localEstId);
        if (updated) {
          setCurrentEstablishment(updated);
          return finalEstablishments;
        }
      }

      if (finalEstablishments.length > 0) {
        setCurrentEstablishment(finalEstablishments[0]);
      } else {
        setCurrentEstablishmentState(null);
        sessionStorage.removeItem('currentEstablishment');
      }

      return finalEstablishments;
    } catch (error: any) {
      console.error('[Auth] Failed to refresh establishments:', error.response?.status, error.message);
      // Don't clear auth state here - let the API interceptor handle 401s
      // Just rethrow so caller can handle if needed
      throw error;
    }
  };

  // The system currency applies to every establishment. Keep the cached
  // establishment data (including this tab's selected establishment) in sync
  // as soon as the owner saves it, so dependent screens rerender immediately.
  const updateEstablishmentsCurrency = (currency: string) => {
    const normalizedCurrency = currency.toUpperCase();
    setEstablishments(previous =>
      previous.map(establishment => ({ ...establishment, currency: normalizedCurrency })),
    );
    setCurrentEstablishmentState(previous => {
      if (!previous) return previous;
      const updated = { ...previous, currency: normalizedCurrency };
      sessionStorage.setItem('currentEstablishment', JSON.stringify(updated));
      return updated;
    });
  };

  // Update account data (e.g., after setting Owner POS ID)
  const updateAccount = (updates: Partial<Account>) => {
    if (account) {
      const updatedAccount = { ...account, ...updates };
      setAccount(updatedAccount);
      localStorage.setItem('account', JSON.stringify(updatedAccount));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        account,
        establishments,
        currentEstablishment,
        isAuthenticated: !!account,
        isLoading,
        needsOnboarding,
        register,
        login,
        loginWithGoogle,
        loginWithApple,
        logout,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        setCurrentEstablishment,
        refreshEstablishments,
        refreshProfile,
        updateEstablishmentsCurrency,
        updateAccount,
      }}
    >
      {children}
      <AnimatePresence>
        {isLoggingOut && <LogoutOverlay key="logout-overlay" />}
        {isLoggingIn && <LoginOverlay key="login-overlay" isSuccess={loginSuccess} />}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

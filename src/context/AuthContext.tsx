import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import api from '../config/api';
import { LogoutOverlay } from '../components/LogoutOverlay';
import { LoginOverlay } from '../components/LoginOverlay';

// Types for the new account-based authentication
interface Account {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  emailVerified: boolean;
  trialUsed: boolean;
  trialEndDate?: string;
  establishmentLoginId?: string; // Account-level Owner POS ID
  defaultPaymentMethod?: string; // Last 4 digits of saved card (e.g., "4242")
  defaultCardId?: string; // ID of the default saved card
  deletionRequestedAt?: string; // ISO date string if deletion is pending
  permissions?: string[]; // Admin permissions
  isSecondaryAdmin?: boolean; // Flag for secondary admin users
}

interface Establishment {
  id: string;
  name: string;
  type: string;
  currency: string;
  subscriptionStatus: string;
  establishmentLoginId?: string;
}

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
  logout: () => Promise<void>;

  // Verification methods
  verifyEmail: (token: string) => Promise<AuthResult>;
  resendVerification: (email: string) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (token: string, password: string) => Promise<AuthResult>;

  // Establishment methods
  setCurrentEstablishment: (establishment: Establishment) => void;
  refreshEstablishments: () => Promise<void>;

  // Account update
  updateAccount: (updates: Partial<Account>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
  isSecondaryAdmin?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [currentEstablishment, setCurrentEstablishmentState] = useState<Establishment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Check if user needs to complete onboarding (no establishments)
  const needsOnboarding = account !== null && establishments.length === 0;

  useEffect(() => {
    initializeAuth();
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
        await refreshEstablishments();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      localStorage.removeItem('account');
    } finally {
      setIsLoading(false);
    }
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

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoggingIn(true);
    setLoginSuccess(false);

    try {
      // 1. Initial "signing in" state
      // Run API call
      const response = await api.post('/api/accounts/login', { email, password });

      // The accessToken is now set as an HttpOnly cookie by the server
      // We only receive account and establishments data in the response body
      if (response.data.account) {
        // 2. Success state
        setLoginSuccess(true);
        
        // Wait for success animation to play
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const { account: accountData, establishments: estList } = response.data;

        // Save account data to localStorage (for UI state persistence only, not for auth)
        localStorage.setItem('account', JSON.stringify(accountData));

        setAccount(accountData);
        setEstablishments(estList || []);
        
        // Auto-select the first establishment if available
        // This ensures the X-Establishment-Id header is set for subsequent requests
        if (estList && estList.length > 0) {
          const defaultEst = estList[0];
          setCurrentEstablishmentState(defaultEst);
          sessionStorage.setItem('currentEstablishment', JSON.stringify(defaultEst));
        }
        
        // Keep overlay on until navigation completes
        setTimeout(() => {
          setIsLoggingIn(false);
          setLoginSuccess(false);
        }, 500);

        return { 
          success: true, 
          isSecondaryAdmin: !!accountData.isSecondaryAdmin 
        };
      }
      
      setIsLoggingIn(false);
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      // Short delay so the user at least sees the spinner if the error is instant
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoggingIn(false);
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid email or password',
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
        error: error.response?.data?.message || 'Failed to resend verification',
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

  const refreshEstablishments = async () => {
    try {
      // The HttpOnly cookie will be sent automatically with the request
      const response = await api.get('/api/establishments');

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
          return;
        }
      }

      if (localEstId) {
        const updated = finalEstablishments.find((e: Establishment) => e.id === localEstId);
        if (updated) {
          setCurrentEstablishment(updated);
          return;
        }
      }

      if (finalEstablishments.length > 0) {
        setCurrentEstablishment(finalEstablishments[0]);
      }
    } catch (error) {
      console.error('Failed to refresh establishments:', error);
    }
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
        logout,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        setCurrentEstablishment,
        refreshEstablishments,
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

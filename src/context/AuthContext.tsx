import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../config/api';

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
  logout: () => void;

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [currentEstablishment, setCurrentEstablishmentState] = useState<Establishment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user needs to complete onboarding (no establishments)
  const needsOnboarding = account !== null && establishments.length === 0;

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('accountToken');
      const savedAccount = localStorage.getItem('account');
      // Use sessionStorage for currentEstablishment - this is per-tab, allowing multiple tabs with different establishments
      const savedEstablishment = sessionStorage.getItem('currentEstablishment');

      if (token && savedAccount) {
        const accountData = JSON.parse(savedAccount);
        setAccount(accountData);

        if (savedEstablishment) {
          setCurrentEstablishmentState(JSON.parse(savedEstablishment));
        }

        // Fetch fresh data
        await refreshEstablishments();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      localStorage.removeItem('accountToken');
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
    try {
      const response = await api.post('/api/accounts/login', { email, password });

      if (response.data.accessToken) {
        const { accessToken, account: accountData, establishments: estList } = response.data;

        // Save auth data
        localStorage.setItem('accountToken', accessToken);
        localStorage.setItem('account', JSON.stringify(accountData));

        setAccount(accountData);
        setEstablishments(estList || []);

        // We do NOT set default establishment automatically anymore
        // This forces the user to go through the selection screen
        // unless they are re-logging in and we restore from localStorage (handled in initializeAuth)

        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid email or password',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('accountToken');
    localStorage.removeItem('account');
    // Clear sessionStorage for current tab
    sessionStorage.removeItem('currentEstablishment');
    setAccount(null);
    setEstablishments([]);
    setCurrentEstablishmentState(null);
    window.location.href = '/login';
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
      const token = localStorage.getItem('accountToken');
      if (!token) return;

      const response = await api.get('/api/establishments', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEstablishments(response.data || []);

      // Update current establishment if it exists (use sessionStorage for per-tab isolation)
      const savedEst = sessionStorage.getItem('currentEstablishment');
      if (savedEst) {
        const parsed = JSON.parse(savedEst);
        const updated = response.data?.find((e: Establishment) => e.id === parsed.id);
        if (updated) {
          setCurrentEstablishment(updated);
        }
      } else if (response.data?.length > 0) {
        setCurrentEstablishment(response.data[0]);
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




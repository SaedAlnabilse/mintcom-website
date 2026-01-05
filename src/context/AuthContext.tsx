import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../config/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  tenantId: string;
}

interface Tenant {
  id: string;
  slug: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  verifyTenant: (slug: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    const savedTenant = localStorage.getItem('tenant');

    if (token && savedUser && savedTenant) {
      setUser(JSON.parse(savedUser));
      setTenant(JSON.parse(savedTenant));
    }
    setIsLoading(false);
  }, []);

  const verifyTenant = async (slug: string, password: string) => {
    try {
      // Backend expects: tenantSlug and restaurantPassword
      const response = await api.post('/api/auth/verify-tenant', {
        tenantSlug: slug,
        restaurantPassword: password
      });

      // Backend returns { id, name, slug, token } directly on success (HTTP 200)
      if (response.data && response.data.id) {
        const tenantData = {
          id: response.data.id,
          slug: response.data.slug,
          name: response.data.name,
        };
        setTenant(tenantData);
        localStorage.setItem('tenant', JSON.stringify(tenantData));
        if (response.data.token) {
          localStorage.setItem('tenantToken', response.data.token);
        }
        return { success: true };
      }
      return { success: false, error: 'Invalid restaurant credentials' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify restaurant'
      };
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const tenantToken = localStorage.getItem('tenantToken');
      const savedTenant = localStorage.getItem('tenant');
      const tenantSlug = savedTenant ? JSON.parse(savedTenant).slug : tenant?.slug;
      
      const response = await api.post('/api/auth/login',
        { username, password, tenantSlug },
        { headers: { Authorization: `Bearer ${tenantToken}` } }
      );

      if (response.data.access_token) {
        const token = response.data.access_token;
        localStorage.setItem('authToken', token);

        // Fetch user profile
        const profileResponse = await api.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const userData = profileResponse.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid username or password'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tenantToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setUser(null);
    setTenant(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuthenticated: !!user && !!tenant,
        isLoading,
        verifyTenant,
        login,
        logout,
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

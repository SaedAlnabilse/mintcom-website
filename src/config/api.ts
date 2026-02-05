import axios from 'axios';

// Api Base Url - In development, use empty string to leverage Vite proxy
// In production, use the full Url
export const API_BASE_URL = import.meta.env.PROD
  ? 'https://grateful-liberation-production-d036.up.railway.app'
  : '';

// Debug logging for production cross-origin issues
if (import.meta.env.PROD) {
  console.log('[API] Production mode - API Base URL:', API_BASE_URL);
  console.log('[API] withCredentials enabled for cross-origin cookie support');
}

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for HttpOnly cookie authentication - CRITICAL for cross-origin
});

// Global loading state management
let activeRequests = 0;

const updateLoadingState = () => {
  if (activeRequests > 0) {
    document.body.classList.add('app-loading');
  } else {
    document.body.classList.remove('app-loading');
  }
};

export const startGlobalLoading = () => {
  activeRequests++;
  updateLoadingState();
};

export const stopGlobalLoading = () => {
  if (activeRequests > 0) activeRequests--;
  updateLoadingState();
};

// Request interceptor to add establishment ID and ensure /api prefix
api.interceptors.request.use(
  (config) => {
    activeRequests++;
    updateLoadingState();

    // Ensure all API calls have the /api prefix (except for static files like /uploads, /files)
    if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('/uploads') && !config.url.startsWith('/files') && !config.url.startsWith('http')) {
      config.url = `/api${config.url}`;
    }

    // Add current establishment ID for account owner requests
    // This is CRITICAL for multi-establishment isolation
    // Use sessionStorage to support multiple tabs with different establishments
    const currentEstablishment = sessionStorage.getItem('currentEstablishment');
    if (currentEstablishment) {
      try {
        const est = JSON.parse(currentEstablishment);
        if (est?.id) {
          // Use .set() method for proper header setting in axios v1.x+
          config.headers.set('X-Establishment-Id', est.id);
        }
      } catch (e) {
        console.warn('[API] Failed to parse currentEstablishment from sessionStorage:', e);
      }
    }

    return config;
  },
  (error) => {
    activeRequests--;
    updateLoadingState();
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    activeRequests--;
    updateLoadingState();
    return response;
  },
  (error) => {
    // Check if the error is 401 and NOT from the login or logout endpoint
    // We don't want to redirect if the user failed to log in (wrong password)
    // We only want to redirect if the user's session expired while using the app
    const isLoginRequest = error.config?.url?.includes('/api/accounts/login');
    const isLogoutRequest = error.config?.url?.includes('/api/accounts/logout');
    const isLoginPage = window.location.pathname.includes('/login');
    
    // Skip redirect for auth initialization - let AuthContext handle it
    // This prevents race conditions during app startup
    const isAuthInit = error.config?.url?.includes('/api/establishments') && !localStorage.getItem('account')?.length;

    if (error.response?.status === 401 && !isLoginRequest && !isLogoutRequest && !isLoginPage && !isAuthInit) {
      // Clear local auth data and redirect to login
      // The HttpOnly cookie will be cleared by calling the logout endpoint
      localStorage.removeItem('account');
      sessionStorage.removeItem('currentEstablishment');
      
      // Only redirect if we're not already on the login page (prevents redirect loops)
      if (!window.location.pathname.includes('/login')) {
        console.warn('[API] Session expired, redirecting to login');
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden - Permission denied
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || 'You do not have permission to perform this action';
      // Dispatch a custom event that components can listen to for showing toast
      window.dispatchEvent(new CustomEvent('permission-denied', {
        detail: { message: errorMessage }
      }));
      console.warn('[API] Permission denied:', errorMessage);
    }

    activeRequests--;
    updateLoadingState();
    return Promise.reject(error);
  }
);

export default api;

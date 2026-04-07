import axios from 'axios';

const ESTABLISHMENT_HEADER = 'X-Establishment-Id';
const SKIP_ESTABLISHMENT_HEADER = 'X-Skip-Establishment-Header';
const SKIP_AUTH_REDIRECT_HEADER = 'X-Skip-Auth-Redirect';
const MISSING_ESTABLISHMENT_HEADER_MESSAGE = 'X-Establishment-Id header is required for this endpoint';

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

const getApiErrorMessage = (error: any): string => {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  if (typeof responseData?.message === 'string') {
    return responseData.message;
  }

  if (typeof responseData?.error === 'string') {
    return responseData.error;
  }

  return '';
};

const normalizeEstablishmentHeaderError = (error: any) => {
  const message = getApiErrorMessage(error).trim();

  if (!message.includes(MISSING_ESTABLISHMENT_HEADER_MESSAGE)) {
    return;
  }

  if (error?.response?.data && typeof error.response.data === 'object') {
    if ('message' in error.response.data) {
      error.response.data.message = '';
    }

    if ('error' in error.response.data) {
      error.response.data.error = '';
    }
  }

  error.message = '';
  error.isMissingEstablishmentHeader = true;
  console.warn('[API] Suppressed raw establishment header validation error');
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

    const skipEstablishmentHeader = config.headers.get(SKIP_ESTABLISHMENT_HEADER) === 'true';
    config.headers.delete(SKIP_ESTABLISHMENT_HEADER);
    const skipAuthRedirect = config.headers.get(SKIP_AUTH_REDIRECT_HEADER) === 'true';
    config.headers.delete(SKIP_AUTH_REDIRECT_HEADER);
    (config as any).skipAuthRedirect = skipAuthRedirect;

    // Add current establishment ID for account owner requests
    // This is CRITICAL for multi-establishment isolation
    // Use sessionStorage to support multiple tabs with different establishments
    const explicitEstablishmentHeader = config.headers.get(ESTABLISHMENT_HEADER);
    const currentEstablishment = sessionStorage.getItem('currentEstablishment');

    if (!skipEstablishmentHeader && !explicitEstablishmentHeader && currentEstablishment) {
      try {
        const est = JSON.parse(currentEstablishment);
        if (est?.id) {
          // Use .set() method for proper header setting in axios v1.x+
          config.headers.set(ESTABLISHMENT_HEADER, est.id);
        }
      } catch (e) {
        console.warn('[API] Failed to parse currentEstablishment from sessionStorage:', e);
      }
    }

    // Add Authorization header from localStorage if available (fallback for cross-origin cookies)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
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
    normalizeEstablishmentHeaderError(error);

    // Check if the error is 401 and NOT from the login or logout endpoint
    const isLoginRequest = error.config?.url?.includes('/api/accounts/login');
    const isLogoutRequest = error.config?.url?.includes('/api/accounts/logout');
    const isLoginPage = window.location.pathname.includes('/login');
    const skipAuthRedirect = Boolean((error.config as any)?.skipAuthRedirect);
    
    // Log all 401 errors for debugging
    if (error.response?.status === 401) {
      console.error('[API] 401 Unauthorized:', error.config?.url);
      console.error('[API] This usually means the cookie is not being sent');
      console.error('[API] Check: 1) CORS credentials, 2) Cookie sameSite/secure settings');
    }
    
    // Only auto-redirect on 401 if NOT on login page and NOT a login/logout request
    // AND only if we're not in the initialization phase (to avoid loops)
    const shouldRedirect = error.response?.status === 401 && 
                          !isLoginRequest && 
                          !isLogoutRequest && 
                          !isLoginPage &&
                          !skipAuthRedirect &&
                          localStorage.getItem('account'); // Only if we think we're logged in

    if (shouldRedirect) {
      console.warn('[API] Session expired, redirecting to login');
      localStorage.removeItem('account');
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('currentEstablishment');
      window.location.href = '/login';
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

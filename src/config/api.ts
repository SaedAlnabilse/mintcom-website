import axios from 'axios';
import { env } from './env';

const ESTABLISHMENT_HEADER = 'X-Establishment-Id';
const SKIP_ESTABLISHMENT_HEADER = 'X-Skip-Establishment-Header';
const SKIP_AUTH_REDIRECT_HEADER = 'X-Skip-Auth-Redirect';
const MISSING_ESTABLISHMENT_HEADER_MESSAGE = 'X-Establishment-Id header is required for this endpoint';

// Use relative URLs in both development and production so the browser talks to the
// current origin. In production, Cloudflare proxies /api requests to Railway,
// which keeps auth cookies first-party and avoids Incognito/privacy-mode failures.
export const API_BASE_URL = '';

// Debug logging for production request routing
if (env.PROD) {
  console.log('[API] Production mode - using same-origin API proxy');
  console.log('[API] withCredentials enabled for first-party cookie support');
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

const getBillingRedirectPath = (): string => {
  const currentEstablishment = sessionStorage.getItem('currentEstablishment');

  if (!currentEstablishment) {
    return '/select-establishment';
  }

  try {
    const establishment = JSON.parse(currentEstablishment);
    const slug = establishment?.establishmentLoginId || establishment?.id;
    return slug ? `/dashboard/${slug}/billing` : '/select-establishment';
  } catch {
    return '/select-establishment';
  }
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
    const isBillingPage = window.location.pathname.includes('/billing');
    const isBillingRequest = error.config?.url?.includes('/billing');
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

    if (
      (error.response?.status === 402 || error.response?.status === 423) &&
      !isLoginPage &&
      !isBillingPage &&
      !isBillingRequest
    ) {
      const errorMessage =
        error.response?.data?.message ||
        'Subscription is required to continue using Paymint.';

      window.dispatchEvent(new CustomEvent('subscription-required', {
        detail: { message: errorMessage }
      }));
      window.location.href = getBillingRedirectPath();
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

export const extractErrorMessage = (error: any): string => {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  const message = responseData?.message;
  if (Array.isArray(message)) {
    return message.join('\n');
  }

  if (typeof message === 'string') {
    return message;
  }

  if (typeof responseData?.error === 'string') {
    return responseData.error;
  }

  return error?.message || '';
};

export default api;

import axios from 'axios';

// Api Base Url - In development, use empty string to leverage Vite proxy
// In production, use the full Url
// Detect if running on Cloudflare Workers (production) vs local dev
const isCloudflareWorkers = typeof window !== 'undefined' && 
  window.location.hostname.endsWith('.workers.dev');

export const API_BASE_URL = isCloudflareWorkers 
  ? 'https://grateful-liberation-production-d036.up.railway.app'
  : '';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for HttpOnly cookie authentication
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

    if (error.response?.status === 401 && !isLoginRequest && !isLogoutRequest && !isLoginPage) {
      // Clear local auth data and redirect to login
      // The HttpOnly cookie will be cleared by calling the logout endpoint
      localStorage.removeItem('account');
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

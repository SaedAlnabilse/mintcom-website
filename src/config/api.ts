import axios from 'axios';

// API Base URL - In development, use empty string to leverage Vite proxy
// In production, use the full URL
// export const API_BASE_URL = import.meta.env.DEV ? '' : 'https://grateful-liberation-production-d036.up.railway.app';
export const API_BASE_URL = 'https://grateful-liberation-production-d036.up.railway.app';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and establishment ID
api.interceptors.request.use(
  (config) => {
    // Check for accountToken (new system) first, then authToken (legacy)
    const token = localStorage.getItem('accountToken') || localStorage.getItem('authToken');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
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
    } else {
      console.warn('[API] No currentEstablishment found in sessionStorage - API calls may not be scoped to an establishment');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth data (both new and legacy keys) and redirect to login
      localStorage.removeItem('accountToken');
      localStorage.removeItem('account');
      sessionStorage.removeItem('currentEstablishment'); // Use sessionStorage for per-tab isolation
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

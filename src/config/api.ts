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
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add current establishment ID for account owner requests
    const currentEstablishment = localStorage.getItem('currentEstablishment');
    if (currentEstablishment) {
      try {
        const est = JSON.parse(currentEstablishment);
        if (est?.id) {
          config.headers['X-Establishment-Id'] = est.id;
        }
      } catch (e) {
        // Ignore parse errors
      }
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
      localStorage.removeItem('currentEstablishment');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

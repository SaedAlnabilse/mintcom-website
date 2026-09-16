import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './i18n' // Initialize i18n before app
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.tsx'

// Global handler for dynamic chunk loading errors (e.g. after a new deployment)
// Automatically and seamlessly reloads the page to fetch the newest assets without disrupting the user.
const CHUNK_RELOAD_KEY = 'chunk_reload_timestamp';
const RELOAD_COOLDOWN_MS = 15000;

function handleChunkLoadFailure() {
  try {
    const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
    const now = Date.now();
    if (now - lastReload > RELOAD_COOLDOWN_MS) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
      window.location.reload();
      return true;
    }
  } catch {
    window.location.reload();
    return true;
  }
  return false;
}

// Vite 4.3+ native preload error event
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  handleChunkLoadFailure();
});

// Fallback for browsers or environments where dynamic import rejection bubbles up
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = (reason && (reason.message || String(reason))) || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Unable to preload CSS')
  ) {
    event.preventDefault();
    handleChunkLoadFailure();
  }
});

// Reset cooldown once the app has mounted and run cleanly
setTimeout(() => {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    // Ignore storage errors in restricted contexts
  }
}, 5000);

const rootElement = document.getElementById('root')!;
const app = (
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}




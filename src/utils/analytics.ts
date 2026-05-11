import { env } from '../config/env';

const GA_MEASUREMENT_ID = env.VITE_GA_MEASUREMENT_ID?.trim();
const META_PIXEL_ID = env.VITE_META_PIXEL_ID?.trim();

const isConfiguredValue = (value?: string) => {
  if (!value) return false;

  const normalized = value.trim();
  if (!normalized) return false;

  const upper = normalized.toUpperCase();
  return upper !== 'NULL' && !/^G-?X+$/.test(upper) && !/^X+$/.test(upper);
};

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
  }
}

/**
 * Initialize Google Analytics (GA4)
 */
const loadGoogleAnalytics = () => {
  if (!isConfiguredValue(GA_MEASUREMENT_ID)) {
    console.info('[Analytics] Google Analytics is disabled - no measurement ID configured.');
    return;
  }

  if (document.getElementById('ga-script')) return; // Already loaded

  console.log('📊 Initializing Google Analytics...');

  // 1. Load the script tag
  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // 2. Initialize the command queue
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
};

/**
 * Initialize Meta/Facebook Pixel
 */
const loadMarketingPixel = () => {
  if (!isConfiguredValue(META_PIXEL_ID)) {
    console.info('[Analytics] Meta Pixel is disabled - no pixel ID configured.');
    return;
  }

  if (document.getElementById('meta-pixel-script')) return;

  console.log('🎯 Initializing Marketing Pixels...');

  const script = document.createElement('script');
  script.id = 'meta-pixel-script';
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${META_PIXEL_ID}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
};

/**
 * Remove scripts (if user revokes consent)
 * Note: This doesn't delete existing cookies, but stops new tracking.
 */
const removeScript = (id: string) => {
  const script = document.getElementById(id);
  if (script) {
    script.remove();
    console.log(`🚫 specific script [${id}] removed.`);
  }
};

export const updateConsentState = (prefs: { analytics: boolean; marketing: boolean; functional: boolean }) => {
  console.group('🍪 Cookie Consent Update');
  
  // 1. Analytics
  if (prefs.analytics) {
    loadGoogleAnalytics();
  } else {
    removeScript('ga-script');
    // Optional: reload page to ensure clean state if critical
  }

  // 2. Marketing
  if (prefs.marketing) {
    loadMarketingPixel();
  } else {
    removeScript('meta-pixel-script');
  }

  // 3. Functional (Example: Chat Widget)
  if (prefs.functional) {
    // Logic to enable complex interactive features (e.g. Chatbots that save history)
    console.log('✨ Functional cookies enabled');
  }

  console.log('Current Preferences:', prefs);
  console.groupEnd();
};

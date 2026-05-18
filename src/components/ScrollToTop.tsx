import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 *
 * Automatically scrolls the window to the top whenever the route changes.
 * When a hash is present (e.g. /#features), polls for the target element
 * so it works even when the destination page is lazy-loaded.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      let attempts = 0;
      const maxAttempts = 30; // up to ~1.5 s of polling

      const tryScroll = () => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(tryScroll, 50);
        }
      };

      // Start after a short initial delay to let React render the new route
      const initial = setTimeout(tryScroll, 80);
      return () => clearTimeout(initial);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return null;
}


import { useState, useEffect } from 'react';

/**
 * Hook to detect whether the viewport is a compact/laptop screen
 * (e.g. 1080p laptop with 125%/150% Windows scaling, or short vertical height <= 860px).
 *
 * Preserves the standard spacious view on tall Retina screens (like MacBook Pro 14"/16"
 * which has height ~982px-1117px and width >= 1440px).
 */
export function useIsCompactSidebar(): boolean {
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight <= 860 || window.innerWidth <= 1366;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check = () => {
      setIsCompact(window.innerHeight <= 860 || window.innerWidth <= 1366);
    };

    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  return isCompact;
}

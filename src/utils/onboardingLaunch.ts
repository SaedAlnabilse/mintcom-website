import type { NavigateFunction } from 'react-router-dom';

/** Canonical entry of the location setup wizard (server resumes correct phase). */
export const ONBOARDING_START_PATH = '/onboarding';

/**
 * Open the first-location onboarding wizard in a new browser tab.
 * Returns false when the browser blocks the popup (callers should fall back).
 */
export function openOnboardingInNewTab(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const url = `${window.location.origin}${ONBOARDING_START_PATH}`;
  const tab = window.open(url, '_blank', 'noopener,noreferrer');
  return Boolean(tab);
}

/**
 * After a successful first-time login/signup, take the user straight into
 * the setup wizard in the same tab. Same-tab is more reliable than a popup
 * (no blocker issues, no duplicate sessions, back-button works).
 */
export function launchFirstTimeOnboarding(navigate: NavigateFunction): void {
  navigate(ONBOARDING_START_PATH, { replace: true });
}

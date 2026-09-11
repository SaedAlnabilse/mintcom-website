import type { Establishment } from '../types';
import {
  ACCOUNT_RECOVERY_PATH,
  buildLocationDeletionRecoveryPath,
  getEstablishmentSlug,
  isManualEstablishmentDeletionPending,
} from './deletionRecovery';
import { ONBOARDING_START_PATH } from './onboardingLaunch';

export interface PostLoginInput {
  redirectTo?: string | null;
  requiresAccountRecovery?: boolean;
  needsOnboarding?: boolean;
  isSecondaryAdmin?: boolean;
  establishments?: Establishment[] | null;
}

const AUTH_PAGES = new Set([
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
]);

/**
 * Only allow same-origin relative paths. Blocks `//evil.com`,
 * `https://...`, `javascript:...`, backslashes, etc.
 */
export function isSafePostLoginRedirect(path: unknown): path is string {
  if (typeof path !== 'string' || path.length === 0) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.includes('\\')) return false;
  const lower = path.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.includes('://')
  ) {
    return false;
  }
  // Never bounce straight back to an auth screen.
  const base = `/${path.slice(1).split(/[?#]/)[0]}`;
  if (AUTH_PAGES.has(base)) return false;
  return true;
}

function dashboardPathFor(est: Establishment): string {
  const slug = getEstablishmentSlug(est);
  if (isManualEstablishmentDeletionPending(est)) {
    return buildLocationDeletionRecoveryPath(slug);
  }
  return `/dashboard/${encodeURIComponent(slug)}`;
}

/**
 * Single source of truth for "where do we go after login/signup?".
 *
 * Priority:
 * 1. Account recovery (pending deletion) — must win over everything.
 * 2. Explicit `from` set by ProtectedRoute/OwnerRoute — deep link preserved.
 * 3. First-time owners (no establishments) — onboarding wizard.
 * 4. Single establishment — straight into its dashboard.
 * 5. Multiple establishments — location picker.
 */
export function getPostLoginDestination(input: PostLoginInput): string {
  if (input.requiresAccountRecovery) {
    return ACCOUNT_RECOVERY_PATH;
  }

  // Respect the page the user was trying to open (e.g. /owner/billing,
  // /dashboard/xyz/orders, /support/tickets/123). '/' means "no deep link",
  // so fall through to the smart default below instead of the marketing site.
  if (
    input.redirectTo &&
    input.redirectTo !== '/' &&
    isSafePostLoginRedirect(input.redirectTo)
  ) {
    return input.redirectTo;
  }

  if (input.needsOnboarding) {
    return ONBOARDING_START_PATH;
  }

  const list = input.establishments ?? [];
  if (list.length === 0) {
    return ONBOARDING_START_PATH;
  }

  if (list.length === 1) {
    return dashboardPathFor(list[0]);
  }

  return '/select-establishment';
}

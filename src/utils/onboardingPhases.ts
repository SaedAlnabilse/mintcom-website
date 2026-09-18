/** Canonical onboarding phase slugs used in the URL. */
export const ONBOARDING_PHASES = [
  'location',
  'business',
  'location-login',
  'owner-login',
  'billing',
  'launch',
] as const;

export type OnboardingPhaseSlug = (typeof ONBOARDING_PHASES)[number];

export type ApiOnboardingPhase =
  | 'PROFILE'
  | 'LOCATION_LOGIN'
  | 'OWNER_LOGIN'
  | 'BILLING'
  | 'LAUNCH'
  | 'COMPLETED';

export const phaseToStepNumber: Record<OnboardingPhaseSlug, number> = {
  location: 1,
  business: 1,
  'location-login': 2,
  'owner-login': 3,
  billing: 4,
  launch: 5,
};

export const stepNumberToPhase: Record<number, OnboardingPhaseSlug> = {
  1: 'location',
  2: 'location-login',
  3: 'owner-login',
  4: 'billing',
  5: 'launch',
};

const API_TO_SLUG: Record<ApiOnboardingPhase, OnboardingPhaseSlug> = {
  PROFILE: 'location',
  LOCATION_LOGIN: 'location-login',
  OWNER_LOGIN: 'owner-login',
  BILLING: 'billing',
  LAUNCH: 'launch',
  COMPLETED: 'launch',
};

/**
 * Clamping index for each phase. Both `location` and `business` share level 0
 * because they map to the same backend checkpoint (PROFILE). This prevents
 * clampPhase from treating the business survey as an illegal forward-skip.
 */
const PHASE_CLAMP_INDEX: Record<OnboardingPhaseSlug, number> = {
  location: 0,
  business: 0,
  'location-login': 1,
  'owner-login': 2,
  billing: 3,
  launch: 4,
};

/**
 * Legacy URL slugs that should be redirected to their new equivalents.
 * Used by the router to keep old bookmarks / browser history working.
 */
export const LEGACY_SLUG_MAP: Record<string, OnboardingPhaseSlug> = {
  profile: 'location',
};

export function mapApiPhase(phase: string | undefined | null): OnboardingPhaseSlug {
  if (!phase) return 'location';
  const key = phase.toUpperCase() as ApiOnboardingPhase;
  return API_TO_SLUG[key] || 'location';
}

export function isLaunchLocked(
  serverPhase: OnboardingPhaseSlug,
  apiPhase?: string | null,
): boolean {
  if (serverPhase === 'launch') return true;
  const upper = String(apiPhase || '').toUpperCase();
  return upper === 'LAUNCH' || upper === 'COMPLETED';
}

/**
 * Clamp a requested phase against the server-allowed phase.
 * - Cannot skip ahead of server progress.
 * - After launch/complete, always force launch (no back to payment).
 *
 * Uses PHASE_CLAMP_INDEX so that phases sharing the same backend checkpoint
 * (e.g. 'location' and 'business' both under PROFILE) are treated equally.
 */
export function clampPhase(
  requested: string | undefined,
  serverPhase: OnboardingPhaseSlug,
  locked: boolean,
): OnboardingPhaseSlug {
  if (locked || serverPhase === 'launch') {
    return 'launch';
  }

  const reqPhase = requested as OnboardingPhaseSlug;
  const reqIdx = PHASE_CLAMP_INDEX[reqPhase];
  const maxIdx = PHASE_CLAMP_INDEX[serverPhase];

  if (reqIdx === undefined) {
    return serverPhase;
  }

  // Cannot go past server phase (skip).
  if (reqIdx > maxIdx) {
    return serverPhase;
  }

  // Before complete: allow revisiting earlier phases.
  return reqPhase;
}

export function isOnboardingPhaseSlug(value: string | undefined): value is OnboardingPhaseSlug {
  return !!value && (ONBOARDING_PHASES as readonly string[]).includes(value);
}

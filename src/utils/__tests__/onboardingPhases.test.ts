import { describe, expect, it } from 'vitest';
import { clampPhase, isLaunchLocked, mapApiPhase } from '../onboardingPhases';

describe('clampPhase', () => {
  it('blocks skip ahead to billing from location', () => {
    expect(clampPhase('billing', 'location', false)).toBe('location');
  });

  it('forces launch when locked after payment', () => {
    expect(clampPhase('location', 'launch', true)).toBe('launch');
    expect(clampPhase('billing', 'billing', true)).toBe('launch');
  });

  it('allows current billing phase', () => {
    expect(clampPhase('billing', 'billing', false)).toBe('billing');
  });

  it('allows going back before complete', () => {
    expect(clampPhase('owner-login', 'billing', false)).toBe('owner-login');
    expect(clampPhase('location', 'billing', false)).toBe('location');
  });

  it('blocks back after launch even if not flagged locked', () => {
    expect(clampPhase('billing', 'launch', false)).toBe('launch');
  });

  it('defaults invalid requested to server phase', () => {
    expect(clampPhase('nope', 'location-login', false)).toBe('location-login');
    expect(clampPhase(undefined, 'owner-login', false)).toBe('owner-login');
  });

  it('allows business when server phase is location (same PROFILE checkpoint)', () => {
    expect(clampPhase('business', 'location', false)).toBe('business');
  });

  it('allows location when server phase is business (same PROFILE checkpoint)', () => {
    expect(clampPhase('location', 'business', false)).toBe('location');
  });

  it('blocks business from skipping to location-login', () => {
    expect(clampPhase('location-login', 'location', false)).toBe('location');
    expect(clampPhase('location-login', 'business', false)).toBe('business');
  });
});

describe('mapApiPhase', () => {
  it('maps COMPLETED to launch slug', () => {
    expect(mapApiPhase('COMPLETED')).toBe('launch');
    expect(mapApiPhase('LOCATION_LOGIN')).toBe('location-login');
  });

  it('maps PROFILE to location slug', () => {
    expect(mapApiPhase('PROFILE')).toBe('location');
  });

  it('returns location for empty or unknown phase', () => {
    expect(mapApiPhase(undefined)).toBe('location');
    expect(mapApiPhase(null)).toBe('location');
    expect(mapApiPhase('')).toBe('location');
  });
});

describe('isLaunchLocked', () => {
  it('locks on launch/completed', () => {
    expect(isLaunchLocked('launch')).toBe(true);
    expect(isLaunchLocked('billing', 'LAUNCH')).toBe(true);
    expect(isLaunchLocked('billing', 'BILLING')).toBe(false);
  });
});

import { api } from '../config/api';

/**
 * Client for the backend legal/consent authority (GET /legal/version,
 * GET/POST /legal/consent). Lets the app detect when the signed-in user's
 * accepted policy version is stale and re-prompt them to accept the update.
 *
 * The policy TEXT is still rendered from the bundled i18n copy (required for
 * offline + app-store review); the backend is the source of truth only for the
 * version + per-account consent state.
 */

export interface LegalVersion {
  policyVersion: string;
  effectiveDate: string;
  entity: string;
  contactEmail: string;
  governingLaw: string;
}

export interface ConsentStatus {
  currentVersion: string;
  effectiveDate: string;
  acceptedVersion: string | null;
  acceptedTermsAt: string | null;
  acceptedPrivacyAt: string | null;
  /** True when the user should be re-prompted to accept an updated policy. */
  reacceptanceRequired: boolean;
}

/** The policy version currently in force (public; no auth required). */
export const getLegalVersion = async (): Promise<LegalVersion> => {
  const { data } = await api.get<LegalVersion>('/api/legal/version');
  return data;
};

/** The signed-in account's consent state, including whether re-acceptance is needed. */
export const getConsentStatus = async (): Promise<ConsentStatus> => {
  const { data } = await api.get<ConsentStatus>('/api/legal/consent');
  return data;
};

/** Record acceptance of the current policy (first-time or re-accept after a bump). */
export const recordConsent = async (
  acceptedTerms: boolean,
  policyVersion?: string,
): Promise<ConsentStatus> => {
  const { data } = await api.post<ConsentStatus>('/api/legal/consent', {
    acceptedTerms,
    policyVersion,
  });
  return data;
};

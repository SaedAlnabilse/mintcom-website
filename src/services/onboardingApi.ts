import api from '../config/api';

export type OnboardingSessionResponse = {
  sessionId: string;
  phase: string;
  allowedPhase: string;
  draft: Record<string, unknown>;
  establishmentId?: string;
  reservedLoginId?: string;
  isAdditionalLocation: boolean;
  completedAt?: string;
  establishment?: any;
  alreadyComplete?: boolean;
};

export type OnboardingProfilePayload = {
  name?: string;
  type?: string;
  country?: string;
  currency?: string;
  address?: string;
  timezone?: string;
  duplicateFromId?: string;
  duplicateInventory?: boolean;
  duplicateDiscounts?: boolean;
  duplicatePaymentMethods?: boolean;
  contactPhone?: string;
  staffSize?: string;
  branchesPlanned?: string;
  currentPos?: string;
  heardAbout?: string;
  referralCode?: string;
  marketingConsent?: boolean;
  [key: string]: unknown;
};

const skipHeader = { 'X-Skip-Establishment-Header': 'true' };

export const onboardingApi = {
  async getSession(): Promise<OnboardingSessionResponse> {
    const res = await api.get('/api/onboarding/session', { headers: skipHeader });
    return res.data;
  },

  async saveProfile(
    body: OnboardingProfilePayload | Record<string, unknown>,
  ): Promise<OnboardingSessionResponse> {
    const res = await api.post('/api/onboarding/checkpoints/profile', body, {
      headers: skipHeader,
    });
    return res.data;
  },

  async saveLocationLogin(body: {
    establishmentLoginId: string;
  }): Promise<OnboardingSessionResponse> {
    const res = await api.post('/api/onboarding/checkpoints/location-login', body, {
      headers: skipHeader,
    });
    return res.data;
  },

  async saveOwnerLogin(body: Record<string, unknown>): Promise<OnboardingSessionResponse> {
    const res = await api.post('/api/onboarding/checkpoints/owner-login', body, {
      headers: skipHeader,
    });
    return res.data;
  },

  async complete(body: Record<string, unknown>): Promise<OnboardingSessionResponse> {
    const res = await api.post('/api/onboarding/complete', body, {
      headers: skipHeader,
    });
    return res.data;
  },

  async restart(): Promise<OnboardingSessionResponse> {
    const res = await api.post(
      '/api/onboarding/restart',
      {},
      { headers: skipHeader },
    );
    return res.data;
  },
};

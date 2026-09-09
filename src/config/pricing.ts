export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type BillingCycle = (typeof BILLING_CYCLES)[keyof typeof BILLING_CYCLES];

export const MINTCOM_PRICING = {
  currency: 'USD',
  defaultBillingCycle: BILLING_CYCLES.MONTHLY as BillingCycle,
  primary: {
    monthly: 20,
    yearly: 200,
  },
  additionalLocation: {
    monthly: 20,
    yearly: 200,
  },
} as const;

export const getMintcomPrice = (cycle: BillingCycle, isAdditionalLocation = false) => {
  const pricing = isAdditionalLocation ? MINTCOM_PRICING.additionalLocation : MINTCOM_PRICING.primary;
  return pricing[cycle];
};

export const getMintcomYearlySavings = (isAdditionalLocation = false) => {
  const pricing = isAdditionalLocation ? MINTCOM_PRICING.additionalLocation : MINTCOM_PRICING.primary;
  return (pricing.monthly * 12) - pricing.yearly;
};

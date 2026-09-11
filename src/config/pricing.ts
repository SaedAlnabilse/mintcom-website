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
    yearly: 220,
  },
  additionalLocation: {
    monthly: 20,
    yearly: 220,
  },
} as const;

export const getMintcomPrice = (
  cycle: BillingCycle,
  isAdditionalLocation = false,
  _currency = 'USD',
): number => {
  const pricing = isAdditionalLocation ? MINTCOM_PRICING.additionalLocation : MINTCOM_PRICING.primary;
  return pricing[cycle];
};

export const getMintcomYearlySavings = (
  isAdditionalLocation = false,
  _currency = 'USD',
): number => {
  const pricing = isAdditionalLocation ? MINTCOM_PRICING.additionalLocation : MINTCOM_PRICING.primary;
  return (pricing.monthly * 12) - pricing.yearly;
};

export const getMintcomDiscountPercent = (
  isAdditionalLocation = false,
  _currency = 'USD',
): number => {
  const pricing = isAdditionalLocation ? MINTCOM_PRICING.additionalLocation : MINTCOM_PRICING.primary;
  const totalMonthly = pricing.monthly * 12;
  if (totalMonthly <= 0) return 0;
  return Math.max(0, Math.round(((totalMonthly - pricing.yearly) / totalMonthly) * 100));
};

export const getMintcomEffectiveMonthlyPrice = (
  isAdditionalLocation = false,
  _currency = 'USD',
): number => {
  const pricing = isAdditionalLocation ? MINTCOM_PRICING.additionalLocation : MINTCOM_PRICING.primary;
  return Math.round(pricing.yearly / 12);
};

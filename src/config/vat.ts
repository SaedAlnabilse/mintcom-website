/**
 * VAT / sales-tax rates for Mintcom subscription billing.
 *
 * These are the standard rates applied to the plan price shown at checkout.
 * The rate is resolved from the establishment's country code (ISO-3166 alpha-2).
 *
 * NOTE: This mirrors the preview shown to the customer. Production billing
 * should compute tax server-side (or delegate to Stripe Tax) so the charged
 * amount always matches the invoice. Keep this map in sync with the backend
 * tax table until Stripe Tax is wired in.
 */
export interface VatRule {
  /** Display percentage, e.g. 20 for 20%. */
  rate: number;
  /** Human label shown beside the amount ("VAT", "GST", "Sales Tax"). */
  label: string;
  /** When true the plan price already includes tax (no amount added on top). */
  inclusive?: boolean;
}

/** Countries where Mintcom charges VAT/GST on subscriptions. */
export const VAT_BY_COUNTRY: Record<string, VatRule> = {
  // Gulf / GCC
  AE: { rate: 5, label: 'VAT' },
  SA: { rate: 15, label: 'VAT' },
  BH: { rate: 10, label: 'VAT' },
  OM: { rate: 5, label: 'VAT' },
  QA: { rate: 0, label: 'VAT' },
  KW: { rate: 0, label: 'VAT' },
  // Europe (EU representative rates)
  GB: { rate: 20, label: 'VAT' },
  DE: { rate: 19, label: 'VAT' },
  FR: { rate: 20, label: 'VAT' },
  ES: { rate: 21, label: 'VAT' },
  IT: { rate: 22, label: 'VAT' },
  NL: { rate: 21, label: 'VAT' },
  IE: { rate: 23, label: 'VAT' },
  PT: { rate: 23, label: 'VAT' },
  SE: { rate: 25, label: 'VAT' },
  DK: { rate: 25, label: 'VAT' },
  FI: { rate: 24, label: 'VAT' },
  AT: { rate: 20, label: 'VAT' },
  BE: { rate: 21, label: 'VAT' },
  PL: { rate: 23, label: 'VAT' },
  LU: { rate: 17, label: 'VAT' },
  // Other
  AU: { rate: 10, label: 'GST' },
  NZ: { rate: 15, label: 'GST' },
  CA: { rate: 5, label: 'GST' },
  IN: { rate: 18, label: 'GST' },
  EG: { rate: 14, label: 'VAT' },
  JO: { rate: 16, label: 'VAT' },
  TR: { rate: 20, label: 'VAT' },
};

/** Resolve the VAT rule for a country, or null when no tax applies. */
export function getVatRule(countryCode?: string | null): VatRule | null {
  if (!countryCode) return null;
  const rule = VAT_BY_COUNTRY[countryCode.trim().toUpperCase()];
  if (!rule || rule.rate <= 0) return null;
  return rule;
}

export interface VatBreakdown {
  subtotal: number;
  vatAmount: number;
  total: number;
  rule: VatRule | null;
}

/** Compute subtotal / VAT / total for an exclusive (tax-added) price. */
export function computeVat(subtotal: number, countryCode?: string | null): VatBreakdown {
  const rule = getVatRule(countryCode);
  if (!rule) {
    return { subtotal, vatAmount: 0, total: subtotal, rule: null };
  }
  const vatAmount = Math.round(subtotal * (rule.rate / 100) * 100) / 100;
  return { subtotal, vatAmount, total: Math.round((subtotal + vatAmount) * 100) / 100, rule };
}

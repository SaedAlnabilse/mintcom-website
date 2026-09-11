/**
 * Country Fiscal Catalog — worldwide (web port).
 *
 * Mirrors the POS catalog (mintcom-pos/src/services/tax/countries.ts) so the
 * web dashboard's E-Invoicing & Tax Compliance card renders exactly the same
 * country list, credential fields and platform labels.
 *
 * Single source of truth mapping a country to:
 *   1. which TaxProvider drives its e-invoicing (clearance / Peppol / manual),
 *   2. which credential fields the owner must fill (drives the UI form),
 *   3. the official tax-rate presets for that country.
 *
 * Pure TypeScript — no React/RN imports — so it can be reused anywhere.
 */

export type CountryCode = string;

export type TaxCategory =
  | 'STANDARD'
  | 'REDUCED'
  | 'ZERO_RATED'
  | 'EXEMPT'
  | 'OUT_OF_SCOPE';

/** A single credential input the owner fills in the settings screen. */
export interface CredentialField {
  key: string;
  label: string;
  hint?: string;
  secret?: boolean;
  required?: boolean;
  keyboard?: 'default' | 'numeric' | 'email-address' | 'url';
  placeholder?: string;
}

/** A selectable tax rate preset for a country. */
export interface TaxRatePreset {
  id: string;
  rate: number | null;
  category: TaxCategory;
  label: string;
}

export interface CountryFiscalConfig {
  countryCode: CountryCode;
  name: string;
  flag: string;
  currency: string;
  providerId: string;
  platformName?: string;
  registrationUrl?: string;
  credentialFields: CredentialField[];
  taxPresets: TaxRatePreset[];
  defaultTaxPresetId?: string;
}

// ─────────────────────────── Provider routing ───────────────────────────

const JOFOTARA_COUNTRIES = new Set<CountryCode>(['JO']);
const ZATCA_COUNTRIES = new Set<CountryCode>(['SA']);

const PEPPOL_COUNTRIES = new Set<CountryCode>([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'NO', 'IS', 'LI', 'CH', 'GB', 'AE', 'SG', 'AU', 'NZ', 'JP',
]);

function providerForCountry(code: CountryCode): string {
  if (JOFOTARA_COUNTRIES.has(code)) return 'jofotara';
  if (ZATCA_COUNTRIES.has(code)) return 'zatca';
  if (PEPPOL_COUNTRIES.has(code)) return 'peppol';
  return 'none';
}

/** Generic Peppol credential fields, identical for every Peppol member. */
const PEPPOL_CREDENTIAL_FIELDS: CredentialField[] = [
  { key: 'vatNumber', label: 'VAT/Tax Registration Number', required: true },
  { key: 'accessPointId', label: 'Peppol Access Point ID or URL', required: true },
  { key: 'apiKey', label: 'Access Point API Key', secret: true, required: true },
];

// ─────────────────────────── World tax table ────────────────────────────

interface WorldTaxRecord {
  name: string;
  currency: string;
  standard: number | null;
  reduced?: number[];
}

const WORLD_TAX_TABLE: Record<CountryCode, WorldTaxRecord> = {
  // ── Europe (EU) ──
  AT: { name: 'Austria', currency: 'EUR', standard: 20, reduced: [10, 13] },
  BE: { name: 'Belgium', currency: 'EUR', standard: 21, reduced: [6, 12] },
  BG: { name: 'Bulgaria', currency: 'BGN', standard: 20, reduced: [9] },
  HR: { name: 'Croatia', currency: 'EUR', standard: 25, reduced: [5, 13] },
  CY: { name: 'Cyprus', currency: 'EUR', standard: 19, reduced: [5, 9] },
  CZ: { name: 'Czechia', currency: 'CZK', standard: 21, reduced: [12] },
  DK: { name: 'Denmark', currency: 'DKK', standard: 25 },
  EE: { name: 'Estonia', currency: 'EUR', standard: 22, reduced: [9] },
  FI: { name: 'Finland', currency: 'EUR', standard: 25.5, reduced: [10, 14] },
  FR: { name: 'France', currency: 'EUR', standard: 20, reduced: [2.1, 5.5, 10] },
  DE: { name: 'Germany', currency: 'EUR', standard: 19, reduced: [7] },
  GR: { name: 'Greece', currency: 'EUR', standard: 24, reduced: [6, 13] },
  HU: { name: 'Hungary', currency: 'HUF', standard: 27, reduced: [5, 18] },
  IE: { name: 'Ireland', currency: 'EUR', standard: 23, reduced: [9, 13.5] },
  IT: { name: 'Italy', currency: 'EUR', standard: 22, reduced: [4, 5, 10] },
  LV: { name: 'Latvia', currency: 'EUR', standard: 21, reduced: [5, 12] },
  LT: { name: 'Lithuania', currency: 'EUR', standard: 21, reduced: [5, 9] },
  LU: { name: 'Luxembourg', currency: 'EUR', standard: 17, reduced: [3, 8, 14] },
  MT: { name: 'Malta', currency: 'EUR', standard: 18, reduced: [5, 7] },
  NL: { name: 'Netherlands', currency: 'EUR', standard: 21, reduced: [9] },
  PL: { name: 'Poland', currency: 'PLN', standard: 23, reduced: [5, 8] },
  PT: { name: 'Portugal', currency: 'EUR', standard: 23, reduced: [6, 13] },
  RO: { name: 'Romania', currency: 'RON', standard: 21, reduced: [11] },
  SK: { name: 'Slovakia', currency: 'EUR', standard: 23, reduced: [5, 19] },
  SI: { name: 'Slovenia', currency: 'EUR', standard: 22, reduced: [5, 9.5] },
  ES: { name: 'Spain', currency: 'EUR', standard: 21, reduced: [4, 10] },
  SE: { name: 'Sweden', currency: 'SEK', standard: 25, reduced: [6, 12] },

  // ── Europe (non-EU) ──
  GB: { name: 'United Kingdom', currency: 'GBP', standard: 20, reduced: [5] },
  NO: { name: 'Norway', currency: 'NOK', standard: 25, reduced: [12, 15] },
  IS: { name: 'Iceland', currency: 'ISK', standard: 24, reduced: [11] },
  LI: { name: 'Liechtenstein', currency: 'CHF', standard: 8.1, reduced: [2.6, 3.8] },
  CH: { name: 'Switzerland', currency: 'CHF', standard: 8.1, reduced: [2.6, 3.8] },
  UA: { name: 'Ukraine', currency: 'UAH', standard: 20, reduced: [7, 14] },
  RU: { name: 'Russia', currency: 'RUB', standard: 20, reduced: [10] },
  TR: { name: 'Türkiye', currency: 'TRY', standard: 20, reduced: [1, 10] },
  RS: { name: 'Serbia', currency: 'RSD', standard: 20, reduced: [10] },
  AL: { name: 'Albania', currency: 'ALL', standard: 20, reduced: [6] },
  MK: { name: 'North Macedonia', currency: 'MKD', standard: 18, reduced: [5, 10] },
  BA: { name: 'Bosnia and Herzegovina', currency: 'BAM', standard: 17 },
  MD: { name: 'Moldova', currency: 'MDL', standard: 20, reduced: [8, 12] },
  ME: { name: 'Montenegro', currency: 'EUR', standard: 21, reduced: [7] },
  BY: { name: 'Belarus', currency: 'BYN', standard: 20, reduced: [10] },
  AD: { name: 'Andorra', currency: 'EUR', standard: 4.5, reduced: [1] },
  MC: { name: 'Monaco', currency: 'EUR', standard: 20, reduced: [2.1, 5.5, 10] },

  // ── Middle East ──
  SA: { name: 'Saudi Arabia', currency: 'SAR', standard: 15 },
  AE: { name: 'United Arab Emirates', currency: 'AED', standard: 5 },
  JO: { name: 'Jordan', currency: 'JOD', standard: 16 },
  QA: { name: 'Qatar', currency: 'QAR', standard: 0 },
  KW: { name: 'Kuwait', currency: 'KWD', standard: 0 },
  BH: { name: 'Bahrain', currency: 'BHD', standard: 10 },
  OM: { name: 'Oman', currency: 'OMR', standard: 5 },
  IL: { name: 'Israel', currency: 'ILS', standard: 18 },
  LB: { name: 'Lebanon', currency: 'LBP', standard: 11 },
  IQ: { name: 'Iraq', currency: 'IQD', standard: 0 },
  YE: { name: 'Yemen', currency: 'YER', standard: 5 },
  SY: { name: 'Syria', currency: 'SYP', standard: 0 },
  IR: { name: 'Iran', currency: 'IRR', standard: 9 },
  PS: { name: 'Palestine', currency: 'ILS', standard: 16 },

  // ── Asia ──
  IN: { name: 'India', currency: 'INR', standard: 18, reduced: [5, 12, 28] },
  PK: { name: 'Pakistan', currency: 'PKR', standard: 18 },
  BD: { name: 'Bangladesh', currency: 'BDT', standard: 15 },
  LK: { name: 'Sri Lanka', currency: 'LKR', standard: 18 },
  NP: { name: 'Nepal', currency: 'NPR', standard: 13 },
  CN: { name: 'China', currency: 'CNY', standard: 13, reduced: [6, 9] },
  JP: { name: 'Japan', currency: 'JPY', standard: 10, reduced: [8] },
  KR: { name: 'South Korea', currency: 'KRW', standard: 10 },
  TW: { name: 'Taiwan', currency: 'TWD', standard: 5 },
  HK: { name: 'Hong Kong', currency: 'HKD', standard: null },
  MO: { name: 'Macau', currency: 'MOP', standard: null },
  SG: { name: 'Singapore', currency: 'SGD', standard: 9 },
  MY: { name: 'Malaysia', currency: 'MYR', standard: 8, reduced: [6] },
  TH: { name: 'Thailand', currency: 'THB', standard: 7 },
  VN: { name: 'Vietnam', currency: 'VND', standard: 10, reduced: [5, 8] },
  ID: { name: 'Indonesia', currency: 'IDR', standard: 12, reduced: [11] },
  PH: { name: 'Philippines', currency: 'PHP', standard: 12 },
  KH: { name: 'Cambodia', currency: 'KHR', standard: 10 },
  LA: { name: 'Laos', currency: 'LAK', standard: 7 },
  MM: { name: 'Myanmar', currency: 'MMK', standard: 5 },
  BN: { name: 'Brunei', currency: 'BND', standard: null },
  MN: { name: 'Mongolia', currency: 'MNT', standard: 10 },
  KZ: { name: 'Kazakhstan', currency: 'KZT', standard: 12 },
  UZ: { name: 'Uzbekistan', currency: 'UZS', standard: 12 },
  AZ: { name: 'Azerbaijan', currency: 'AZN', standard: 18 },
  GE: { name: 'Georgia', currency: 'GEL', standard: 18 },
  AM: { name: 'Armenia', currency: 'AMD', standard: 20 },
  KG: { name: 'Kyrgyzstan', currency: 'KGS', standard: 12 },
  TJ: { name: 'Tajikistan', currency: 'TJS', standard: 14 },
  TM: { name: 'Turkmenistan', currency: 'TMT', standard: 15 },
  AF: { name: 'Afghanistan', currency: 'AFN', standard: 10 },
  MV: { name: 'Maldives', currency: 'MVR', standard: 8 },
  BT: { name: 'Bhutan', currency: 'BTN', standard: 7 },

  // ── Oceania ──
  AU: { name: 'Australia', currency: 'AUD', standard: 10 },
  NZ: { name: 'New Zealand', currency: 'NZD', standard: 15 },
  FJ: { name: 'Fiji', currency: 'FJD', standard: 15 },
  PG: { name: 'Papua New Guinea', currency: 'PGK', standard: 10 },
  WS: { name: 'Samoa', currency: 'WST', standard: 15 },
  TO: { name: 'Tonga', currency: 'TOP', standard: 15 },
  VU: { name: 'Vanuatu', currency: 'VUV', standard: 15 },
  SB: { name: 'Solomon Islands', currency: 'SBD', standard: 10 },

  // ── Africa ──
  EG: { name: 'Egypt', currency: 'EGP', standard: 14 },
  ZA: { name: 'South Africa', currency: 'ZAR', standard: 15 },
  NG: { name: 'Nigeria', currency: 'NGN', standard: 7.5 },
  KE: { name: 'Kenya', currency: 'KES', standard: 16 },
  GH: { name: 'Ghana', currency: 'GHS', standard: 15 },
  MA: { name: 'Morocco', currency: 'MAD', standard: 20, reduced: [7, 10, 14] },
  TN: { name: 'Tunisia', currency: 'TND', standard: 19, reduced: [7, 13] },
  DZ: { name: 'Algeria', currency: 'DZD', standard: 19, reduced: [9] },
  LY: { name: 'Libya', currency: 'LYD', standard: 0 },
  ET: { name: 'Ethiopia', currency: 'ETB', standard: 15 },
  TZ: { name: 'Tanzania', currency: 'TZS', standard: 18 },
  UG: { name: 'Uganda', currency: 'UGX', standard: 18 },
  RW: { name: 'Rwanda', currency: 'RWF', standard: 18 },
  CI: { name: "Côte d'Ivoire", currency: 'XOF', standard: 18 },
  SN: { name: 'Senegal', currency: 'XOF', standard: 18 },
  CM: { name: 'Cameroon', currency: 'XAF', standard: 19.25 },
  AO: { name: 'Angola', currency: 'AOA', standard: 14 },
  MZ: { name: 'Mozambique', currency: 'MZN', standard: 16 },
  ZM: { name: 'Zambia', currency: 'ZMW', standard: 16 },
  ZW: { name: 'Zimbabwe', currency: 'ZWG', standard: 15 },
  BW: { name: 'Botswana', currency: 'BWP', standard: 14 },
  NA: { name: 'Namibia', currency: 'NAD', standard: 15 },
  MU: { name: 'Mauritius', currency: 'MUR', standard: 15 },
  MG: { name: 'Madagascar', currency: 'MGA', standard: 20 },
  ML: { name: 'Mali', currency: 'XOF', standard: 18 },
  BF: { name: 'Burkina Faso', currency: 'XOF', standard: 18 },
  BJ: { name: 'Benin', currency: 'XOF', standard: 18 },
  NE: { name: 'Niger', currency: 'XOF', standard: 19 },
  TG: { name: 'Togo', currency: 'XOF', standard: 18 },
  GA: { name: 'Gabon', currency: 'XAF', standard: 18 },
  CG: { name: 'Congo', currency: 'XAF', standard: 18.9 },
  CD: { name: 'DR Congo', currency: 'CDF', standard: 16 },
  GN: { name: 'Guinea', currency: 'GNF', standard: 18 },
  SD: { name: 'Sudan', currency: 'SDG', standard: 17 },
  SO: { name: 'Somalia', currency: 'SOS', standard: 5 },
  SL: { name: 'Sierra Leone', currency: 'SLE', standard: 15 },
  LR: { name: 'Liberia', currency: 'LRD', standard: 10 },
  MW: { name: 'Malawi', currency: 'MWK', standard: 16.5 },
  GM: { name: 'Gambia', currency: 'GMD', standard: 15 },
  MR: { name: 'Mauritania', currency: 'MRU', standard: 16 },
  TD: { name: 'Chad', currency: 'XAF', standard: 18 },
  SZ: { name: 'Eswatini', currency: 'SZL', standard: 15 },
  LS: { name: 'Lesotho', currency: 'LSL', standard: 15 },
  CV: { name: 'Cabo Verde', currency: 'CVE', standard: 15 },
  SC: { name: 'Seychelles', currency: 'SCR', standard: 15 },
  BI: { name: 'Burundi', currency: 'BIF', standard: 18 },

  // ── Americas ──
  US: { name: 'United States', currency: 'USD', standard: null },
  CA: { name: 'Canada', currency: 'CAD', standard: 5 },
  MX: { name: 'Mexico', currency: 'MXN', standard: 16 },
  BR: { name: 'Brazil', currency: 'BRL', standard: 17 },
  AR: { name: 'Argentina', currency: 'ARS', standard: 21, reduced: [10.5, 27] },
  CL: { name: 'Chile', currency: 'CLP', standard: 19 },
  CO: { name: 'Colombia', currency: 'COP', standard: 19, reduced: [5] },
  PE: { name: 'Peru', currency: 'PEN', standard: 18 },
  EC: { name: 'Ecuador', currency: 'USD', standard: 15 },
  VE: { name: 'Venezuela', currency: 'VES', standard: 16 },
  UY: { name: 'Uruguay', currency: 'UYU', standard: 22, reduced: [10] },
  PY: { name: 'Paraguay', currency: 'PYG', standard: 10, reduced: [5] },
  BO: { name: 'Bolivia', currency: 'BOB', standard: 13 },
  CR: { name: 'Costa Rica', currency: 'CRC', standard: 13 },
  PA: { name: 'Panama', currency: 'PAB', standard: 7 },
  GT: { name: 'Guatemala', currency: 'GTQ', standard: 12 },
  HN: { name: 'Honduras', currency: 'HNL', standard: 15 },
  NI: { name: 'Nicaragua', currency: 'NIO', standard: 15 },
  SV: { name: 'El Salvador', currency: 'USD', standard: 13 },
  DO: { name: 'Dominican Republic', currency: 'DOP', standard: 18 },
  JM: { name: 'Jamaica', currency: 'JMD', standard: 15 },
  TT: { name: 'Trinidad and Tobago', currency: 'TTD', standard: 12.5 },
  BS: { name: 'Bahamas', currency: 'BSD', standard: 10 },
  BB: { name: 'Barbados', currency: 'BBD', standard: 17.5 },
  BZ: { name: 'Belize', currency: 'BZD', standard: 12.5 },
  GY: { name: 'Guyana', currency: 'GYD', standard: 14 },
  SR: { name: 'Suriname', currency: 'SRD', standard: 10 },
  HT: { name: 'Haiti', currency: 'HTG', standard: 10 },
};

// ─────────────────────── Curated overrides ──────────────────────────────

const OVERRIDES: Record<CountryCode, CountryFiscalConfig> = {
  JO: {
    countryCode: 'JO',
    name: 'Jordan',
    flag: '🇯🇴',
    currency: 'JOD',
    providerId: 'jofotara',
    platformName: 'JoFotara',
    registrationUrl: 'https://portal.jofotara.gov.jo/en/devices',
    credentialFields: [
      { key: 'clientId', label: 'Client ID', hint: 'Username / Client-Id from the JoFotara portal → Integrate Device', required: true },
      { key: 'clientSecret', label: 'Client secret', hint: 'Secret-Key from the portal — never share or commit it', secret: true, required: true },
      { key: 'activityNumber', label: 'Income source sequence number', hint: 'تسلسل مصدر الدخل from the Devices table', keyboard: 'numeric', required: true },
    ],
    taxPresets: [
      { id: 'JO-standard', rate: 16, category: 'STANDARD', label: 'Standard 16%' },
      { id: 'JO-telecom', rate: 24, category: 'STANDARD', label: 'Telecom 24%' },
      { id: 'JO-r10', rate: 10, category: 'REDUCED', label: 'Cheese/live animals 10%' },
      { id: 'JO-r5', rate: 5, category: 'REDUCED', label: 'Corn 5%' },
      { id: 'JO-r4', rate: 4, category: 'REDUCED', label: 'Oils/veterinary 4%' },
      { id: 'JO-r2', rate: 2, category: 'REDUCED', label: 'Salt/pencils 2%' },
      { id: 'JO-r1', rate: 1, category: 'REDUCED', label: 'Hygiene 1%' },
      { id: 'JO-zero', rate: 0, category: 'ZERO_RATED', label: 'Exports/free zone 0%' },
      { id: 'JO-exempt', rate: null, category: 'EXEMPT', label: 'Exempt (bread, water, education)' },
    ],
    defaultTaxPresetId: 'JO-standard',
  },

  SA: {
    countryCode: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    providerId: 'zatca',
    platformName: 'ZATCA Fatoora',
    registrationUrl: 'https://fatoora.zatca.gov.sa',
    credentialFields: [
      { key: 'vatNumber', label: 'VAT registration number', hint: '15 digits, starts and ends with 3', keyboard: 'numeric', required: true },
      { key: 'csrCommonName', label: 'Solution/unit name', required: true },
      { key: 'complianceCsid', label: 'Compliance CSID', secret: true },
      { key: 'productionCsid', label: 'Production CSID', secret: true },
    ],
    taxPresets: [
      { id: 'SA-standard', rate: 15, category: 'STANDARD', label: 'Standard 15%' },
      { id: 'SA-zero', rate: 0, category: 'ZERO_RATED', label: 'Zero-rated 0%' },
      { id: 'SA-exempt', rate: null, category: 'EXEMPT', label: 'Exempt' },
    ],
    defaultTaxPresetId: 'SA-standard',
  },

  AE: {
    countryCode: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    providerId: 'peppol',
    platformName: 'Peppol (PINT AE)',
    registrationUrl: 'https://tax.gov.ae',
    credentialFields: [
      { key: 'vatNumber', label: 'TRN (Tax Registration Number)', keyboard: 'numeric', required: true },
      { key: 'accessPointId', label: 'Peppol Access Point ID or URL', required: true },
      { key: 'apiKey', label: 'Access Point API Key', secret: true, required: true },
    ],
    taxPresets: [
      { id: 'AE-standard', rate: 5, category: 'STANDARD', label: 'Standard 5%' },
      { id: 'AE-zero', rate: 0, category: 'ZERO_RATED', label: 'Zero-rated 0%' },
      { id: 'AE-exempt', rate: null, category: 'EXEMPT', label: 'Exempt' },
    ],
    defaultTaxPresetId: 'AE-standard',
  },

  BE: {
    countryCode: 'BE',
    name: 'Belgium',
    flag: '🇧🇪',
    currency: 'EUR',
    providerId: 'peppol',
    platformName: 'Peppol BIS 3.0',
    registrationUrl: 'https://peppol.org',
    credentialFields: PEPPOL_CREDENTIAL_FIELDS,
    taxPresets: [
      { id: 'BE-standard', rate: 21, category: 'STANDARD', label: 'Standard 21%' },
      { id: 'BE-r12', rate: 12, category: 'REDUCED', label: 'Reduced 12%' },
      { id: 'BE-r6', rate: 6, category: 'REDUCED', label: 'Reduced 6%' },
      { id: 'BE-zero', rate: 0, category: 'ZERO_RATED', label: 'Zero-rated 0%' },
      { id: 'BE-exempt', rate: null, category: 'EXEMPT', label: 'Exempt' },
    ],
    defaultTaxPresetId: 'BE-standard',
  },
};

// ─────────────────────────── Builders ───────────────────────────────────

function flagFor(code: CountryCode): string {
  if (!/^[A-Z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...[...code].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function presetIdRate(rate: number): string {
  return `r${String(rate).replace('.', '_')}`;
}

function presetsFor(code: CountryCode, rec: WorldTaxRecord): TaxRatePreset[] {
  const presets: TaxRatePreset[] = [];
  if (rec.standard == null) {
    presets.push({ id: `${code}-standard`, rate: 0, category: 'STANDARD', label: 'Sales tax (set rate)' });
  } else {
    presets.push({ id: `${code}-standard`, rate: rec.standard, category: 'STANDARD', label: `Standard ${rec.standard}%` });
  }
  (rec.reduced ?? []).forEach(rate => {
    presets.push({ id: `${code}-${presetIdRate(rate)}`, rate, category: 'REDUCED', label: `Reduced ${rate}%` });
  });
  presets.push({ id: `${code}-zero`, rate: 0, category: 'ZERO_RATED', label: 'Zero-rated 0%' });
  presets.push({ id: `${code}-exempt`, rate: null, category: 'EXEMPT', label: 'Exempt' });
  return presets;
}

function buildConfig(code: CountryCode, rec: WorldTaxRecord): CountryFiscalConfig {
  const providerId = providerForCountry(code);
  return {
    countryCode: code,
    name: rec.name,
    flag: flagFor(code),
    currency: rec.currency,
    providerId,
    platformName: providerId === 'peppol' ? 'Peppol/EN-16931' : undefined,
    credentialFields: providerId === 'peppol' ? PEPPOL_CREDENTIAL_FIELDS : [],
    taxPresets: presetsFor(code, rec),
    defaultTaxPresetId: `${code}-standard`,
  };
}

// ─────────────────────────── Public API ─────────────────────────────────

export const GENERIC_COUNTRY_CONFIG: CountryFiscalConfig = {
  countryCode: 'XX',
  name: 'Other/manual',
  flag: '🌐',
  currency: 'USD',
  providerId: 'none',
  credentialFields: [],
  taxPresets: [
    { id: 'XX-standard', rate: 0, category: 'STANDARD', label: 'Standard rate' },
    { id: 'XX-zero', rate: 0, category: 'ZERO_RATED', label: 'Zero-rated 0%' },
    { id: 'XX-exempt', rate: null, category: 'EXEMPT', label: 'Exempt' },
  ],
  defaultTaxPresetId: 'XX-standard',
};

/** Look up a country's config (override → table → generic fallback). */
export function getCountryConfig(countryCode?: CountryCode | null): CountryFiscalConfig {
  const code = (countryCode ?? '').trim().toUpperCase();
  if (!code) return GENERIC_COUNTRY_CONFIG;
  if (OVERRIDES[code]) return OVERRIDES[code];
  const rec = WORLD_TAX_TABLE[code];
  if (rec) return buildConfig(code, rec);
  return { ...GENERIC_COUNTRY_CONFIG, countryCode: code };
}

/** Every catalogued country, sorted by name, for the picker. */
export function listCountryConfigs(): CountryFiscalConfig[] {
  const codes = new Set<CountryCode>([
    ...Object.keys(WORLD_TAX_TABLE),
    ...Object.keys(OVERRIDES),
  ]);
  return Array.from(codes)
    .map(code => getCountryConfig(code))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Cheap, offline check that the required credential fields are present. */
export function validateFiscalCredentials(
  countryCode: string | null | undefined,
  credentials: Record<string, string>,
): { valid: boolean; errors?: Record<string, string> } {
  const config = getCountryConfig(countryCode);
  const errors: Record<string, string> = {};
  for (const field of config.credentialFields) {
    if (field.required && !String(credentials[field.key] ?? '').trim()) {
      errors[field.key] = 'Required';
    }
  }
  return Object.keys(errors).length > 0 ? { valid: false, errors } : { valid: true };
}

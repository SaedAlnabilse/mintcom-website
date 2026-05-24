export const MAX_ESTABLISHMENT_NAME_LENGTH = 50;
export const MAX_ESTABLISHMENT_TAGLINE_LENGTH = 120;
export const MAX_ESTABLISHMENT_ADDRESS_LENGTH = 120;
export const MAX_ESTABLISHMENT_EMAIL_LENGTH = 80;
export const MAX_ESTABLISHMENT_TAX_ID_LENGTH = 20;
export const MAX_RECEIPT_FAREWELL_LENGTH = 80;
export const MAX_TAX_RATE_PERCENT = 100;
export const MAX_TAX_RATE_INPUT_DIGITS = 5;
export const MAX_HOLD_ORDER_TABLE_COUNT = 99;
export const MAX_HOLD_ORDER_TABLE_DIGITS = 2;
export const MAX_SERVICE_CHARGE_NAME_LENGTH = 28;
export const MAX_SERVICE_CHARGE_VALUE = 1000000;

const URL_LIMIT = 200;

export const APP_SETTINGS_FORM_FIELDS = [
  'restaurantName',
  'restaurantDescription',
  'restaurantAddress',
  'email',
  'taxIdNumber',
  'taxRate',
  'currency',
  'serviceChargeEnabled',
  'serviceChargeName',
  'serviceChargeType',
  'serviceChargeValue',
  'serviceChargeTaxable',
  'serviceChargeAutoApply',
  'serviceChargeAllowCashierOverride',
  'showLogoOnReceipt',
  'farewellMessage',
  'showRestaurantName',
  'showDescription',
  'showAddress',
  'showTaxId',
  'showFarewellMessage',
  'holdOrderTableCount',
] as const;

export const FORBIDDEN_APP_SETTINGS_UPDATE_KEYS = [
  'id',
  'establishmentId',
  'createdAt',
  'updatedAt',
  'discounts',
  'paymentMethods',
  'operatingSchedule',
  'email',
  'loginId',
  'receiptHeader',
] as const;

export type ServiceChargeType = 'PERCENTAGE' | 'FIXED';

export type AppSettingsUpdatePayload = {
  restaurantName?: string;
  restaurantDescription?: string;
  restaurantAddress?: string;
  taxIdNumber?: string;
  farewellMessage?: string;
  taxRate?: number;
  serviceChargeEnabled?: boolean;
  serviceChargeName?: string;
  serviceChargeType?: ServiceChargeType;
  serviceChargeValue?: number;
  serviceChargeTaxable?: boolean;
  serviceChargeAutoApply?: boolean;
  serviceChargeAllowCashierOverride?: boolean;
  holdOrderTableCount?: number;
  currency?: string;
  logo?: string | null;
  receiptLogo?: string | null;
  openingTime?: string | null;
  closingTime?: string | null;
  loyaltyConfig?: unknown;
  showRestaurantName?: boolean;
  showBusinessName?: boolean;
  showLogoOnReceipt?: boolean;
  showDescription?: boolean;
  showAddress?: boolean;
  showTaxId?: boolean;
  showFarewellMessage?: boolean;
  invoiceStartNumber?: number | null;
};

type AppSettingsLike = object;

export const sanitizeLimitedText = (value: unknown, maxLength: number) =>
  String(value ?? '').slice(0, maxLength);

export const sanitizeDigits = (value: unknown, maxLength: number) =>
  String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, maxLength);

export const clampTaxRatePercent = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(MAX_TAX_RATE_PERCENT, Math.max(0, Math.round(parsed * 100) / 100));
};

export const normalizeBackendTaxRateForForm = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  const percent = parsed > 0 && parsed <= 1 ? parsed * 100 : parsed;
  return clampTaxRatePercent(percent);
};

export const normalizeHoldOrderTableCount = (value: unknown, fallback = 20) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_HOLD_ORDER_TABLE_COUNT, Math.max(0, Math.floor(parsed)));
};

const hasOwn = (data: AppSettingsLike, key: string) =>
  Object.prototype.hasOwnProperty.call(data, key);

const read = (data: AppSettingsLike, key: string) =>
  (data as Record<string, unknown>)[key];

const optionalStringOrNull = (
  data: AppSettingsLike,
  key: string,
  maxLength: number,
) => {
  if (!hasOwn(data, key)) return undefined;
  const value = read(data, key);
  if (value === null) return null;
  return sanitizeLimitedText(value, maxLength);
};

const optionalBoolean = (data: AppSettingsLike, key: string) =>
  hasOwn(data, key) ? Boolean(read(data, key)) : undefined;

const optionalNumberOrNull = (data: AppSettingsLike, key: string) => {
  if (!hasOwn(data, key)) return undefined;
  const value = read(data, key);
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeNonNegativeNumber = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
};

const normalizeServiceChargeValue = (value: unknown) =>
  Math.min(MAX_SERVICE_CHARGE_VALUE, normalizeNonNegativeNumber(value));

const normalizeComparableSettingValue = (value: unknown) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' && Number.isNaN(value)) return '';
  return value;
};

export const getChangedAppSettingsKeys = (
  current: AppSettingsLike,
  initial: AppSettingsLike,
  fields: readonly string[] = APP_SETTINGS_FORM_FIELDS,
) => {
  const changedKeys = new Set<string>();

  for (const field of fields) {
    const currentValue = normalizeComparableSettingValue(read(current, field));
    const initialValue = normalizeComparableSettingValue(read(initial, field));

    if (
      typeof currentValue === 'object' ||
      typeof initialValue === 'object'
    ) {
      if (JSON.stringify(currentValue) !== JSON.stringify(initialValue)) {
        changedKeys.add(field);
      }
      continue;
    }

    if (currentValue !== initialValue) changedKeys.add(field);
  }

  return changedKeys;
};

export const buildAppSettingsUpdatePayload = (
  data: AppSettingsLike,
  includeKeys?: Iterable<string>,
): AppSettingsUpdatePayload => {
  const included = includeKeys ? new Set(includeKeys) : null;
  const shouldInclude = (key: string) => !included || included.has(key);
  const payload: AppSettingsUpdatePayload = {};

  if (shouldInclude('restaurantName')) {
    payload.restaurantName = sanitizeLimitedText(
      read(data, 'restaurantName'),
      MAX_ESTABLISHMENT_NAME_LENGTH,
    );
  }

  if (shouldInclude('restaurantDescription')) {
    payload.restaurantDescription = sanitizeLimitedText(
      read(data, 'restaurantDescription'),
      MAX_ESTABLISHMENT_TAGLINE_LENGTH,
    );
  }

  if (shouldInclude('restaurantAddress')) {
    payload.restaurantAddress = sanitizeLimitedText(
      read(data, 'restaurantAddress'),
      MAX_ESTABLISHMENT_ADDRESS_LENGTH,
    );
  }

  if (shouldInclude('taxIdNumber')) {
    payload.taxIdNumber = sanitizeDigits(
      read(data, 'taxIdNumber'),
      MAX_ESTABLISHMENT_TAX_ID_LENGTH,
    );
  }

  if (shouldInclude('farewellMessage')) {
    payload.farewellMessage = sanitizeLimitedText(
      read(data, 'farewellMessage'),
      MAX_RECEIPT_FAREWELL_LENGTH,
    );
  }

  if (shouldInclude('taxRate')) {
    payload.taxRate = clampTaxRatePercent(read(data, 'taxRate')) / 100;
  }

  if (shouldInclude('serviceChargeEnabled')) {
    payload.serviceChargeEnabled = Boolean(read(data, 'serviceChargeEnabled'));
  }

  if (shouldInclude('serviceChargeName')) {
    payload.serviceChargeName = sanitizeLimitedText(
      read(data, 'serviceChargeName') || 'Service Charge',
      MAX_SERVICE_CHARGE_NAME_LENGTH,
    );
  }

  if (shouldInclude('serviceChargeType')) {
    payload.serviceChargeType =
      read(data, 'serviceChargeType') === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
  }

  if (shouldInclude('serviceChargeValue')) {
    payload.serviceChargeValue = normalizeServiceChargeValue(read(data, 'serviceChargeValue'));
  }

  if (shouldInclude('serviceChargeTaxable')) {
    payload.serviceChargeTaxable = Boolean(read(data, 'serviceChargeTaxable'));
  }

  if (shouldInclude('serviceChargeAutoApply')) {
    payload.serviceChargeAutoApply = read(data, 'serviceChargeAutoApply') !== false;
  }

  if (shouldInclude('serviceChargeAllowCashierOverride')) {
    payload.serviceChargeAllowCashierOverride = Boolean(
      read(data, 'serviceChargeAllowCashierOverride'),
    );
  }

  if (shouldInclude('holdOrderTableCount')) {
    payload.holdOrderTableCount = normalizeHoldOrderTableCount(
      read(data, 'holdOrderTableCount'),
    );
  }

  const currency = optionalStringOrNull(data, 'currency', 12);
  if (shouldInclude('currency') && currency) payload.currency = currency.toUpperCase();

  const logo = optionalStringOrNull(data, 'logo', URL_LIMIT);
  if (shouldInclude('logo') && logo !== undefined) payload.logo = logo;

  const receiptLogo = optionalStringOrNull(data, 'receiptLogo', URL_LIMIT);
  if (shouldInclude('receiptLogo') && receiptLogo !== undefined)
    payload.receiptLogo = receiptLogo;

  const openingTime = optionalStringOrNull(data, 'openingTime', 60);
  if (shouldInclude('openingTime') && openingTime !== undefined)
    payload.openingTime = openingTime;

  const closingTime = optionalStringOrNull(data, 'closingTime', 60);
  if (shouldInclude('closingTime') && closingTime !== undefined)
    payload.closingTime = closingTime;

  if (shouldInclude('loyaltyConfig') && hasOwn(data, 'loyaltyConfig'))
    payload.loyaltyConfig = read(data, 'loyaltyConfig');

  const showRestaurantName = optionalBoolean(data, 'showRestaurantName');
  if (shouldInclude('showRestaurantName') && showRestaurantName !== undefined)
    payload.showRestaurantName = showRestaurantName;

  const showBusinessName = optionalBoolean(data, 'showBusinessName');
  if (shouldInclude('showBusinessName') && showBusinessName !== undefined)
    payload.showBusinessName = showBusinessName;

  const showLogoOnReceipt = optionalBoolean(data, 'showLogoOnReceipt');
  if (shouldInclude('showLogoOnReceipt') && showLogoOnReceipt !== undefined)
    payload.showLogoOnReceipt = showLogoOnReceipt;

  const showDescription = optionalBoolean(data, 'showDescription');
  if (shouldInclude('showDescription') && showDescription !== undefined)
    payload.showDescription = showDescription;

  const showAddress = optionalBoolean(data, 'showAddress');
  if (shouldInclude('showAddress') && showAddress !== undefined)
    payload.showAddress = showAddress;

  const showTaxId = optionalBoolean(data, 'showTaxId');
  if (shouldInclude('showTaxId') && showTaxId !== undefined)
    payload.showTaxId = showTaxId;

  const showFarewellMessage = optionalBoolean(data, 'showFarewellMessage');
  if (shouldInclude('showFarewellMessage') && showFarewellMessage !== undefined)
    payload.showFarewellMessage = showFarewellMessage;

  const invoiceStartNumber = optionalNumberOrNull(data, 'invoiceStartNumber');
  if (shouldInclude('invoiceStartNumber') && invoiceStartNumber !== undefined)
    payload.invoiceStartNumber = invoiceStartNumber;

  return payload;
};

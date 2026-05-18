import { TEXT_INPUT_LIMITS, type TextInputLimitKey } from '../config/textLimits';

type LimitInput = TextInputLimitKey | number | undefined | null;

const ATTRIBUTE_MATCHERS: Array<[RegExp, TextInputLimitKey]> = [
  [/(refund|return).*reason|reason.*(refund|return)/, 'REFUND_REASON'],
  [/(cash|pay.?in|pay.?out|drawer|shift).*reason|reason.*(cash|pay.?in|pay.?out|drawer|shift)/, 'CASH_REASON'],
  [/(farewell|footer|receipt.*message|message.*receipt)/, 'RECEIPT_FAREWELL'],
  [/(receipt.*address|address.*receipt)/, 'RECEIPT_ADDRESS'],
  [/(receipt.*description|description.*receipt|business.*description|restaurant.*description|store.*description)/, 'RECEIPT_DESCRIPTION'],
  [/(description|about|details|summary)/, 'ITEM_DESCRIPTION'],
  [/(note|notes|comment|comments)/, 'QUICK_NOTE'],
  [/(product|item).*name|name.*(product|item)|sku|barcode/, 'PRODUCT_NAME'],
  [/(category).*name|name.*category/, 'CATEGORY_NAME'],
  [/(attribute|addon|add.?on|modifier|option|subattribute).*name|name.*(attribute|addon|add.?on|modifier|option|subattribute)/, 'ATTRIBUTE_NAME'],
  [/(card.?type|cardtype).*name|name.*card.?type/, 'CARD_TYPE_NAME'],
  [/(payment).*name|name.*payment/, 'PAYMENT_NAME'],
  [/(discount|coupon|promo).*name|name.*(discount|coupon|promo)/, 'DISCOUNT_NAME'],
  [/(business|store|restaurant|location|establishment|brand).*name|name.*(business|store|restaurant|location|establishment|brand)/, 'BUSINESS_NAME'],
  [/^\s*name\s*$/, 'PERSON_NAME'],
  [/(first.?name|last.?name|full.?name|customer.?name|employee.?name|staff.?name|owner.?name|cardholder|card.?name)/, 'PERSON_NAME'],
  [/(username|user.?name)/, 'USERNAME'],
  [/(login|identifier|establishment.?login|location.?login|store.?id|establishment.?id)/, 'LOGIN_IDENTIFIER'],
  [/(email|e.?mail)/, 'EMAIL'],
  [/(phone|mobile|tel|whatsapp)/, 'PHONE'],
  [/(url|website|link|logo|image)/, 'URL'],
  [/(tax.?id|tax.?number|vat)/, 'TAX_ID'],
  [/(tax.?rate|percent|percentage|discount.?percentage)/, 'TAX_RATE'],
  [/(quantity|stock|count|threshold|points|uses|qty)/, 'QUANTITY'],
  [/(price|cost|amount|total|balance|revenue|payment|value|fee)/, 'AMOUNT'],
  [/(port)/, 'PORT'],
  [/(ip.?address|host)/, 'IP_ADDRESS'],
  [/(unit)/, 'UNIT'],
];

export function resolveTextLimit(limit: LimitInput): number {
  if (typeof limit === 'number') {
    return Math.max(0, limit);
  }

  if (limit && limit in TEXT_INPUT_LIMITS) {
    return TEXT_INPUT_LIMITS[limit];
  }

  return TEXT_INPUT_LIMITS.DEFAULT;
}

export function limitText(value: string, limit?: LimitInput): string {
  return value.slice(0, resolveTextLimit(limit));
}

export function getLimitKeyForField(fieldName?: string | null, inputType?: string | null): TextInputLimitKey {
  const normalized = `${fieldName || ''} ${inputType || ''}`
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();

  if (/\bpassword\b/.test(normalized)) return 'PASSWORD';
  if (/\b(email|e mail)\b/.test(normalized)) return 'EMAIL';
  if (/\b(tel|phone|mobile)\b/.test(normalized)) return 'PHONE';
  if (/\b(url|website)\b/.test(normalized)) return 'URL';

  for (const [pattern, key] of ATTRIBUTE_MATCHERS) {
    if (pattern.test(normalized)) {
      return key;
    }
  }

  return 'DEFAULT';
}

export function getLimitForField(fieldName?: string | null, inputType?: string | null): number {
  return TEXT_INPUT_LIMITS[getLimitKeyForField(fieldName, inputType)];
}

function sanitizeStringValue(key: string, value: string): string {
  return limitText(value, getLimitKeyForField(key));
}

export function sanitizeTextPayload<T>(payload: T): T {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (typeof FormData !== 'undefined' && payload instanceof FormData) {
    const next = new FormData();
    payload.forEach((value, key) => {
      next.append(key, typeof value === 'string' ? sanitizeStringValue(key, value) : value);
    });
    return next as T;
  }

  if (Array.isArray(payload)) {
    return payload.map((entry) => sanitizeTextPayload(entry)) as T;
  }

  const source = payload as Record<string, unknown>;
  const next: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      next[key] = sanitizeStringValue(key, value);
    } else if (value && typeof value === 'object') {
      next[key] = sanitizeTextPayload(value);
    } else {
      next[key] = value;
    }
  }

  return next as T;
}

function getElementDescriptor(element: HTMLInputElement | HTMLTextAreaElement): string {
  const labels = element.labels
    ? Array.from(element.labels).map((label) => label.textContent || '').join(' ')
    : '';

  return [
    element.name,
    element.id,
    element.type,
    element.inputMode,
    element.placeholder,
    element.getAttribute('aria-label'),
    element.getAttribute('data-field'),
    labels,
  ].filter(Boolean).join(' ');
}

export function getElementTextLimit(element: HTMLInputElement | HTMLTextAreaElement): number {
  const explicit = element.getAttribute('data-text-limit');
  if (explicit) {
    const numeric = Number(explicit);
    if (Number.isFinite(numeric)) return Math.max(0, numeric);
    if (explicit in TEXT_INPUT_LIMITS) return TEXT_INPUT_LIMITS[explicit as TextInputLimitKey];
  }

  return getLimitForField(getElementDescriptor(element), element.type);
}

export function isTextLimitedElement(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return false;
  }

  if (target instanceof HTMLTextAreaElement) {
    return true;
  }

  const type = (target.type || 'text').toLowerCase();
  return [
    'text',
    'search',
    'email',
    'password',
    'tel',
    'url',
    'number',
  ].includes(type);
}

export function applyElementTextLimit(element: HTMLInputElement | HTMLTextAreaElement): void {
  const current = element.maxLength;
  const descriptor = getElementDescriptor(element);
  const hasUsefulExplicitLimit = current > 0 && current < 255;
  const hasIntentionalLongLimit =
    current > 255 &&
    /(support|ticket|message|reply|discussion|idea|feedback|article)/i.test(descriptor);
  const limit = hasUsefulExplicitLimit || hasIntentionalLongLimit ? current : getElementTextLimit(element);

  element.maxLength = limit;
  if (element.value.length > limit) {
    element.value = element.value.slice(0, limit);
  }
}

/**
 * Hybrid ATM + decimal entry for tax / service-charge percent (and fixed-amount) fields.
 *
 * ATM style is preserved: typing digits only shifts them right-to-left
 * ("5" -> 0.05, "50" -> 0.50, "1600" -> 16.00) and the field always displays
 * two decimals. Typing a decimal dot switches the field into decimal mode,
 * so fractional values like 0.5 or 2.75 can be entered exactly; decimal mode
 * lasts until the field is cleared or blurred.
 *
 * The state machine exists because a naively controlled `toFixed(2)` display
 * reformats mid-typing: typing "0.5" digit-by-digit would snap to "0.00"
 * after the dot and then read "5" as ATM cents (0.05). Tracking whether the
 * user typed a dot disambiguates "append a digit" (ATM shift) from
 * "continue a decimal" (exact fraction).
 */

/** 100.00% in cents — the max for percent fields. */
export const MAX_PERCENT_CENTS = 10000;
/** 1,000,000.00 in cents — the max for fixed-amount fields. */
export const MAX_FIXED_AMOUNT_CENTS = 100000000;

export interface AtmAmountEdit {
  /** Text to display in the input. */
  text: string;
  /** Committed value in cents (percent * 100, or amount * 100). */
  cents: number;
  /** True once the user typed a dot — free decimal typing until blur/clear. */
  decimalMode: boolean;
}

export const formatAtmCents = (cents: number): string =>
  (Math.max(0, Math.round(cents)) / 100).toFixed(2);

const digitsOnly = (value: string): string => value.replace(/\D/g, '');

const normalizeIntPart = (intPart: string): string => {
  const stripped = digitsOnly(intPart).replace(/^0+(?=\d)/, '');
  return stripped === '' ? '0' : stripped;
};

interface DecimalParsed {
  cents: number;
  text: string;
}

/**
 * Parse with the FIRST dot as the separator (complete/pasted values).
 * Returns null when the text has 3+ decimals, isn't a number, or exceeds max.
 */
function parseFirstDotDecimal(raw: string, maxCents: number): DecimalParsed | null {
  let cleaned = raw.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  if (cleaned === '' || cleaned === '.') return null;
  const dotAt = cleaned.indexOf('.');
  const intPart = normalizeIntPart(dotAt === -1 ? cleaned : cleaned.slice(0, dotAt));
  const fracPart = dotAt === -1 ? '' : cleaned.slice(dotAt + 1);
  if (fracPart.length > 2) return null;
  const value = fracPart ? Number(`${intPart}.${fracPart}`) : Number(intPart);
  if (!Number.isFinite(value) || value < 0) return null;
  const cents = Math.round(value * 100);
  if (cents > maxCents) return null;
  return { cents, text: dotAt === -1 ? intPart : `${intPart}.${fracPart}` };
}

/**
 * Parse with the LAST dot as the separator. Used when the user types a dot
 * into an already-formatted display (e.g. "0.00" + "." + "5" -> "0.5"),
 * where the display's own dot must not swallow the freshly typed one.
 */
function parseLastDotDecimal(raw: string, maxCents: number): DecimalParsed | null {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastDot === -1) return null;
  const intPart = normalizeIntPart(cleaned.slice(0, lastDot));
  const fracPart = cleaned.slice(lastDot + 1);
  if (fracPart.length > 2) return null;
  const value = fracPart ? Number(`${intPart}.${fracPart}`) : Number(intPart);
  if (!Number.isFinite(value) || value < 0) return null;
  const cents = Math.round(value * 100);
  if (cents > maxCents) return null;
  return { cents, text: `${intPart}.${fracPart}` };
}

/**
 * Is `raw` just the previous display with one digit appended/removed
 * (or untouched)? Then the dot (if any) is the display's formatting dot
 * and the change is an ATM shift — not a freshly typed decimal.
 */
function isAtmContinuation(raw: string, prevText: string): boolean {
  const dotCount = (raw.match(/\./g) || []).length;
  if (dotCount > 1) return false;
  if (dotCount === 1 && raw.indexOf('.') !== prevText.indexOf('.')) return false;
  const rawDigits = digitsOnly(raw);
  const prevDigits = digitsOnly(prevText);
  if (rawDigits === prevDigits) return true;
  if (rawDigits.length === prevDigits.length + 1 && rawDigits.startsWith(prevDigits)) return true;
  if (rawDigits.length + 1 === prevDigits.length && prevDigits.startsWith(rawDigits)) return true;
  return false;
}

export function initAtmAmountEdit(value: number, maxCents: number = MAX_PERCENT_CENTS): AtmAmountEdit {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  const cents = Math.min(Math.round(safe * 100), maxCents);
  return { text: formatAtmCents(cents), cents, decimalMode: false };
}

export function changeAtmAmountEdit(
  prev: AtmAmountEdit,
  raw: string,
  maxCents: number = MAX_PERCENT_CENTS,
): AtmAmountEdit {
  if (raw === '') return { text: '', cents: 0, decimalMode: false };
  if (digitsOnly(raw) === '') return { text: '.', cents: 0, decimalMode: true };

  // Already in decimal mode and the dot is still there: exact decimal typing.
  if (prev.decimalMode && raw.includes('.')) {
    const parsed = parseFirstDotDecimal(raw, maxCents);
    if (!parsed) return prev; // 3rd decimal / over max -> swallow the keystroke
    return { text: parsed.text, cents: parsed.cents, decimalMode: true };
  }

  // Digit-only input (or decimal mode after the dot was deleted): pure ATM.
  if (!raw.includes('.')) {
    const cents = Number.parseInt(digitsOnly(raw), 10);
    if (!Number.isFinite(cents) || cents > maxCents) return prev;
    return { text: formatAtmCents(cents), cents, decimalMode: false };
  }

  // Dotted input, ATM mode: appended/removed digit on the formatted display
  // keeps shifting; a dot anywhere else enters decimal mode.
  if (isAtmContinuation(raw, prev.text)) {
    const cents = Number.parseInt(digitsOnly(raw), 10);
    if (!Number.isFinite(cents) || cents > maxCents) return prev;
    return { text: formatAtmCents(cents), cents, decimalMode: false };
  }

  const parsed = parseLastDotDecimal(raw, maxCents);
  if (!parsed) {
    // Too many decimals after the new dot (e.g. pasted "0.555"): fall back
    // to reading the digits ATM-style so the entry still shifts predictably.
    const cents = Number.parseInt(digitsOnly(raw), 10);
    if (!Number.isFinite(cents) || cents > maxCents) return prev;
    return { text: formatAtmCents(cents), cents, decimalMode: false };
  }
  return { text: parsed.text, cents: parsed.cents, decimalMode: true };
}

/** On blur the field always snaps back to the formatted ATM display. */
export function blurAtmAmountEdit(prev: AtmAmountEdit): AtmAmountEdit {
  if (prev.text === '') return { text: '', cents: 0, decimalMode: false };
  return { text: formatAtmCents(prev.cents), cents: prev.cents, decimalMode: false };
}

export function toSentenceCase(value: string, locale = 'en'): string {
  if (!value || locale.toLowerCase().startsWith('ar') || !/[A-Za-z]/.test(value)) {
    return value;
  }

  const characters = Array.from(value);
  const firstLetterIndex = characters.findIndex((character) => /[A-Za-z]/.test(character));

  if (firstLetterIndex === -1) {
    return value;
  }

  const result = characters
    .map((character, index) => {
      if (!/[A-Za-z]/.test(character)) {
        return character;
      }

      return index === firstLetterIndex ? character.toUpperCase() : character.toLowerCase();
    })
    .join('');

  // Always preserve Mintcom capitalization
  return result.replace(/mintcom/gi, 'Mintcom');
}


const TITLE_CASE_SMALL_WORDS = new Set([
  'a', 'an', 'the',
  'and', 'but', 'or', 'nor',
  'for', 'yet', 'so',
  'at', 'by', 'in', 'of', 'on', 'to', 'as',
  'if', 'vs', 'via', 'with', 'from', 'into', 'over', 'per',
]);

const TITLE_CASE_PRESERVED_WORDS = new Map<string, string>([
  ['pos', 'POS'],
  ['qr', 'QR'],
  ['id', 'ID'],
  ['ids', 'IDs'],
  ['ui', 'UI'],
  ['api', 'API'],
  ['csv', 'CSV'],
  ['pdf', 'PDF'],
  ['crm', 'CRM'],
  ['cvv', 'CVV'],
  ['usd', 'USD'],
  ['ios', 'iOS'],
  ['ipad', 'iPad'],
  ['android', 'Android'],
  ['mintcom', 'Mintcom'],
  ['q&a', 'Q&A'],
  ['faq', 'FAQ'],
  ['llc', 'LLC'],
  ['atm', 'ATM'],
  ['sms', 'SMS'],
  ['url', 'URL'],
  ['yoy', 'YoY'],
  ['csat', 'CSAT'],
  ['ai', 'AI'],
  ['visa', 'Visa'],
  ['mastercard', 'Mastercard'],
  ['amex', 'Amex'],
  ['discover', 'Discover'],
  ['mada', 'Mada'],
  ['jcb', 'JCB'],
  ['unionpay', 'UnionPay'],
  ['maestro', 'Maestro'],
]);

const TITLE_CASE_PRESERVED_PHRASES = new Map<string, string>([
  ['all-in-one', 'All-in-One'],
  ['real-time', 'Real-Time'],
  ['point-of-sale', 'Point-of-Sale'],
  ['most-read', 'Most-Read'],
  ['step-by-step', 'Step-by-Step'],
  ['in-sync', 'In-Sync'],
  ['performance-driven', 'Performance-Driven'],
  ['customer-facing', 'Customer-Facing'],
  ['multi-branch', 'Multi-Branch'],
  ['enterprise-grade', 'Enterprise-Grade'],
  ['cloud-based', 'Cloud-Based'],
  ['web-based', 'Web-Based'],
  ['role-based', 'Role-Based'],
  ['time-bound', 'Time-Bound'],
  ['date-based', 'Date-Based'],
  ['owner-level', 'Owner-Level'],
  ['brand-level', 'Brand-Level'],
  ['establishment-level', 'Establishment-Level'],
  ['back-office', 'Back-Office'],
  ['high-impact', 'High-Impact'],
  ['non-card', 'Non-Card'],
  ['256-bit', '256-Bit'],
]);

function capitalizeWordSegment(segment: string): string {
  const lowerSegment = segment.toLowerCase();

  if (TITLE_CASE_PRESERVED_WORDS.has(lowerSegment)) {
    return TITLE_CASE_PRESERVED_WORDS.get(lowerSegment)!;
  }

  if (/^\{\{.*\}\}$/.test(segment)) {
    return segment;
  }

  if (/^\d+[a-z]+$/i.test(segment)) {
    return segment.replace(/[a-z]+$/i, (suffix) => suffix.charAt(0).toUpperCase() + suffix.slice(1).toLowerCase());
  }

  if (segment.length > 1 && segment === segment.toUpperCase() && /[A-Z]/.test(segment)) {
    return segment;
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

function capitalizeTitleWord(word: string, forceCapitalize: boolean): string {
  const lowerWord = word.toLowerCase();

  if (TITLE_CASE_PRESERVED_PHRASES.has(lowerWord)) {
    return TITLE_CASE_PRESERVED_PHRASES.get(lowerWord)!;
  }

  const match = word.match(/^([^A-Za-z0-9{]*)(.*?)([^A-Za-z0-9}]*?)$/);

  if (!match) {
    return word;
  }

  const [, leading, core, trailing] = match;

  if (!core) {
    return word;
  }

  const lowerCore = core.toLowerCase();

  if (!forceCapitalize && TITLE_CASE_SMALL_WORDS.has(lowerCore)) {
    return `${leading}${lowerCore}${trailing}`;
  }

  if (TITLE_CASE_PRESERVED_WORDS.has(lowerCore)) {
    return `${leading}${TITLE_CASE_PRESERVED_WORDS.get(lowerCore)}${trailing}`;
  }

  const parts = core.split(/(-|\/)/);
  const converted = parts
    .map((part, index) => {
      if (part === '-' || part === '/') {
        return part;
      }

      const lowerPart = part.toLowerCase();
      const previousPart = parts[index - 1];
      const nextPart = parts[index + 1];
      const forcePart =
        forceCapitalize ||
        index === 0 ||
        index === parts.length - 1 ||
        previousPart === '/' ||
        nextPart === '/';

      if (!forcePart && TITLE_CASE_SMALL_WORDS.has(lowerPart)) {
        return lowerPart;
      }

      return capitalizeWordSegment(part);
    })
    .join('');

  return `${leading}${converted}${trailing}`;
}

export function toTitleCase(value: string | null | undefined, locale = 'en'): string {
  if (!value || locale.toLowerCase().startsWith('ar') || !/[A-Za-z]/.test(value)) {
    return value || '';
  }

  const words = value.trim().split(/\s+/);

  const result = words
    .map((word, index) => {
      const forceCapitalize = index === 0 || index === words.length - 1;
      return capitalizeTitleWord(word, forceCapitalize);
    })
    .join(' ');

  return result
    .replace(/mintcom/gi, 'Mintcom')
    .replace(/\b(Log|Sign) in\b/g, '$1 In')
    .replace(/\bSet up\b/g, 'Set Up');
}

export function formatInputLabel(value: string | null | undefined, locale = 'en'): string {
  return toTitleCase(value, locale);
}

// Sample emails and URLs are literal values, so leave their casing untouched.
const LITERAL_PLACEHOLDER_PATTERN = /^\s*(?:[^\s@]+@[^\s@]+\.[^\s@]+|(?:https?:\/\/|www\.)\S+)\s*$/i;

export function formatInputPlaceholder(value: string | null | undefined, locale = 'en'): string {
  const placeholder = value || '';

  if (LITERAL_PLACEHOLDER_PATTERN.test(placeholder)) {
    return placeholder;
  }

  return toSentenceCase(placeholder, locale);
}

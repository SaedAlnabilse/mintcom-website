/**
 * POS header maps + forgiving normalizers for "Switch from another POS".
 *
 * Real-world Foodics / Loyverse / Square exports are dirty:
 * - Arabic headers (اسم المنتج, السعر, التصنيف)
 * - Eastern Arabic-Indic numerals (١٢.٥)
 * - Currency text inside price cells ("15.00 SAR", "15 ر.س")
 * - "Free" / "مجاني" prices, comma decimals, stray spaces
 *
 * Strategy: fuzzy-match headers first, then normalize values forgivingly
 * instead of rejecting the whole file on row 1.
 */

export type SourceId = 'foodics' | 'loyverse' | 'square' | 'other' | 'mintcom';

export interface MappedProductRow {
  name: string;
  price: string; // normalized numeric string ("12.50")
  cost_price: string;
  category: string;
  description: string;
  addons: string;
  track_stock: string;
  available_stock: string;
  /** 1-indexed source row number for error messages */
  _rowNum: number;
}

const AR_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const EAST_INDIC_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toWesternDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(AR_INDIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EAST_INDIC_DIGITS.indexOf(d)));
}

/** "Free" / "مجاني" / empty helpers */
const FREE_TOKENS = new Set(['free', 'مجاني', 'مجانا', 'gratis', 'gratuit']);

export function normalizePrice(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? raw : null;
  }
  if (raw === null || raw === undefined) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = toWesternDigits(s).toLowerCase();
  if (FREE_TOKENS.has(s)) return 0;
  // Strip currency words/symbols, keep digits, dot, comma, minus
  s = s
    .replace(/ر\.?\s*س\.?|sar|sr|s\.r|جنيه|دينار|درهم|₪|\$|€|£/g, '')
    .trim();
  if (FREE_TOKENS.has(s)) return 0;
  // "1,250.50" (thousands) vs "12,50" (comma decimal): if single comma and
  // no dot, treat comma as decimal separator.
  const commas = (s.match(/,/g) || []).length;
  const dots = (s.match(/\./g) || []).length;
  if (commas === 1 && dots === 0) s = s.replace(',', '.');
  else s = s.replace(/,/g, '');
  s = s.replace(/[^0-9.-]/g, '');
  if (!s || s === '.' || s === '-') return null;
  const n = parseFloat(s);
  if (Number.isNaN(n) || n < 0 || !Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

export function normalizeText(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw).replace(/\u00a0/g, ' ').trim().replace(/\s+/g, ' ');
}

/** Canonical fields we map into. */
type FieldKey = 'name' | 'price' | 'cost_price' | 'category' | 'description' | 'addons' | 'sku' | 'stock';

/** Header aliases per field: English + Arabic + POS-specific names. */
const FIELD_ALIASES: Record<FieldKey, string[]> = {
  name: [
    'name', 'product_name', 'productname', 'item', 'item_name', 'itemname',
    'title', 'product', 'dish',
    'اسم', 'اسم_المنتج', 'اسم_الصنف', 'الاسم', 'المنتج', 'الصنف', 'اسم_المادة',
    'foodics_name', 'product name (english)', 'product name (arabic)',
  ],
  price: [
    'price', 'selling_price', 'sellingprice', 'retail', 'retail_price',
    'sale_price', 'unit_price', 'unitprice', 'amount', 'cost',
    'السعر', 'سعر', 'سعر_البيع', 'سعر_المنتج', 'المبلغ', 'الثمن',
    'price (sar)', 'price_sar', 'default price',
  ],
  cost_price: [
    'cost_price', 'costprice', 'cost', 'purchase_price', 'buy_price',
    'التكلفة', 'سعر_التكلفة', 'سعر_الشراء',
  ],
  category: [
    'category', 'group', 'group_name', 'menu', 'menu_name', 'section',
    'department', 'collection', 'type',
    'التصنيف', 'الفئة', 'المجموعة', 'القسم', 'التصنيف_الرئيسي', 'قسم',
    'category name',
  ],
  description: [
    'description', 'desc', 'details', 'notes',
    'الوصف', 'وصف', 'تفاصيل', 'ملاحظات',
  ],
  addons: [
    'addons', 'add_ons', 'add-ons', 'modifiers', 'extras', 'options',
    'variants', 'choices', 'additions',
    'الإضافات', 'اضافات', 'المعدلات', 'الخيارات',
    'modifier groups',
  ],
  sku: [
    'sku', 'code', 'barcode', 'bar_code', 'item_code', 'product_code',
    'reference', 'ref', 'plu',
    'الباركود', 'الرمز', 'رمز', 'كود', 'رقم_الصنف',
  ],
  stock: [
    'stock', 'available_stock', 'quantity', 'qty', 'inventory', 'on_hand',
    'المخزون', 'الكمية', 'كمية', 'مخزون',
  ],
};

function normHeader(h: string): string {
  return toWesternDigits(String(h || ''))
    .trim()
    .toLowerCase()
    .replace(/["'`]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function scoreAlias(header: string, alias: string): number {
  if (header === alias) return 100;
  if (header.replace(/_\(.*\)$/, '') === alias) return 90; // "price_(sar)" -> "price"
  if (header.startsWith(alias + '_') || header.endsWith('_' + alias)) return 70;
  if (header.includes(alias) && alias.length >= 4) return 50;
  if (alias.includes(header) && header.length >= 4) return 40;
  return 0;
}

/** Map raw headers -> canonical field. Returns mapping + detected source. */
export function mapHeaders(rawHeaders: string[]): {
  mapping: Partial<Record<FieldKey, number>>;
  detectedSource: SourceId;
  unmatched: string[];
} {
  const headers = rawHeaders.map(normHeader);
  const mapping: Partial<Record<FieldKey, number>> = {};
  const used = new Set<number>();

  (Object.keys(FIELD_ALIASES) as FieldKey[]).forEach((field) => {
    let best = -1;
    let bestScore = 0;
    headers.forEach((h, i) => {
      if (used.has(i)) return;
      for (const alias of FIELD_ALIASES[field]) {
        const s = scoreAlias(h, normHeader(alias));
        if (s > bestScore) {
          bestScore = s;
          best = i;
        }
      }
    });
    if (best >= 0 && bestScore >= 40) {
      mapping[field] = best;
      used.add(best);
    }
  });

  const unmatched = headers.filter((_, i) => !used.has(i));
  return { mapping, detectedSource: detectSource(headers), unmatched };
}

/** Heuristic POS detection from header names. */
export function detectSource(headers: string[]): SourceId {
  const joined = headers.join(' ');
  if (/foodics|تطبيق_فودكس/.test(joined)) return 'foodics';
  if (/loyverse/.test(joined)) return 'loyverse';
  if (/square|token|square_id/.test(joined)) return 'square';
  // Foodics exports often have these exact columns
  if (/modifier/.test(joined) && /inclusive|exclusive|tax/.test(joined)) return 'foodics';
  if (headers.some((h) => /[؀-ۿ]/.test(h))) return 'foodics'; // Arabic headers -> likely Foodics/Saudi
  if (/item_name|category.*name|price.*book/.test(joined)) return 'loyverse';
  return 'other';
}

export interface CoerceResult {
  row: MappedProductRow;
  warnings: string[]; // non-fatal notes, e.g. price "Free" -> 0
  errors: string[]; // fatal for this row
}

/** Coerce one raw record (array or object) into a Mintcom product row. */
export function coerceRow(
  record: string[] | Record<string, string>,
  mapping: Partial<Record<FieldKey, number>>,
  headers: string[],
  rowNum: number,
): CoerceResult {
  const get = (f: FieldKey): string => {
    const idx = mapping[f];
    if (idx === undefined) return '';
    if (Array.isArray(record)) return normalizeText(record[idx]);
    return normalizeText(record[headers[idx]] ?? '');
  };

  const warnings: string[] = [];
  const errors: string[] = [];

  const name = get('name');
  let category = get('category');
  const description = get('description');
  const addons = get('addons');
  const stockRaw = get('stock');
  const costRaw = get('cost_price');
  const priceRaw = get('price');

  if (!name) errors.push(`Row ${rowNum}: product name is missing`);

  if (!category) {
    category = 'Uncategorized';
    warnings.push(`Row ${rowNum}: no category — will use "Uncategorized"`);
  }

  let priceNum: number | null = null;
  if (!priceRaw) {
    errors.push(`Row ${rowNum}: price is missing`);
  } else {
    const lowered = toWesternDigits(priceRaw).trim().toLowerCase();
    if (FREE_TOKENS.has(lowered)) {
      priceNum = 0;
      warnings.push(`Row ${rowNum}: price "${priceRaw}" treated as 0`);
    } else {
      priceNum = normalizePrice(priceRaw);
      if (priceNum === null) errors.push(`Row ${rowNum}: price "${priceRaw}" is not a valid number`);
    }
  }

  let costNum: string = '';
  if (costRaw) {
    const c = normalizePrice(costRaw);
    if (c !== null) costNum = String(c);
    else warnings.push(`Row ${rowNum}: cost "${costRaw}" ignored (not a number)`);
  }

  let trackStock = 'false';
  let availableStock = '';
  if (stockRaw) {
    const n = normalizePrice(stockRaw);
    if (n !== null && Number.isInteger(n)) {
      trackStock = 'true';
      availableStock = String(n);
    }
  }

  return {
    row: {
      name,
      price: priceNum !== null ? String(priceNum) : '',
      cost_price: costNum,
      category,
      description,
      addons,
      track_stock: trackStock,
      available_stock: availableStock,
      _rowNum: rowNum,
    },
    warnings,
    errors,
  };
}

/** Sample template rows (used by "Try sample" + template download). */
export const SAMPLE_ROWS: string[][] = [
  ['Name', 'Price', 'Category', 'Description', 'Add-ons'],
  ['Cappuccino', '14.50', 'Hot Drinks', 'Classic Italian coffee', 'Size: Small | Medium +1.00 | Large +2.00'],
  ['Iced Latte', '18.00', 'Cold Drinks', 'Chilled espresso with milk', 'Size'],
  ['كابتشينو', '١٤.٥', 'مشروبات ساخنة', 'قهوة إيطالية', ''],
  ['Chocolate Cake', 'Free', 'Desserts', 'Rich chocolate slice', ''],
  ['Chicken Burger', '32 SAR', 'Food', 'Grilled chicken', 'Extras: Cheese +2.50 | Bacon +4.00'],
];

export const MINTOM_TEMPLATE_HEADERS = ['Name', 'Price', 'Cost Price', 'Category', 'Description', 'Add-ons', 'Track Stock', 'Available Stock'];

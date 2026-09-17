import { describe, it, expect } from 'vitest';
import {
  normalizePrice,
  normalizeText,
  mapHeaders,
  detectSource,
  coerceRow,
  SAMPLE_ROWS,
} from './posImportMaps';
import { dryRun, toCsv, type ParsedSheet } from './spreadsheetReader';

describe('posImportMaps - normalizePrice', () => {
  it('handles standard numbers and decimals', () => {
    expect(normalizePrice(12.5)).toBe(12.5);
    expect(normalizePrice('12.50')).toBe(12.5);
    expect(normalizePrice(0)).toBe(0);
    expect(normalizePrice('0')).toBe(0);
  });

  it('converts Eastern Arabic-Indic numerals', () => {
    expect(normalizePrice('١٢.٥')).toBe(12.5);
    expect(normalizePrice('١٠٠')).toBe(100);
    expect(normalizePrice('٠')).toBe(0);
    expect(normalizePrice('٤٥.٧٥')).toBe(45.75);
  });

  it('strips currency symbols and ISO codes (SAR, SR, ر.س, $, etc.)', () => {
    expect(normalizePrice('32 SAR')).toBe(32);
    expect(normalizePrice('15.50 ر.س')).toBe(15.5);
    expect(normalizePrice('SR 99.99')).toBe(99.99);
    expect(normalizePrice('$12.00')).toBe(12);
    expect(normalizePrice('100 جنيه')).toBe(100);
  });

  it('handles "Free" and Arabic equivalents as 0', () => {
    expect(normalizePrice('Free')).toBe(0);
    expect(normalizePrice('free')).toBe(0);
    expect(normalizePrice('مجاني')).toBe(0);
    expect(normalizePrice('مجانا')).toBe(0);
  });

  it('handles European comma decimal vs thousands separator', () => {
    expect(normalizePrice('12,50')).toBe(12.5);
    expect(normalizePrice('1,250.50')).toBe(1250.5);
  });

  it('returns null for invalid or negative numbers', () => {
    expect(normalizePrice('')).toBeNull();
    expect(normalizePrice(null)).toBeNull();
    expect(normalizePrice(undefined)).toBeNull();
    expect(normalizePrice('not-a-price')).toBeNull();
    expect(normalizePrice(-5)).toBeNull();
    expect(normalizePrice('-10.50')).toBeNull();
  });
});

describe('posImportMaps - normalizeText', () => {
  it('cleans up non-breaking spaces and collapses whitespace', () => {
    expect(normalizeText('  Cappuccino\u00a0\u00a0Large  ')).toBe('Cappuccino Large');
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
  });
});

describe('posImportMaps - header mapping and POS detection', () => {
  it('detects Foodics with Arabic and English headers', () => {
    const headers = ['اسم المنتج', 'السعر', 'التصنيف', 'الباركود'];
    const { mapping, detectedSource } = mapHeaders(headers);
    expect(detectedSource).toBe('foodics');
    expect(mapping.name).toBe(0);
    expect(mapping.price).toBe(1);
    expect(mapping.category).toBe(2);
    expect(mapping.sku).toBe(3);
  });

  it('detects Loyverse from item_name and category columns', () => {
    const headers = ['Item name', 'Category', 'Price', 'SKU', 'In stock'];
    const { mapping, detectedSource } = mapHeaders(headers);
    expect(detectedSource).toBe('loyverse');
    expect(mapping.name).toBe(0);
    expect(mapping.category).toBe(1);
    expect(mapping.price).toBe(2);
    expect(mapping.sku).toBe(3);
    expect(mapping.stock).toBe(4);
  });

  it('detects Square from token or square-specific columns', () => {
    expect(detectSource(['token', 'item_name', 'price'])).toBe('square');
  });
});

describe('posImportMaps - coerceRow', () => {
  const headers = ['Name', 'Price', 'Category'];
  const mapping = { name: 0, price: 1, category: 2 };

  it('coerces a valid row cleanly', () => {
    const res = coerceRow(['Latte', '16.00', 'Coffee'], mapping, headers, 2);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(0);
    expect(res.row.name).toBe('Latte');
    expect(res.row.price).toBe('16');
    expect(res.row.category).toBe('Coffee');
  });

  it('falls back to "Uncategorized" when category is missing', () => {
    const res = coerceRow(['Latte', '16.00', ''], mapping, headers, 2);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toContain('Row 2: no category — will use "Uncategorized"');
    expect(res.row.category).toBe('Uncategorized');
  });

  it('coerces "Free" to price 0 with a warning', () => {
    const res = coerceRow(['Tap Water', 'Free', 'Drinks'], mapping, headers, 3);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toContain('Row 3: price "Free" treated as 0');
    expect(res.row.price).toBe('0');
  });

  it('records fatal error if name is missing', () => {
    const res = coerceRow(['', '15.00', 'Drinks'], mapping, headers, 4);
    expect(res.errors).toContain('Row 4: product name is missing');
  });

  it('records fatal error if price is completely invalid', () => {
    const res = coerceRow(['Tea', 'invalid-price', 'Drinks'], mapping, headers, 5);
    expect(res.errors).toContain('Row 5: price "invalid-price" is not a valid number');
  });
});

describe('spreadsheetReader - dryRun & toCsv', () => {
  it('runs dryRun on SAMPLE_ROWS with 100% success', () => {
    const headers = SAMPLE_ROWS[0];
    const records = SAMPLE_ROWS.slice(1);
    const { mapping, detectedSource } = mapHeaders(headers);
    const sheet: ParsedSheet = {
      headers,
      records,
      detectedSource,
      mapping,
    };

    const res = dryRun(sheet);
    expect(res.errors).toHaveLength(0);
    expect(res.validRows.length).toBe(records.length);
    expect(res.stats.valid).toBe(records.length);
    expect(res.stats.invalid).toBe(0);

    // Verify Arabic product row was parsed
    const arRow = res.validRows.find((r) => r.name === 'كابتشينو');
    expect(arRow).toBeDefined();
    expect(arRow?.price).toBe('14.5');
    expect(arRow?.category).toBe('مشروبات ساخنة');

    // Verify "Free" cake became 0
    const cakeRow = res.validRows.find((r) => r.name === 'Chocolate Cake');
    expect(cakeRow).toBeDefined();
    expect(cakeRow?.price).toBe('0');

    // Verify "32 SAR" became 32
    const burgerRow = res.validRows.find((r) => r.name === 'Chicken Burger');
    expect(burgerRow).toBeDefined();
    expect(burgerRow?.price).toBe('32');
  });

  it('serializes CSV escaping quotes and commas correctly', () => {
    const csv = toCsv(['A', 'B'], [['hello, world', 'he said "hi"']]);
    expect(csv).toBe('A,B\n"hello, world","he said ""hi"""');
  });
});

/**
 * Unified spreadsheet ingestion for POS migration.
 * - .csv  -> lightweight built-in parser (handles quotes, BOM, , or ; delimiter)
 * - .xlsx/.xls -> read-excel-file (lazy import, ~35KB gzip, no SheetJS bloat)
 */

import { mapHeaders, coerceRow, type MappedProductRow, type SourceId } from './posImportMaps';

export interface ParsedSheet {
  headers: string[];
  records: string[][];
  detectedSource: SourceId;
  mapping: ReturnType<typeof mapHeaders>['mapping'];
}

export interface DryRunResult {
  headers: string[];
  detectedSource: SourceId;
  validRows: MappedProductRow[];
  warnings: string[];
  errors: string[]; // fatal row errors (row skipped)
  stats: { total: number; valid: number; invalid: number };
}

const MAX_ROWS = 2000;

function stripBom(s: string): string {
  return s.replace(/^\uFEFF/, '');
}

function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const n = line[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === delim) { out.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

function parseCsvText(text: string): { headers: string[]; records: string[][] } {
  const clean = stripBom(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], records: [] };
  // Auto delimiter: first line with more ; than , wins
  const first = lines[0];
  const commas = (first.match(/,/g) || []).length;
  const semis = (first.match(/;/g) || []).length;
  const delim = semis > commas ? ';' : ',';
  const headers = splitLine(first, delim);
  const records = lines.slice(1).map((l) => {
    const cells = splitLine(l, delim);
    // pad/truncate to header width
    while (cells.length < headers.length) cells.push('');
    return cells.slice(0, headers.length);
  }).filter((r) => r.some((c) => c.trim() !== ''));
  return { headers, records };
}

export async function readSpreadsheet(file: File): Promise<ParsedSheet> {
  const ext = file.name.toLowerCase().split('.').pop() || '';
  if (ext === 'csv') {
    const text = await file.text();
    const { headers, records } = parseCsvText(text);
    if (headers.length === 0) throw new Error('No headers found in the CSV file.');
    const { mapping, detectedSource } = mapHeaders(headers);
    return { headers, records, detectedSource, mapping };
  }
  if (ext === 'xlsx' || ext === 'xls') {
    if (file.size > 10 * 1024 * 1024) throw new Error('Excel file exceeds 10MB limit.');
    const { readSheet } = await import('read-excel-file/browser');
    const rows = (await readSheet(file)) as unknown[][];
    if (!rows || rows.length === 0) throw new Error('The Excel file is empty.');
    const headers = (rows[0] as unknown[]).map((c) => String(c ?? '').trim());
    if (headers.every((h) => !h)) throw new Error('No headers found in the first row.');
    const records = (rows.slice(1) as unknown[][])
      .map((r) => headers.map((_, i) => String(r[i] ?? '').trim()))
      .filter((r) => r.some((c) => c !== ''));
    const { mapping, detectedSource } = mapHeaders(headers);
    return { headers, records, detectedSource, mapping };
  }
  throw new Error('Unsupported file type. Upload .csv or .xlsx');
}

/** Forgiving dry-run: map + coerce every row, collect valid / warnings / errors. */
export function dryRun(sheet: ParsedSheet): DryRunResult {
  const mapping = sheet.mapping;
  const warnings: string[] = [];
  const errors: string[] = [];
  const validRows: MappedProductRow[] = [];

  if (mapping.name === undefined) {
    errors.push('Could not find a product-name column. Expected "Name" / "اسم المنتج".');
    return { headers: sheet.headers, detectedSource: sheet.detectedSource, validRows: [], warnings, errors, stats: { total: sheet.records.length, valid: 0, invalid: sheet.records.length } };
  }
  if (mapping.price === undefined) {
    errors.push('Could not find a price column. Expected "Price" / "السعر".');
    return { headers: sheet.headers, detectedSource: sheet.detectedSource, validRows: [], warnings, errors, stats: { total: sheet.records.length, valid: 0, invalid: sheet.records.length } };
  }

  const limited = sheet.records.slice(0, MAX_ROWS);
  if (sheet.records.length > MAX_ROWS) {
    warnings.push(`File has ${sheet.records.length} rows — only the first ${MAX_ROWS} will be imported. Split the file for the rest.`);
  }

  limited.forEach((rec, i) => {
    const { row, warnings: w, errors: e } = coerceRow(rec, mapping, sheet.headers, i + 2);
    warnings.push(...w.slice(0, 1)); // keep noise down; details shown per-row
    if (e.length > 0) errors.push(...e);
    else validRows.push(row);
  });

  return {
    headers: sheet.headers,
    detectedSource: sheet.detectedSource,
    validRows,
    warnings,
    errors,
    stats: { total: limited.length, valid: validRows.length, invalid: limited.length - validRows.length },
  };
}

/** Build CSV text for template / sample / error download. */
export function toCsv(headers: string[], rows: string[][]): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

export { MAX_ROWS };

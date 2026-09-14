import { api } from '../config/api';
import i18n from '../i18n';

/**
 * Utility to export an array of objects to a CSV file and trigger a download.
 * @param data Array of objects representing the rows.
 * @param filename Desired filename (without extension).
 * @param headers Optional custom headers mapping (e.g., { id: 'Id', name: 'Name' }).
 */
export const exportToCSV = (data: any[], filename: string, headers?: Record<string, string>) => {
  if (!data || data.length === 0) {
    return;
  }

  const keys = Object.keys(data[0]);
  const headerRow = (headers ? Object.values(headers) : keys).map(escapeCsv).join(',');

  const rows = data.map(obj => {
    return (headers ? Object.keys(headers) : keys)
      .map(key => escapeCsv(cellValue(obj, key)))
      .join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  triggerDownload(blob, `${slug(filename)}_${todayStamp()}.csv`);
};

// ─── Format-aware export (Excel / PDF / CSV) ───────────────────────────────

export type ExportFormat = 'xlsx' | 'pdf' | 'csv';

/** An ordered column definition: `key` reads the value off each row, `label` is the header text. */
export interface ExportColumn {
  key: string;
  label: string;
}

/** Optional metadata lines rendered above the table (e.g. date range, location). */
export type ExportMeta = { label: string; value: string }[];

export interface ExportSection {
  /** Sheet name (xlsx) / table heading (pdf, csv). */
  name: string;
  columns: ExportColumn[];
  rows: any[];
}

interface ExportTableInput {
  filename?: string;
  title: string;
  columns: ExportColumn[];
  rows: any[];
  meta?: ExportMeta;
}

interface ExportSectionsInput {
  filename?: string;
  title: string;
  sections: ExportSection[];
  meta?: ExportMeta;
}

const todayStamp = () => new Date().toISOString().split('T')[0];

/** Normalize a single cell value to a primitive suitable for a spreadsheet/table. */
export const cellValue = (row: any, key: string): string | number => {
  const value = row?.[key];
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value.name || value.username || JSON.stringify(value);
  }
  return String(value);
};

export const escapeCsv = (value: string | number): string => {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─── Excel ─────────────────────────────────────────────────────────────────

/**
 * One cell in `write-excel-file`'s array-of-arrays form. Blanks are emitted as
 * a null value so Excel shows a genuinely empty cell rather than an empty
 * string, and numbers keep their numeric type so they stay sortable/summable.
 */
export type XlsxCell = { value: string | number | null; type: StringConstructor | NumberConstructor };

export const xlsxCell = (value: string | number): XlsxCell =>
  typeof value === 'number' && Number.isFinite(value)
    ? { value, type: Number }
    : { value: value === '' || (typeof value === 'number' && !Number.isFinite(value)) ? null : value, type: String };

/** Build the rows for one section. `preamble` rows (title/meta) are placed above the table. */
const buildSheetRows = (section: ExportSection, preamble: string[][] = []): XlsxCell[][] => {
  const header = section.columns.map(c => c.label);
  const body = (section.rows || []).map(row => section.columns.map(c => cellValue(row, c.key)));
  return [
    // Preamble rows are intentionally ragged (one cell wide) — that is what
    // puts the title flush left above the table.
    ...preamble.map(r => r.map(v => xlsxCell(v))),
    header.map(h => xlsxCell(h)),
    ...body.map(r => r.map(v => xlsxCell(v))),
  ];
};

/** Auto-size columns to the widest cell (capped so a long string can't blow out the layout). */
export const buildColumnWidths = (section: ExportSection) => {
  const body = (section.rows || []).map(row => section.columns.map(c => cellValue(row, c.key)));
  return section.columns.map((c, i) => {
    let widest = String(c.label).length;
    for (let r = 0; r < body.length; r++) {
      const len = String(body[r][i] ?? '').length;
      if (len > widest) widest = len;
    }
    return { width: Math.min(Math.max(widest + 2, 10), 60) };
  });
};

/** Sanitize a worksheet name for Excel (max 31 chars, no : \ / ? * [ ]). */
export const safeSheetName = (name: string, fallback: string): string => {
  const cleaned = (name || fallback).replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31);
  return cleaned || fallback;
};

const buildXLSX = async (filename: string | undefined, title: string, sections: ExportSection[], meta?: ExportMeta) => {
  // Browser build: pure JS + fflate, returns a Blob. Loaded lazily so the
  // spreadsheet writer is only fetched when someone actually exports.
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const used = new Set<string>();

  const sheets = sections.map((section, idx) => {
    // Prepend a title + meta block above the table on the first sheet only.
    const preamble: string[][] = [];
    if (idx === 0 && (title || (meta && meta.length))) {
      if (title) preamble.push([title]);
      (meta || []).forEach(m => preamble.push([`${m.label}: ${m.value}`]));
      preamble.push([]); // spacer row
    }

    const base = safeSheetName(section.name, `Sheet${idx + 1}`);
    let name = base;
    let suffix = 1;
    while (used.has(name.toLowerCase())) {
      const tag = ` ${++suffix}`;
      name = base.slice(0, 31 - tag.length) + tag;
    }
    used.add(name.toLowerCase());

    return {
      data: buildSheetRows(section, preamble),
      sheet: name,
      columns: buildColumnWidths(section),
    };
  });

  const blob = await writeXlsxFile(sheets as never).toBlob();
  triggerDownload(blob, `${slug(filename || title)}_${todayStamp()}.xlsx`);
};

export const slug = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'export';

// ─── PDF (Server-side via mintcom-api) ────────────────────────────────────────

const buildPDF = async (filename: string | undefined, title: string, sections: ExportSection[], meta?: ExportMeta) => {
  const isRtl =
    (typeof document !== 'undefined' && document.documentElement.dir === 'rtl') ||
    (typeof i18n !== 'undefined' && String(i18n.language).startsWith('ar'));
  const locale = typeof i18n !== 'undefined' ? i18n.language : 'en';

  try {
    const response = await api.post<Blob>(
      '/api/reports/export-pdf',
      {
        title,
        filename,
        locale,
        isRtl,
        meta,
        sections,
        orientation: 'landscape',
      },
      {
        responseType: 'blob',
      },
    );

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadName = `${slug(filename || title)}_${todayStamp()}.pdf`;
    triggerDownload(blob, downloadName);
  } catch (error: any) {
    let message = 'Failed to generate PDF';
    if (error?.response?.data instanceof Blob) {
      try {
        let text = '';
        if (typeof error.response.data.text === 'function') {
          text = await error.response.data.text();
        } else if (typeof FileReader !== 'undefined') {
          text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsText(error.response.data);
          });
        } else if (typeof Response !== 'undefined') {
          text = await new Response(error.response.data).text();
        }
        const parsed = JSON.parse(text);
        const extracted = parsed.message || parsed.error;
        if (Array.isArray(extracted)) {
          message = extracted.join(', ');
        } else if (typeof extracted === 'string') {
          message = extracted;
        }
      } catch {
        // Fallback to default message
      }
    } else if (error?.response?.data?.message) {
      const extracted = error.response.data.message;
      message = Array.isArray(extracted) ? extracted.join(', ') : String(extracted);
    } else if (error instanceof Error) {
      message = error.message;
    }
    console.error('[export] PDF generation failed:', message);
    throw new Error(message);
  }
};

// ─── CSV (multi-section aware) ──────────────────────────────────────────────

const buildCSV = (filename: string | undefined, title: string, sections: ExportSection[], meta?: ExportMeta) => {
  const lines: string[] = [];
  if (title) lines.push(escapeCsv(title));
  (meta || []).forEach(m => lines.push(`${escapeCsv(m.label)},${escapeCsv(m.value)}`));
  if (lines.length) lines.push('');

  sections.forEach((section, idx) => {
    if (sections.length > 1) lines.push(escapeCsv(section.name));
    lines.push(section.columns.map(c => escapeCsv(c.label)).join(','));
    (section.rows || []).forEach(row => {
      lines.push(section.columns.map(c => escapeCsv(cellValue(row, c.key))).join(','));
    });
    if (idx < sections.length - 1) lines.push('');
  });

  // BOM so Excel reads UTF-8 (incl. Arabic) correctly.
  triggerDownload(
    new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }),
    `${slug(filename || title)}_${todayStamp()}.csv`,
  );
};

// ─── Public dispatchers ──────────────────────────────────────────────────

/** Export a single table in the requested format. */
export const exportTable = (format: ExportFormat, input: ExportTableInput): Promise<void> => {
  return exportSections(format, {
    filename: input.filename,
    title: input.title,
    meta: input.meta,
    sections: [{ name: input.title || 'Data', columns: input.columns, rows: input.rows }],
  });
};

/** Export multiple titled sections (multi-sheet xlsx / stacked pdf tables / sectioned csv). */
export const exportSections = async (format: ExportFormat, input: ExportSectionsInput): Promise<void> => {
  const sections = (input.sections || []).filter(s => s && s.columns?.length);
  if (sections.length === 0) return;

  try {
    switch (format) {
      case 'xlsx':
        await buildXLSX(input.filename, input.title, sections, input.meta);
        break;
      case 'pdf':
        await buildPDF(input.filename, input.title, sections, input.meta);
        break;
      case 'csv':
        buildCSV(input.filename, input.title, sections, input.meta);
        break;
    }
  } catch (err) {
    console.error('[export] Failed to generate file', { format, err });
    throw err;
  }
};

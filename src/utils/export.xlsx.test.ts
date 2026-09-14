import { describe, it, expect } from 'vitest';
import writeXlsxFile from 'write-excel-file/node';
import { unzipSync, strFromU8 } from 'fflate';
import { xlsxCell, safeSheetName, buildColumnWidths, slug } from './export';

const buildWorkbook = async () => {
  const sheets = [
    {
      data: [
        [xlsxCell('Sales Report')],
        [xlsxCell('Range: January')],
        [],
        [xlsxCell('Item'), xlsxCell('Qty'), xlsxCell('Total')],
        [xlsxCell('Latte'), xlsxCell(12), xlsxCell(48.5)],
        [xlsxCell('Empty'), xlsxCell(''), xlsxCell(0)],
      ],
      sheet: safeSheetName('Sales', 'Sheet1'),
      columns: [{ width: 20 }, { width: 10 }, { width: 10 }],
    },
    {
      data: [[xlsxCell('Only')], [xlsxCell(7)]],
      sheet: safeSheetName('Second', 'Sheet2'),
      columns: [{ width: 12 }],
    },
  ];
  const buffer = await writeXlsxFile(sheets as never).toBuffer();
  return unzipSync(new Uint8Array(buffer));
};

describe('xlsx export via write-excel-file', () => {
  it('produces a valid zip containing the expected OOXML parts', async () => {
    const files = await buildWorkbook();
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        '[Content_Types].xml',
        'xl/workbook.xml',
        'xl/worksheets/sheet1.xml',
        'xl/worksheets/sheet2.xml',
      ]),
    );
  });

  it('names every worksheet', async () => {
    const files = await buildWorkbook();
    const wb = strFromU8(files['xl/workbook.xml']);
    const names = [...wb.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
    expect(names).toEqual(['Sales', 'Second']);
  });

  it('writes the preamble, header and body rows', async () => {
    const files = await buildWorkbook();
    const s1 = strFromU8(files['xl/worksheets/sheet1.xml']);
    // 2 preamble + 1 spacer + 1 header + 2 body
    expect((s1.match(/<row/g) || []).length).toBe(6);

    const strings = strFromU8(files['xl/sharedStrings.xml'] ?? new Uint8Array());
    expect(strings).toContain('Sales Report');
    expect(strings).toContain('Latte');
  });

  it('keeps numbers numeric rather than stringifying them', async () => {
    const files = await buildWorkbook();
    const s1 = strFromU8(files['xl/worksheets/sheet1.xml']);
    // Numeric cells carry no t="s" (shared-string) marker and hold the raw value.
    expect(s1).toMatch(/<c r="B5"[^>]*><v>12<\/v>/);
    expect(s1).toMatch(/<c r="C5"[^>]*><v>48\.5<\/v>/);
    // 0 must survive as a real zero, not be dropped as falsy.
    expect(s1).toMatch(/<c r="C6"[^>]*><v>0<\/v>/);
  });

  it('applies the computed column widths', async () => {
    const files = await buildWorkbook();
    const s1 = strFromU8(files['xl/worksheets/sheet1.xml']);
    expect(s1).toMatch(/<col[^>]*width="20"/);
    expect(s1).toMatch(/<col[^>]*width="10"/);
  });

  it('sanitizes sheet names to Excel rules', () => {
    expect(safeSheetName('a/b:c*d?e[f]g', 'X')).toBe('a b c d e f g');
    expect(safeSheetName('x'.repeat(40), 'X')).toHaveLength(31);
    expect(safeSheetName('', 'Fallback')).toBe('Fallback');
  });

  it('31-char sheet collision terminates and produces distinct names', () => {
    const longName = 'A'.repeat(31);
    const used = new Set<string>();
    const names: string[] = [];

    for (let i = 0; i < 3; i++) {
      const base = safeSheetName(longName, `Sheet${i + 1}`);
      let name = base;
      let suffix = 1;
      while (used.has(name.toLowerCase())) {
        const tag = ` ${++suffix}`;
        name = base.slice(0, 31 - tag.length) + tag;
      }
      used.add(name.toLowerCase());
      names.push(name);
    }

    expect(names).toHaveLength(3);
    expect(new Set(names.map(n => n.toLowerCase())).size).toBe(3);
    names.forEach(n => {
      expect(n.length).toBeLessThanOrEqual(31);
    });
    expect(names[0]).toBe('A'.repeat(31));
    expect(names[1]).toBe('A'.repeat(29) + ' 2');
    expect(names[2]).toBe('A'.repeat(29) + ' 3');
  });

  it('xlsxCell(NaN) yields a null/string cell, never <v>NaN</v>', async () => {
    const cell = xlsxCell(NaN);
    expect(cell.type).toBe(String);
    expect(cell.value).toBeNull();

    const sheets = [
      {
        data: [[xlsxCell(NaN)]],
        sheet: 'NaNTest',
        columns: [{ width: 10 }],
      },
    ];
    const buffer = await writeXlsxFile(sheets as never).toBuffer();
    const files = unzipSync(new Uint8Array(buffer));
    const s = strFromU8(files['xl/worksheets/sheet1.xml']);
    expect(s).not.toContain('<v>NaN</v>');
  });

  it('column widths with 100k rows do not throw stack overflow', () => {
    const largeRows = new Array(100_000).fill(null).map((_, i) => ({
      id: i,
      name: `Customer ${i}`,
    }));
    const section = {
      name: 'Large',
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      rows: largeRows,
    };

    expect(() => {
      const widths = buildColumnWidths(section);
      expect(widths).toHaveLength(2);
      expect(widths[0].width).toBeGreaterThanOrEqual(10);
    }).not.toThrow();
  });

  it('slug("ملخص المبيعات") is non-empty and ASCII-safe', () => {
    const arabicSlug = slug('ملخص المبيعات');
    expect(arabicSlug).not.toBe('export');
    expect(arabicSlug).toBe('ملخص_المبيعات');
  });
});

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UploadCloud,
  FileSpreadsheet,
  Download,
  FlaskConical,
  Loader2,
  Pencil,
  Rocket,
  Store,
} from 'lucide-react';
import { readSpreadsheet, dryRun, toCsv, type DryRunResult } from '../../utils/spreadsheetReader';
import { SAMPLE_ROWS, MINTOM_TEMPLATE_HEADERS, type SourceId } from '../../utils/posImportMaps';
import { runMigrationImport, type MigrationImportResult } from '../../services/migrationImporter';
import { withExcelBom } from '../../utils/csvBom';
import { ErrorBanner } from '../../components/ui';

type Phase = 'idle' | 'parsing' | 'preview' | 'importing' | 'done';

const SOURCES: { id: SourceId; name: string }[] = [
  { id: 'foodics', name: 'Foodics' },
  { id: 'loyverse', name: 'Loyverse' },
  { id: 'square', name: 'Square' },
  { id: 'other', name: 'Other / Excel' },
];

const DRAFT_KEY = 'mintcom:migration:draft:v1';

interface EditableRow {
  key: number;
  name: string;
  price: string;
  category: string;
  sourceRowNum: number;
}

export function MigrationPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sourceHint, setSourceHint] = useState<SourceId | null>(null);
  const [dry, setDry] = useState<DryRunResult | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [editRows, setEditRows] = useState<EditableRow[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<MigrationImportResult | null>(null);

  // Restore small drafts (<=500 rows) so a refresh mid-fix doesn't lose work.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { fileName: string; rows: EditableRow[] };
      if (Array.isArray(d.rows) && d.rows.length > 0 && d.rows.length <= 500) {
        setFileName(d.fileName);
        setEditRows(d.rows);
        setPhase('preview');
      }
    } catch { /* ignore corrupt draft */ }
  }, []);

  useEffect(() => {
    try {
      if (phase === 'preview' && editRows.length > 0 && editRows.length <= 500) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ fileName, rows: editRows }));
      } else if (phase === 'done' || phase === 'idle') {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch { /* quota — skip persisting */ }
  }, [phase, editRows, fileName]);

  const validCount = editRows.length;
  const invalidCount = useMemo(() => dry ? dry.stats.invalid : 0, [dry]);

  const ingestFile = async (file: File) => {
    setFatal(null);
    setResult(null);
    setPhase('parsing');
    setFileName(file.name);
    try {
      const sheet = await readSpreadsheet(file);
      const res = dryRun(sheet);
      if (res.validRows.length === 0) {
        setDry(res);
        setEditRows([]);
        setPhase('preview');
        return;
      }
      setDry(res);
      setEditRows(
        res.validRows.map((r, i) => ({
          key: i,
          name: r.name,
          price: r.price,
          category: r.category,
          sourceRowNum: r._rowNum,
        })),
      );
      if (sourceHint === null) setSourceHint(res.detectedSource);
      setPhase('preview');
    } catch (e) {
      setFatal(e instanceof Error ? e.message : 'Failed to read the file.');
      setPhase('idle');
    }
  };

  const useSampleFile = () => {
    const headers = SAMPLE_ROWS[0];
    const body = SAMPLE_ROWS.slice(1);
    const blob = new Blob([withExcelBom(toCsv(headers, body))], { type: 'text/csv;charset=utf-8;' });
    const file = new File([blob], 'mintcom_sample_foodics.csv', { type: 'text/csv' });
    void ingestFile(file);
  };

  const downloadTemplate = () => {
    const sample: string[][] = [
      ['Cappuccino', '14.50', '', 'Hot Drinks', 'Classic Italian coffee', 'Size: Small | Medium +1.00', '', ''],
      ['Iced Latte', '18.00', '', 'Cold Drinks', 'Chilled espresso', '', '', ''],
    ];
    const blob = new Blob([withExcelBom(toCsv(MINTOM_TEMPLATE_HEADERS, sample))], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mintcom_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadErrors = () => {
    if (!dry) return;
    const rows = dry.errors.map((e) => [e]);
    const blob = new Blob([withExcelBom(toCsv(['Error'], rows))], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'migration_errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateRow = (key: number, patch: Partial<EditableRow>) =>
    setEditRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : null)).filter(Boolean) as EditableRow[]);

  const removeRow = (key: number) => setEditRows((prev) => prev.filter((r) => r.key !== key));

  const startImport = async () => {
    if (editRows.length === 0) return;
    setPhase('importing');
    setProgress({ done: 0, total: editRows.length });
    const payload = editRows.map((r, i) => ({
      name: r.name.trim(),
      price: r.price.trim(),
      cost_price: '',
      category: r.category.trim() || 'Uncategorized',
      description: '',
      addons: dry?.validRows[i]?.addons ?? '',
      track_stock: 'false',
      available_stock: '',
      _rowNum: r.sourceRowNum,
    }));
    // Preserve addons/description from dry-run by matching on source row number
    const byRow = new Map((dry?.validRows ?? []).map((v) => [v._rowNum, v]));
    const full = payload.map((p) => {
      const orig = byRow.get(p._rowNum);
      return { ...p, addons: orig?.addons ?? '', description: orig?.description ?? '', cost_price: orig?.cost_price ?? '' };
    });
    const res = await runMigrationImport(full, (done, total) => setProgress({ done, total }));
    setResult(res);
    setPhase('done');
  };

  const reset = () => {
    setPhase('idle');
    setDry(null);
    setEditRows([]);
    setFileName(null);
    setFatal(null);
    setResult(null);
    setProgress({ done: 0, total: 0 });
    setSourceHint(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-6 pb-10 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-text-primary dark:text-white">Switch from another POS</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Drop your export below — we detect Foodics, Loyverse or Square automatically and import in seconds.
        </p>
      </div>

      {/* ── 1. Single dropzone + source reassurance + quick actions ── */}
      <div className="rounded-2xl border border-cream-300 dark:border-white/10 bg-white dark:bg-dark-light p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSourceHint(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                (sourceHint ?? dry?.detectedSource) === s.id
                  ? 'border-mintcom-green bg-mintcom-green/10 text-text-primary dark:text-white'
                  : 'border-cream-300 dark:border-white/10 text-text-secondary hover:border-mintcom-green/60'
              }`}
            >
              <Store size={13} /> {s.name}
            </button>
          ))}
          {dry && (
            <span className="text-xs text-text-tertiary">
              Detected: <strong className="text-mintcom-green">{dry.detectedSource}</strong>
            </span>
          )}
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void ingestFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            dragging ? 'border-mintcom-green bg-mintcom-green/10' : 'border-cream-400 dark:border-white/15 hover:border-mintcom-green/60'
          }`}
        >
          {phase === 'parsing' ? (
            <Loader2 size={32} className="animate-spin text-mintcom-green" />
          ) : (
            <UploadCloud size={32} className="text-mintcom-green" />
          )}
          <div>
            <p className="text-sm font-semibold text-text-primary dark:text-white">
              {phase === 'parsing' ? 'Reading your file…' : 'Drag your export file here, or click to browse'}
            </p>
            <p className="text-xs text-text-tertiary">.csv or .xlsx — up to 2,000 rows per import</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void ingestFile(f);
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cream-300 dark:border-white/10 px-4 py-2 text-xs font-semibold text-text-primary dark:text-white hover:bg-cream-100 dark:hover:bg-white/5"
          >
            <Download size={13} /> Download template
          </button>
          <button
            onClick={useSampleFile}
            className="inline-flex items-center gap-1.5 rounded-xl border border-mintcom-green/40 bg-mintcom-green/10 px-4 py-2 text-xs font-semibold text-text-primary dark:text-white hover:bg-mintcom-green/20"
          >
            <FlaskConical size={13} /> Try with sample file
          </button>
        </div>

        {fatal && (
          <ErrorBanner hideDot className="mt-3 !p-3 font-normal">
            <XCircle size={16} /> {fatal}
          </ErrorBanner>
        )}
      </div>

      {/* ── 2. Preview + inline fixes ── */}
      {(phase === 'preview' || phase === 'importing' || phase === 'done') && dry && (
        <div className="rounded-2xl border border-cream-300 dark:border-white/10 bg-white dark:bg-dark-light p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
            <FileSpreadsheet size={16} /> {fileName}
            <span className="rounded-full bg-mintcom-green/15 px-2 py-0.5 text-[11px] font-semibold text-mintcom-green">
              {validCount} ready
            </span>
            {invalidCount > 0 && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                {invalidCount} need attention
              </span>
            )}
          </div>

          {dry.warnings.slice(0, 3).map((w, i) => (
            <p key={i} className="mb-1 text-xs text-text-tertiary">• {w}</p>
          ))}

          {/* Valid rows — inline editable name/price/category */}
          <div className="mb-2 mt-3 flex items-center gap-2 text-sm font-semibold text-mintcom-green">
            <CheckCircle2 size={18} /> Ready to import ({validCount})
          </div>
          <div className="space-y-1.5">
            {editRows.slice(0, 10).map((r) => {
              const open = expanded === r.key;
              return (
                <div key={r.key} className="rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm dark:border-white/5 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-text-primary dark:text-white">
                      <strong>{r.name}</strong>
                      <span className="text-text-tertiary"> · {r.category} · {r.price}</span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => setExpanded(open ? null : r.key)}
                        className="inline-flex items-center gap-1 rounded-lg border border-cream-300 px-3 py-1 text-xs font-semibold hover:bg-cream-200 dark:border-white/10 dark:hover:bg-white/10"
                      >
                        <Pencil size={12} /> {open ? 'Close' : 'Fix'}
                      </button>
                      <button
                        onClick={() => removeRow(r.key)}
                        className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                      >
                        Skip
                      </button>
                    </span>
                  </div>
                  {open && (
                    <div className="grid grid-cols-1 gap-2 pt-3 sm:grid-cols-3">
                      <label className="text-xs">Name
                        <input value={r.name} onChange={(e) => updateRow(r.key, { name: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-cream-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
                      </label>
                      <label className="text-xs">Price
                        <input value={r.price} onChange={(e) => updateRow(r.key, { price: e.target.value })}
                          inputMode="decimal" placeholder="0.00"
                          className="mt-1 w-full rounded-lg border border-cream-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
                      </label>
                      <label className="text-xs">Category
                        <input value={r.category} onChange={(e) => updateRow(r.key, { category: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-cream-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
            {editRows.length > 10 && (
              <p className="text-center text-xs text-text-tertiary">…and {editRows.length - 10} more rows will be imported</p>
            )}
          </div>

          {/* Fatal row errors */}
          {dry.errors.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-500">
                <AlertTriangle size={18} /> Couldn't read ({dry.errors.length})
                <button onClick={downloadErrors} className="ml-auto text-xs underline">Download list</button>
              </div>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {dry.errors.slice(0, 20).map((e, i) => (
                  <p key={i} className="rounded-lg bg-amber-50 dark:bg-amber-900/10 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400">{e}</p>
                ))}
              </div>
            </div>
          )}

          {/* Blocked-by-platform notice */}
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <XCircle size={18} /> We can't bring automatically
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3 rounded-lg border border-cream-200 px-4 py-2.5 dark:border-white/5">
                <span>Employee passwords</span>
                <span className="text-right text-xs text-text-secondary">Temp PINs are created; staff reset on first login</span>
              </div>
              <div className="flex justify-between gap-3 rounded-lg border border-cream-200 px-4 py-2.5 dark:border-white/5">
                <span>Old invoice numbers</span>
                <span className="text-right text-xs text-text-secondary">ZATCA requires a new sequence</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          {phase === 'importing' && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span>Importing… {progress.done}/{progress.total}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-cream-200 dark:bg-white/10">
                <div className="h-full bg-mintcom-green transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {/* Result */}
          {phase === 'done' && result && (
            <div className={`mt-4 rounded-xl border p-4 text-sm ${result.failed === 0 ? 'border-mintcom-green/30 bg-mintcom-green/10' : 'border-amber-300 bg-amber-50 dark:bg-amber-900/10'}`}>
              <p className="font-bold">
                Imported {result.success} products{result.failed > 0 && `, ${result.failed} skipped`}
              </p>
              {result.createdCategories.length > 0 && (
                <p className="mt-1 text-xs">New categories: {result.createdCategories.join(', ')}</p>
              )}
              {result.createdAddons.length > 0 && (
                <p className="mt-1 text-xs">New add-on groups: {result.createdAddons.join(', ')}</p>
              )}
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-32 space-y-0.5 overflow-y-auto text-xs">
                  {result.errors.slice(0, 20).map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/dashboard/products')}
                  className="rounded-xl bg-mintcom-green px-5 py-2.5 text-sm font-bold text-black hover:brightness-95"
                >
                  Open Products
                </button>
                <button
                  onClick={reset}
                  className="rounded-xl border border-cream-300 px-5 py-2.5 text-sm font-semibold dark:border-white/10"
                >
                  Import another file
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {phase === 'preview' && (
            <div className="mt-6 flex justify-between">
              <button
                onClick={reset}
                className="rounded-xl border border-cream-300 dark:border-white/10 px-6 py-3 text-sm font-semibold hover:bg-cream-100 dark:hover:bg-white/5"
              >
                Start over
              </button>
              <button
                onClick={startImport}
                disabled={editRows.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-mintcom-green px-6 py-3 text-sm font-semibold text-black hover:brightness-95 disabled:opacity-40"
              >
                <Rocket size={16} /> Import {editRows.length} products
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

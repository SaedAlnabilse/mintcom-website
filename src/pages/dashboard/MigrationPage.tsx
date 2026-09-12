import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UploadCloud,
  FileSpreadsheet,
  Store,
  ArrowRight,
  Pencil,
  Rocket,
} from 'lucide-react';

type SourceId = 'foodics' | 'loyverse' | 'square' | 'other';
type Step = 'source' | 'wants' | 'upload' | 'result';

interface SourceOption {
  id: SourceId;
  name: string;
  guide: string[];
}

const SOURCES: SourceOption[] = [
  {
    id: 'foodics',
    name: 'Foodics',
    guide: [
      'Open your Foodics dashboard',
      'Go to Inventory > Products',
      'Click Export, then upload that file here',
    ],
  },
  {
    id: 'loyverse',
    name: 'Loyverse',
    guide: [
      'Open your Loyverse Back Office',
      'Go to Items > Export',
      'Download the CSV, then upload it here',
    ],
  },
  {
    id: 'square',
    name: 'Square',
    guide: [
      'Open your Square Dashboard',
      'Go to Items > Export Library',
      'Download the CSV, then upload it here',
    ],
  },
  {
    id: 'other',
    name: 'Other / Excel',
    guide: [
      'Open your current spreadsheet or export',
      'Make sure it has columns for name and price',
      'Upload the file here (.csv or .xlsx)',
    ],
  },
];

interface WantOption {
  id: string;
  label: string;
  detail: string;
  optional?: boolean;
}

const WANTS: WantOption[] = [
  { id: 'menu', label: 'Menu', detail: 'Categories, items, prices' },
  { id: 'modifiers', label: 'Modifiers / Add-ons', detail: 'Variants and extras' },
  { id: 'customers', label: 'Customers + loyalty points', detail: 'Profiles and balances' },
  { id: 'employees', label: 'Employees', detail: 'Names and roles' },
  { id: 'sales', label: 'Sales history', detail: 'Optional - slower', optional: true },
];

interface ProblemRow {
  id: string;
  label: string;
  action: string;
  hint: string;
  fixLabel: string;
  fixPlaceholder: string;
  fixDefault: string;
}

interface ResultData {
  got: { label: string; value: string }[];
  problems: ProblemRow[];
  blocked: { label: string; value: string }[];
}

const MOCK_RESULT: ResultData = {
  got: [
    { label: 'Categories', value: '12' },
    { label: 'Products (incl. prices, SKUs)', value: '148' },
    { label: 'Modifiers', value: '24' },
    { label: 'Customers', value: '312' },
  ],
  problems: [
    { id: 'p1', label: 'Row 45: price is "Free"', action: 'Set to 0', hint: 'Mocked fix — nothing is saved.', fixLabel: 'Corrected price', fixPlaceholder: '0.00', fixDefault: '0' },
    { id: 'p2', label: 'Row 72: duplicate "Cappuccino"', action: 'Keep both', hint: 'Mocked fix — nothing is saved.', fixLabel: 'Resolution', fixPlaceholder: 'Keep both', fixDefault: 'Keep both' },
    { id: 'p3', label: '14 products without images', action: 'Add later', hint: 'Mocked fix — nothing is saved.', fixLabel: 'Note', fixPlaceholder: 'Add later', fixDefault: 'Add later' },
  ],
  blocked: [
    { label: 'Employee passwords', value: 'We created temp PINs, staff reset on first login' },
    { label: 'Old invoice numbers', value: 'ZATCA requires a new sequence' },
  ],
};

const cardClass =
  'rounded-2xl border border-cream-300 dark:border-white/10 bg-white dark:bg-dark-light p-6 shadow-sm';
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-mintcom-green px-6 py-3 text-sm font-semibold text-black transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40';
const ghostBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-cream-300 dark:border-white/10 px-6 py-3 text-sm font-semibold text-text-primary dark:text-white transition-all hover:bg-cream-100 dark:hover:bg-white/5';

export function MigrationPage() {
  const [step, setStep] = useState<Step>('source');
  const [source, setSource] = useState<SourceId | null>(null);
  const [wants, setWants] = useState<string[]>(WANTS.filter((w) => !w.optional).map((w) => w.id));
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null);
  const [fixValues, setFixValues] = useState<Record<string, string>>({});
  const [fixedProblems, setFixedProblems] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSource = useMemo(() => SOURCES.find((s) => s.id === source) ?? null, [source]);

  const toggleWant = (id: string) =>
    setWants((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));

  const handleFile = (name: string) => {
    setFileName(name);
    setStep('result');
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file.name);
  };

  const reset = () => {
    setStep('source');
    setSource(null);
    setFileName(null);
    setExpandedProblem(null);
    setFixValues({});
    setFixedProblems([]);
  };

  const applyFix = (id: string) => {
    setFixedProblems((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setExpandedProblem(null);
  };

  const remainingProblems = MOCK_RESULT.problems.length - fixedProblems.length;

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary dark:text-white">
          Switch from another POS
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Bring your menu, customers and staff across in a couple of minutes.
        </p>
      </div>

      <Stepper current={step} source={source} />

      <AnimatePresence mode="wait">
        {step === 'source' && (
          <StepShell key="source">
            <h2 className="text-lg font-semibold text-text-primary dark:text-white">
              Where are you coming from?
            </h2>
            <p className="mt-1 mb-5 text-sm text-text-secondary">
              Pick your current system so we can read its export format.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition-all ${
                    source === s.id
                      ? 'border-mintcom-green bg-mintcom-green/10 text-text-primary dark:text-white'
                      : 'border-cream-300 dark:border-white/10 text-text-secondary hover:border-mintcom-green/60'
                  }`}
                >
                  <Store size={22} />
                  {s.name}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className={primaryBtn}
                disabled={!source}
                onClick={() => setStep('wants')}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </StepShell>
        )}

        {step === 'wants' && (
          <StepShell key="wants">
            <h2 className="text-lg font-semibold text-text-primary dark:text-white">
              What do you want to bring?
            </h2>
            <p className="mt-1 mb-5 text-sm text-text-secondary">
              Everything is pre-selected. Just tap Next if you're happy.
            </p>
            <div className="space-y-2">
              {WANTS.map((w) => {
                const checked = wants.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => toggleWant(w.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                      checked
                        ? 'border-mintcom-green bg-mintcom-green/5'
                        : 'border-cream-300 dark:border-white/10'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                        checked
                          ? 'border-mintcom-green bg-mintcom-green text-black'
                          : 'border-cream-400 dark:border-white/20'
                      }`}
                    >
                      {checked && <CheckCircle2 size={14} />}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-text-primary dark:text-white">
                        {w.label}
                      </span>
                      <span className="block text-xs text-text-tertiary">{w.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-between">
              <button className={ghostBtn} onClick={() => setStep('source')}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className={primaryBtn} onClick={() => setStep('upload')}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </StepShell>
        )}

        {step === 'upload' && (
          <StepShell key="upload">
            <h2 className="text-lg font-semibold text-text-primary dark:text-white">
              Give us the file
            </h2>
            <p className="mt-1 mb-5 text-sm text-text-secondary">
              Export from {activeSource?.name ?? 'your system'} and drop it below. Takes about 30
              seconds.
            </p>

            {activeSource && (
              <ol className="mb-5 space-y-1.5 rounded-xl bg-cream-100 p-4 text-sm text-text-secondary dark:bg-white/5">
                {activeSource.guide.map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-semibold text-mintcom-green">{i + 1}.</span>
                    {line}
                  </li>
                ))}
              </ol>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                dragging
                  ? 'border-mintcom-green bg-mintcom-green/10'
                  : 'border-cream-400 dark:border-white/15 hover:border-mintcom-green/60'
              }`}
            >
              <UploadCloud size={36} className="text-mintcom-green" />
              <div>
                <p className="text-sm font-semibold text-text-primary dark:text-white">
                  Drag your export file here
                </p>
                <p className="text-xs text-text-tertiary">.csv or .xlsx</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file.name);
                }}
              />
            </div>

            <p className="mt-4 text-center text-xs text-text-tertiary">
              Demo mode - no file is uploaded or stored.
            </p>

            <div className="mt-6 flex justify-between">
              <button className={ghostBtn} onClick={() => setStep('wants')}>
                <ArrowLeft size={16} /> Back
              </button>
            </div>
          </StepShell>
        )}

        {step === 'result' && (
          <StepShell key="result">
            <div className="mb-5 flex items-center gap-2 text-sm text-text-secondary">
              <FileSpreadsheet size={16} />
              {fileName}
            </div>

            <ResultList
              tone="ok"
              title="Got it - ready"
              icon={<CheckCircle2 size={18} />}
              rows={MOCK_RESULT.got.map((g) => ({ id: g.label, label: g.label, trailing: g.value }))}
            />

            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-500">
                <AlertTriangle size={18} />
                Needs your check{remainingProblems > 0 ? ` (${remainingProblems} left)` : ' — all fixed'}
              </div>
              <div className="space-y-1.5">
                {MOCK_RESULT.problems.map((p) => {
                  const fixed = fixedProblems.includes(p.id);
                  const expanded = expandedProblem === p.id;
                  const value = fixValues[p.id] ?? p.fixDefault;
                  return (
                    <div
                      key={p.id}
                      className="rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm dark:border-white/5 dark:bg-white/[0.02]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-text-primary dark:text-white">
                          {fixed && <CheckCircle2 size={14} className="text-mintcom-green" />}
                          {p.label}
                          {fixed && (
                            <span className="rounded-full bg-mintcom-green/15 px-2 py-0.5 text-[11px] font-semibold text-mintcom-green">
                              Fixed (mock)
                            </span>
                          )}
                        </span>
                        {!fixed && (
                          <button
                            onClick={() => setExpandedProblem(expanded ? null : p.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-cream-300 px-3 py-1 text-xs font-semibold text-text-primary transition-all hover:bg-cream-200 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                          >
                            <Pencil size={12} /> {expanded ? 'Close' : p.action}
                          </button>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {expanded && !fixed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3">
                              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                                {p.fixLabel}
                              </label>
                              <div className="flex gap-2">
                                <input
                                  value={value}
                                  onChange={(e) =>
                                    setFixValues((prev) => ({ ...prev, [p.id]: e.target.value }))
                                  }
                                  placeholder={p.fixPlaceholder}
                                  className="min-w-0 flex-1 rounded-lg border border-cream-300 bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-white/5 dark:text-white"
                                />
                                <button
                                  onClick={() => applyFix(p.id)}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-mintcom-green px-4 py-2 text-xs font-bold text-black hover:brightness-95"
                                >
                                  <CheckCircle2 size={13} /> Apply
                                </button>
                              </div>
                              <p className="mt-1.5 text-[11px] text-text-tertiary">{p.hint}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            <ResultList
              tone="no"
              title="We cannot bring"
              icon={<XCircle size={18} />}
              rows={MOCK_RESULT.blocked.map((b) => ({
                id: b.label,
                label: b.label,
                trailing: b.value,
              }))}
            />

            <div className="mt-6 flex justify-between">
              <button className={ghostBtn} onClick={reset}>
                <ArrowLeft size={16} /> Start over
              </button>
              <button className={primaryBtn} onClick={reset}>
                <Rocket size={16} /> Review &amp; Go Live
              </button>
            </div>
          </StepShell>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className={cardClass}
    >
      {children}
    </motion.div>
  );
}

function Stepper({ current, source }: { current: Step; source: SourceId | null }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'source', label: 'Source' },
    { id: 'wants', label: 'Data' },
    { id: 'upload', label: 'Upload' },
    { id: 'result', label: 'Review' },
  ];
  const currentIndex = steps.findIndex((s) => s.id === current);
  return (
    <div className="mb-6 flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const label = s.id === 'source' && source ? 'Source' : s.label;
        return (
          <div key={s.id} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done || active
                  ? 'bg-mintcom-green text-black'
                  : 'bg-cream-200 text-text-tertiary dark:bg-white/10'
              }`}
            >
              {done ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                active ? 'text-text-primary dark:text-white' : 'text-text-tertiary'
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 ${done ? 'bg-mintcom-green' : 'bg-cream-300 dark:bg-white/10'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResultList({
  tone,
  title,
  icon,
  rows,
}: {
  tone: 'ok' | 'warn' | 'no';
  title: string;
  icon: React.ReactNode;
  rows: { id: string; label: string; trailing?: string; action?: string }[];
}) {
  const toneClasses = {
    ok: 'text-mintcom-green',
    warn: 'text-amber-500',
    no: 'text-accent',
  }[tone];

  return (
    <div className="mb-4">
      <div className={`mb-2 flex items-center gap-2 text-sm font-semibold ${toneClasses}`}>
        {icon}
        {title}
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm dark:border-white/5 dark:bg-white/[0.02]"
          >
            <span className="text-text-primary dark:text-white">{r.label}</span>
            {r.trailing && (
              <span className="font-semibold text-text-secondary">{r.trailing}</span>
            )}
            {r.action && (
              <button className="inline-flex items-center gap-1 rounded-lg border border-cream-300 px-3 py-1 text-xs font-semibold text-text-primary transition-all hover:bg-cream-200 dark:border-white/10 dark:text-white dark:hover:bg-white/10">
                <Pencil size={12} /> {r.action}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

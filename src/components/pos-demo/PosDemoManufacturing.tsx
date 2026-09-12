/**
 * Demo Manufacturing — mirrors mintcom-pos ManufacturingScreen:
 * - Top tabs: Raw materials (inventory) | Recipe management
 * - Inventory sub-tabs: Raw | Intermediate stock
 * - Recipes sub-tabs: Intermediate recipes | Menu (final) recipes
 * - Add/edit materials, restock, manufacture/produce, recipe + ingredients
 * Local demo state only.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  Layers,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Wrench,
  X,
} from 'lucide-react';

/** POS formatAmount style: "18.00 USD" (matches "0.00 JOD" order on device) */
const money = (n: number) =>
  `${(Number.isFinite(n) ? n : 0).toFixed(2)} USD`;

/* ─── Domain (aligned with mintcom-pos types/manufacturing) ─────────────── */

type Unit =
  | 'kg'
  | 'g'
  | 'mg'
  | 'lb'
  | 'oz'
  | 'L'
  | 'ml'
  | 'cup'
  | 'tbsp'
  | 'tsp'
  | 'pcs'
  | 'portion'
  | 'units';

type RawMaterial = {
  id: string;
  name: string;
  unit: Unit;
  quantity: number;
  costPerUnit: number;
  lowStockThreshold: number;
  active: boolean;
};

type Ingredient = {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: Unit;
  /** raw material or intermediate (sub-recipe) stock */
  source: 'raw' | 'intermediate';
};

type SubRecipe = {
  id: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
  yieldQty: number;
  yieldUnit: Unit;
  /** prepared intermediate stock on hand */
  quantity: number;
  active: boolean;
};

type FinalRecipe = {
  id: string;
  menuItemId: string;
  menuItemName: string;
  menuEmoji: string;
  menuItemType?: 'product' | 'addon';
  ingredients: Ingredient[];
  active: boolean;
};

const UNITS: Unit[] = [
  'kg',
  'g',
  'mg',
  'lb',
  'oz',
  'L',
  'ml',
  'cup',
  'tbsp',
  'tsp',
  'pcs',
  'portion',
  'units',
];

const SEED_RAW: RawMaterial[] = [
  { id: 'rm-beans', name: 'Espresso beans', unit: 'kg', quantity: 4.2, costPerUnit: 18, lowStockThreshold: 2, active: true },
  { id: 'rm-milk', name: 'Whole milk', unit: 'L', quantity: 12, costPerUnit: 1.2, lowStockThreshold: 4, active: true },
  { id: 'rm-oat', name: 'Oat milk', unit: 'L', quantity: 1.5, costPerUnit: 2.4, lowStockThreshold: 3, active: true },
  { id: 'rm-flour', name: 'Flour', unit: 'kg', quantity: 8, costPerUnit: 1.1, lowStockThreshold: 3, active: true },
  { id: 'rm-butter', name: 'Butter', unit: 'kg', quantity: 2.5, costPerUnit: 9, lowStockThreshold: 1, active: true },
  { id: 'rm-sugar', name: 'Sugar', unit: 'kg', quantity: 5, costPerUnit: 1.4, lowStockThreshold: 2, active: true },
  { id: 'rm-vanilla', name: 'Vanilla syrup', unit: 'L', quantity: 0.8, costPerUnit: 12, lowStockThreshold: 1, active: true },
  { id: 'rm-eggs', name: 'Eggs', unit: 'pcs', quantity: 48, costPerUnit: 0.25, lowStockThreshold: 24, active: true },
];

/** POS getStockStatus — only flags low/out when a threshold is set (> 0) */
function getStockStatus(m: RawMaterial): 'ok' | 'low' | 'out' {
  if (m.lowStockThreshold) {
    if (m.quantity <= 0) return 'out';
    if (m.quantity <= m.lowStockThreshold) return 'low';
  }
  return 'ok';
}

const SEED_SUB: SubRecipe[] = [
  {
    id: 'sr-syrup-base',
    name: 'House syrup base',
    description: 'Sweet base for flavored lattes',
    ingredients: [
      { ingredientId: 'rm-sugar', ingredientName: 'Sugar', quantity: 0.5, unit: 'kg', source: 'raw' },
      { ingredientId: 'rm-vanilla', ingredientName: 'Vanilla syrup', quantity: 0.1, unit: 'L', source: 'raw' },
    ],
    yieldQty: 1,
    yieldUnit: 'L',
    quantity: 2.5,
    active: true,
  },
  {
    id: 'sr-dough',
    name: 'Croissant dough',
    description: 'Laminated dough batch',
    ingredients: [
      { ingredientId: 'rm-flour', ingredientName: 'Flour', quantity: 2, unit: 'kg', source: 'raw' },
      { ingredientId: 'rm-butter', ingredientName: 'Butter', quantity: 1, unit: 'kg', source: 'raw' },
      { ingredientId: 'rm-eggs', ingredientName: 'Eggs', quantity: 4, unit: 'pcs', source: 'raw' },
    ],
    yieldQty: 24,
    yieldUnit: 'pcs',
    quantity: 12,
    active: true,
  },
];

const SEED_FINAL: FinalRecipe[] = [
  {
    id: 'fr-latte',
    menuItemId: 'latte',
    menuItemName: 'Latte',
    menuEmoji: '🥛',
    ingredients: [
      { ingredientId: 'rm-beans', ingredientName: 'Espresso beans', quantity: 0.018, unit: 'kg', source: 'raw' },
      { ingredientId: 'rm-milk', ingredientName: 'Whole milk', quantity: 0.25, unit: 'L', source: 'raw' },
    ],
    active: true,
  },
  {
    id: 'fr-croissant',
    menuItemId: 'croissant',
    menuItemName: 'Croissant',
    menuEmoji: '🥐',
    ingredients: [
      { ingredientId: 'sr-dough', ingredientName: 'Croissant dough', quantity: 1, unit: 'pcs', source: 'intermediate' },
    ],
    active: true,
  },
  {
    id: 'fr-vanilla-latte',
    menuItemId: 'capp',
    menuItemName: 'Cappuccino',
    menuEmoji: '☕',
    ingredients: [
      { ingredientId: 'rm-beans', ingredientName: 'Espresso beans', quantity: 0.018, unit: 'kg', source: 'raw' },
      { ingredientId: 'rm-milk', ingredientName: 'Whole milk', quantity: 0.2, unit: 'L', source: 'raw' },
      { ingredientId: 'sr-syrup-base', ingredientName: 'House syrup base', quantity: 0.02, unit: 'L', source: 'intermediate' },
    ],
    active: true,
  },
];

const MENU_TARGETS = [
  { id: 'latte', name: 'Latte', emoji: '' },
  { id: 'espresso', name: 'Espresso', emoji: '' },
  { id: 'capp', name: 'Cappuccino', emoji: '' },
  { id: 'croissant', name: 'Croissant', emoji: '' },
  { id: 'sandwich', name: 'Club Sandwich', emoji: '' },
  { id: 'cake', name: 'Cheesecake', emoji: '' },
];

/* ─── UI primitives (POS density / chrome) ──────────────────────────────── */

/** Material / recipe card — borderRadius 12, light border, soft shadow like POS */
function Shell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-mintcom-surface dark:shadow-none ${className}`}
    >
      {children}
    </div>
  );
}

/** Matches POS AppTextInput / manufacturing modal inputs */
const inputCls =
  'w-full min-h-[44px] rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-[16px] sm:text-[15px] font-medium text-text-primary outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-dark dark:text-white';

const inputNumericCls =
  `${inputCls} text-end text-[20px] font-bold tabular-nums`;

/** Unit display labels (mirrors POS units.* translations) */
const UNIT_LABELS: Record<Unit, string> = {
  kg: 'Kilogram (kg)',
  g: 'Gram (g)',
  mg: 'Milligram (mg)',
  lb: 'Pound (lb)',
  oz: 'Ounce (oz)',
  L: 'Liter (L)',
  ml: 'Milliliter (ml)',
  cup: 'Cup',
  tbsp: 'Tablespoon',
  tsp: 'Teaspoon',
  pcs: 'Pieces',
  portion: 'Portion',
  units: 'Units',
};

function Field({
  label,
  required,
  children,
  error,
  className = '',
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <label className={`mb-4 block ${className}`}>
      <span className="mb-2 block text-[14px] font-normal text-text-secondary">
        {label}
        {required && <span className="ms-0.5 text-[#ef4444]">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[12px] text-[#ef4444]">{error}</span>}
    </label>
  );
}

function FooterActions({
  onCancel,
  onConfirm,
  confirmLabel = 'Save',
  confirmDisabled,
  danger,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-xl border border-[#E5E7EB] bg-white py-3 text-[14px] font-semibold text-text-secondary dark:border-white/10 dark:bg-mintcom-surface"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={`flex-1 rounded-xl py-3 text-[14px] font-bold text-white disabled:opacity-40 ${
          danger ? 'bg-[#D55263]' : 'bg-mintcom-green'
        } ${confirmDisabled && !danger ? 'bg-[#E5E7EB] text-text-secondary disabled:opacity-100' : ''}`}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

/** Soft status pill — Active mint / Inactive red (POS statusPill) */
function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-xl px-2 py-[3px] text-[10px] font-extrabold leading-none ${
        active
          ? 'bg-[#7dc6a2]/20 text-[#5fa888]'
          : 'bg-[#D55263]/15 text-[#D55263]'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/** 36×36 action chip — edit mint / archive amber / reactivate mint */
function ActionChip({
  tone,
  onClick,
  label,
  children,
}: {
  tone: 'mint' | 'amber';
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-80 ${
        tone === 'mint'
          ? 'bg-[#7dc6a2]/20 text-[#5fa888]'
          : 'bg-[#F59E0B]/20 text-[#D97706]'
      }`}
    >
      {children}
    </button>
  );
}

/** POS card grid: flex-wrap minWidth 300 ≈ 3 columns */
const cardGridCls =
  'grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]';

/**
 * Centered over the full Try POS device frame (like the employee popup).
 * Portals into `.try-pos-root` so it is not clipped to the Recipe Operations pane.
 */
function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(
      (document.querySelector('.try-pos-root') as HTMLElement | null) ??
        document.body,
    );
  }, []);

  const ui = (
    <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[min(92dvh,560px)] w-[calc(100%-24px)] sm:w-[min(90%,500px)] flex-col overflow-hidden rounded-xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] dark:bg-mintcom-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* POS modalHeader: title + X */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E5E7EB] px-[18px] py-[18px] dark:border-white/10">
          <div className="min-w-0 pe-3">
            <h3 className="text-[18px] font-bold leading-snug text-text-primary dark:text-white sm:text-[20px]">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-[12px] text-text-secondary dark:text-mintcom-textSecondary">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-text-primary dark:text-white"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-[#E5E7EB] bg-white px-4 pt-4 dark:border-white/10 dark:bg-mintcom-surface" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );

  if (!host) return null;
  return createPortal(ui, host);
}

/**
 * POS sliding pill tabs (ManufacturingScreen / Inventory / Recipes).
 * Soft gray track, solid mint active pill, optional count badges — no hard border.
 */
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon?: ReactNode; count?: number }[];
}) {
  return (
    <div className="relative flex rounded-xl bg-[#E8E8E8] p-1 dark:bg-white/10">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`relative z-10 flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-xl px-1.5 sm:px-2 py-1.5 text-[12px] font-semibold transition-colors sm:text-[13px] ${
              on
                ? 'bg-mintcom-green text-white shadow-sm'
                : 'text-[#6B7280] dark:text-mintcom-textSecondary'
            }`}
          >
            {o.icon && (
              <span className={`shrink-0 ${on ? 'text-white' : 'text-[#6B7280]'}`}>{o.icon}</span>
            )}
            <span className="truncate">{o.label}</span>
            {typeof o.count === 'number' && (
              <span
                className={`rounded-xl px-1.5 py-px text-[10px] font-bold tabular-nums ${
                  on
                    ? 'bg-white/30 text-white'
                    : 'bg-[#E5E7EB] text-[#6B7280] dark:bg-white/10 dark:text-mintcom-textSecondary'
                }`}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Toast({ msg }: { msg: string | null }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] start-1/2 z-[95] max-w-[calc(100vw-32px)] -translate-x-1/2 whitespace-normal text-center rounded-full bg-mintcom-dark px-4 py-2 text-xs font-bold text-white shadow-xl dark:bg-white dark:text-mintcom-dark sm:bottom-6"
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function fmtQty(n: number) {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3).replace(/\.?0+$/, '');
}

/* ─── Main ──────────────────────────────────────────────────────────────── */

export function DemoManufacturingPanel({ onActivity }: { onActivity?: (action: string, detail: string) => void }) {
  const [mainTab, setMainTab] = useState<'raw' | 'intermediate' | 'recipes'>('raw');
  const [search, setSearch] = useState('');
  const [rawFilter, setRawFilter] = useState<'all' | 'low' | 'out'>('all');
  const [prepFilter, setPrepFilter] = useState<'all' | 'ready' | 'shortage'>('all');
  const [finalFilter, setFinalFilter] = useState<'all' | 'products' | 'addons'>('all');
  const [toast, setToast] = useState<string | null>(null);

  const [rawMaterials, setRawMaterials] = useState(SEED_RAW);
  const [subRecipes, setSubRecipes] = useState(SEED_SUB);
  const [finalRecipes, setFinalRecipes] = useState(SEED_FINAL);

  // Modals
  type Modal =
    | null
    | { type: 'material'; edit?: RawMaterial }
    | { type: 'restock'; material: RawMaterial }
    | { type: 'manufacture'; recipe: SubRecipe }
    | { type: 'sub-recipe'; edit?: SubRecipe }
    | { type: 'final-recipe'; edit?: FinalRecipe }
    | { type: 'confirm'; title: string; body: string; onConfirm: () => void };

  const [modal, setModal] = useState<Modal>(null);

  // Drafts
  const [dName, setDName] = useState('');
  const [dUnit, setDUnit] = useState<Unit>('kg');
  const [dQty, setDQty] = useState('');
  const [dCost, setDCost] = useState('');
  const [dLow, setDLow] = useState('');
  const [dDesc, setDDesc] = useState('');
  const [dYield, setDYield] = useState('');
  const [dYieldUnit, setDYieldUnit] = useState<Unit>('L');
  const [dMenuId, setDMenuId] = useState(MENU_TARGETS[0].id);
  const [dIngredients, setDIngredients] = useState<Ingredient[]>([]);
  const [addIngId, setAddIngId] = useState('');
  const [addIngQty, setAddIngQty] = useState('1');
  const [batches, setBatches] = useState('1');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [unitPickerTarget, setUnitPickerTarget] = useState<'material' | 'yield'>('material');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const ping = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1700);
  };

  const log = (action: string, detail: string) => {
    onActivity?.(action, detail);
  };

  const q = search.trim().toLowerCase();

  const getAvailable = useCallback((ing: Ingredient): number => {
    if (ing.source === 'raw') {
      return rawMaterials.find((m) => m.id === ing.ingredientId)?.quantity ?? 0;
    }
    return subRecipes.find((s) => s.id === ing.ingredientId)?.quantity ?? 0;
  }, [rawMaterials, subRecipes]);

  const checkCanMake = useCallback((ings: Ingredient[], multiplier = 1) => {
    const missing: { name: string; need: number; have: number; unit: string }[] = [];
    for (const ing of ings) {
      const need = ing.quantity * multiplier;
      const have = getAvailable(ing);
      if (have + 1e-9 < need) {
        missing.push({ name: ing.ingredientName, need, have, unit: ing.unit });
      }
    }
    return { ok: missing.length === 0, missing };
  }, [getAvailable]);

  const deductIngredients = (ings: Ingredient[], multiplier: number) => {
    setRawMaterials((list) =>
      list.map((m) => {
        const used = ings
          .filter((i) => i.source === 'raw' && i.ingredientId === m.id)
          .reduce((s, i) => s + i.quantity * multiplier, 0);
        return used ? { ...m, quantity: Math.max(0, +(m.quantity - used).toFixed(4)) } : m;
      }),
    );
    setSubRecipes((list) =>
      list.map((s) => {
        const used = ings
          .filter((i) => i.source === 'intermediate' && i.ingredientId === s.id)
          .reduce((sum, i) => sum + i.quantity * multiplier, 0);
        return used ? { ...s, quantity: Math.max(0, +(s.quantity - used).toFixed(4)) } : s;
      }),
    );
  };

  /* ── open helpers ── */
  const openMaterial = (edit?: RawMaterial) => {
    setDName(edit?.name ?? '');
    setDUnit(edit?.unit ?? 'kg');
    setDQty(edit ? String(edit.quantity) : '0');
    setDCost(edit ? edit.costPerUnit.toFixed(2) : '0.00');
    setDLow(edit ? String(edit.lowStockThreshold) : '1');
    setModal({ type: 'material', edit });
  };

  const openRestock = (material: RawMaterial) => {
    setDQty('1');
    setDCost(material.costPerUnit.toFixed(2));
    setModal({ type: 'restock', material });
  };

  const openManufacture = (recipe: SubRecipe) => {
    setBatches('1');
    setModal({ type: 'manufacture', recipe });
  };

  const openSubRecipe = (edit?: SubRecipe) => {
    setDName(edit?.name ?? '');
    setDDesc(edit?.description ?? '');
    setDYield(edit ? String(edit.yieldQty) : '1');
    setDYieldUnit(edit?.yieldUnit ?? 'L');
    setDIngredients(edit ? [...edit.ingredients] : []);
    setAddIngId(rawMaterials[0]?.id ?? '');
    setAddIngQty('1');
    setModal({ type: 'sub-recipe', edit });
  };

  const openFinalRecipe = (edit?: FinalRecipe) => {
    setDMenuId(edit?.menuItemId ?? MENU_TARGETS[0].id);
    setDIngredients(edit ? [...edit.ingredients] : []);
    setAddIngId(rawMaterials[0]?.id ?? '');
    setAddIngQty('1');
    setModal({ type: 'final-recipe', edit });
  };

  const ingredientOptions = useMemo(() => {
    const raws = rawMaterials
      .filter((m) => m.active)
      .map((m) => ({
        id: m.id,
        name: m.name,
        unit: m.unit,
        source: 'raw' as const,
        label: `${m.name} (${m.unit}) · raw`,
      }));
    const inter = subRecipes
      .filter((s) => s.active)
      .map((s) => ({
        id: s.id,
        name: s.name,
        unit: s.yieldUnit,
        source: 'intermediate' as const,
        label: `${s.name} (${s.yieldUnit}) · intermediate`,
      }));
    return [...raws, ...inter];
  }, [rawMaterials, subRecipes]);

  const addIngredientToDraft = () => {
    const opt = ingredientOptions.find((o) => o.id === addIngId);
    if (!opt) return;
    const qty = Math.max(0, parseFloat(addIngQty) || 0);
    if (qty <= 0) {
      ping('Enter a quantity');
      return;
    }
    setDIngredients((list) => {
      const existing = list.find((i) => i.ingredientId === opt.id);
      if (existing) {
        return list.map((i) =>
          i.ingredientId === opt.id ? { ...i, quantity: +(i.quantity + qty).toFixed(4) } : i,
        );
      }
      return [
        ...list,
        {
          ingredientId: opt.id,
          ingredientName: opt.name,
          quantity: qty,
          unit: opt.unit,
          source: opt.source,
        },
      ];
    });
    setAddIngQty('1');
  };

  const saveMaterial = () => {
    if (modal?.type !== 'material') return;
    if (dName.trim().length < 2) {
      ping('Name too short');
      return;
    }
    const qty = Math.max(0, parseFloat(dQty) || 0);
    const cost = Math.max(0, parseFloat(dCost) || 0);
    const low = Math.max(0, parseFloat(dLow) || 0);
    if (modal.edit) {
      setRawMaterials((list) =>
        list.map((m) =>
          m.id === modal.edit!.id
            ? { ...m, name: dName.trim(), unit: dUnit, quantity: qty, costPerUnit: cost, lowStockThreshold: low }
            : m,
        ),
      );
      log('Updated raw material', dName.trim());
      ping('Material updated');
    } else {
      setRawMaterials((list) => [
        ...list,
        {
          id: `rm-${Date.now()}`,
          name: dName.trim(),
          unit: dUnit,
          quantity: qty,
          costPerUnit: cost,
          lowStockThreshold: low,
          active: true,
        },
      ]);
      log('Added raw material', dName.trim());
      ping('Material added');
    }
    setModal(null);
  };

  const saveRestock = () => {
    if (modal?.type !== 'restock') return;
    const qty = Math.max(0, parseFloat(dQty) || 0);
    const cost = Math.max(0, parseFloat(dCost) || 0);
    if (qty <= 0) {
      ping('Enter amount to add');
      return;
    }
    setRawMaterials((list) =>
      list.map((m) =>
        m.id === modal.material.id
          ? {
              ...m,
              quantity: +(m.quantity + qty).toFixed(4),
              costPerUnit: cost > 0 ? cost : m.costPerUnit,
            }
          : m,
      ),
    );
    log('Restocked raw material', `${modal.material.name} +${fmtQty(qty)} ${modal.material.unit}`);
    ping(`Restocked +${fmtQty(qty)} ${modal.material.unit}`);
    setModal(null);
  };

  const saveManufacture = () => {
    if (modal?.type !== 'manufacture') return;
    const n = Math.max(1, Math.floor(parseFloat(batches) || 1));
    const check = checkCanMake(modal.recipe.ingredients, n);
    if (!check.ok) {
      ping(`Missing: ${check.missing[0]?.name}`);
      return;
    }
    deductIngredients(modal.recipe.ingredients, n);
    const produced = modal.recipe.yieldQty * n;
    setSubRecipes((list) =>
      list.map((s) =>
        s.id === modal.recipe.id
          ? { ...s, quantity: +(s.quantity + produced).toFixed(4) }
          : s,
      ),
    );
    log('Manufactured intermediate', `${modal.recipe.name} ×${n} → +${fmtQty(produced)} ${modal.recipe.yieldUnit}`);
    ping(`Produced +${fmtQty(produced)} ${modal.recipe.yieldUnit}`);
    setModal(null);
  };

  const saveSubRecipe = () => {
    if (modal?.type !== 'sub-recipe') return;
    if (dName.trim().length < 2) {
      ping('Name too short');
      return;
    }
    if (dIngredients.length === 0) {
      ping('Add at least one ingredient');
      return;
    }
    const y = Math.max(0.001, parseFloat(dYield) || 1);
    if (modal.edit) {
      setSubRecipes((list) =>
        list.map((s) =>
          s.id === modal.edit!.id
            ? {
                ...s,
                name: dName.trim(),
                description: dDesc.trim() || undefined,
                ingredients: dIngredients,
                yieldQty: y,
                yieldUnit: dYieldUnit,
              }
            : s,
        ),
      );
      log('Updated intermediate recipe', dName.trim());
      ping('Recipe updated');
    } else {
      setSubRecipes((list) => [
        ...list,
        {
          id: `sr-${Date.now()}`,
          name: dName.trim(),
          description: dDesc.trim() || undefined,
          ingredients: dIngredients,
          yieldQty: y,
          yieldUnit: dYieldUnit,
          quantity: 0,
          active: true,
        },
      ]);
      log('Added intermediate recipe', dName.trim());
      ping('Recipe added');
    }
    setModal(null);
  };

  const saveFinalRecipe = () => {
    if (modal?.type !== 'final-recipe') return;
    if (dIngredients.length === 0) {
      ping('Add at least one ingredient');
      return;
    }
    const menu = MENU_TARGETS.find((m) => m.id === dMenuId) ?? MENU_TARGETS[0];
    if (modal.edit) {
      setFinalRecipes((list) =>
        list.map((r) =>
          r.id === modal.edit!.id
            ? {
                ...r,
                menuItemId: menu.id,
                menuItemName: menu.name,
                menuEmoji: menu.emoji,
                ingredients: dIngredients,
              }
            : r,
        ),
      );
      log('Updated menu recipe', menu.name);
      ping('Menu recipe updated');
    } else {
      // one recipe per menu item in demo
      setFinalRecipes((list) => {
        const without = list.filter((r) => r.menuItemId !== menu.id);
        return [
          ...without,
          {
            id: `fr-${Date.now()}`,
            menuItemId: menu.id,
            menuItemName: menu.name,
            menuEmoji: menu.emoji,
            ingredients: dIngredients,
            active: true,
          },
        ];
      });
      log('Linked menu recipe', menu.name);
      ping('Menu recipe saved');
    }
    setModal(null);
  };

  const rawTotalValue = useMemo(
    () => rawMaterials.reduce((sum, m) => sum + (m.active ? m.quantity * m.costPerUnit : 0), 0),
    [rawMaterials],
  );

  const lowStockCount = useMemo(
    () => rawMaterials.filter((m) => m.active && m.quantity > 0 && m.quantity <= m.lowStockThreshold).length,
    [rawMaterials],
  );

  const outOfStockCount = useMemo(
    () => rawMaterials.filter((m) => m.active && m.quantity <= 0).length,
    [rawMaterials],
  );

  const readyToPrepCount = useMemo(
    () => subRecipes.filter((r) => r.active && checkCanMake(r.ingredients, 1).ok).length,
    [subRecipes, checkCanMake],
  );

  const shortagePrepCount = useMemo(
    () => subRecipes.filter((r) => r.active && !checkCanMake(r.ingredients, 1).ok).length,
    [subRecipes, checkCanMake],
  );

  const filteredRaw = useMemo(() => {
    let list = rawMaterials.filter(
      (m) => !q || m.name.toLowerCase().includes(q) || m.unit.toLowerCase().includes(q),
    );
    if (rawFilter === 'low') {
      list = list.filter((m) => m.active && m.quantity > 0 && m.quantity <= m.lowStockThreshold);
    } else if (rawFilter === 'out') {
      list = list.filter((m) => m.active && m.quantity <= 0);
    }
    return list;
  }, [rawMaterials, q, rawFilter]);

  const filteredSub = useMemo(() => {
    let list = subRecipes.filter(
      (r) => !q || r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q),
    );
    if (prepFilter === 'ready') {
      list = list.filter((r) => r.active && checkCanMake(r.ingredients, 1).ok);
    } else if (prepFilter === 'shortage') {
      list = list.filter((r) => r.active && !checkCanMake(r.ingredients, 1).ok);
    }
    return list;
  }, [subRecipes, q, prepFilter, checkCanMake]);

  const productRecipesCount = useMemo(
    () => finalRecipes.filter((r) => r.menuItemType !== 'addon').length,
    [finalRecipes],
  );

  const addonRecipesCount = useMemo(
    () => finalRecipes.filter((r) => r.menuItemType === 'addon').length,
    [finalRecipes],
  );

  const filteredFinal = useMemo(() => {
    let list = finalRecipes.filter(
      (r) => !q || r.menuItemName.toLowerCase().includes(q),
    );
    if (finalFilter === 'products') {
      list = list.filter((r) => r.menuItemType !== 'addon');
    } else if (finalFilter === 'addons') {
      list = list.filter((r) => r.menuItemType === 'addon');
    }
    return list;
  }, [finalRecipes, q, finalFilter]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2.5">
      {/* 1) Unified 3-Pillar Tabs */}
      <Segmented
        value={mainTab}
        onChange={(v) => {
          setMainTab(v);
          setSearch('');
        }}
        options={[
          {
            id: 'raw',
            label: 'Raw Materials',
            icon: <Box size={14} />,
            count: rawMaterials.length,
          },
          {
            id: 'intermediate',
            label: 'Prepared Items',
            icon: <Layers size={14} />,
            count: subRecipes.length,
          },
          {
            id: 'recipes',
            label: 'Product Recipes',
            icon: <BookOpen size={14} />,
            count: finalRecipes.length,
          },
        ]}
      />

      {/* 2) Action Toolbar: Search + Filter Chips + CTA */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search
              size={15}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                mainTab === 'raw'
                  ? 'Search materials...'
                  : mainTab === 'intermediate'
                    ? 'Search prep items...'
                    : 'Search product recipes...'
              }
              className="min-h-[44px] w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 ps-9 pe-3 text-[16px] sm:text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-mintcom-green focus:outline-none dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
            />
          </div>

          {mainTab === 'raw' && (
            <button
              type="button"
              onClick={() => openMaterial()}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-mintcom-green px-3 py-1.5 text-[13px] font-semibold text-white hover:opacity-95 shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} /><span className="hidden min-[380px]:inline">Add Material</span><span className="min-[380px]:hidden">Add</span>
            </button>
          )}

          {mainTab === 'intermediate' && (
            <button
              type="button"
              onClick={() => openSubRecipe()}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-mintcom-green px-3 py-1.5 text-[13px] font-semibold text-white hover:opacity-95 shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} /><span className="hidden min-[380px]:inline">Add Prep Recipe</span><span className="min-[380px]:hidden">Add</span>
            </button>
          )}

          {mainTab === 'recipes' && (
            <button
              type="button"
              onClick={() => openFinalRecipe()}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-mintcom-green px-3 py-1.5 text-[13px] font-semibold text-white hover:opacity-95 shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} /><span className="hidden min-[380px]:inline">Add Product Recipe</span><span className="min-[380px]:hidden">Add</span>
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {mainTab === 'raw' && (
            <>
              <button
                type="button"
                onClick={() => setRawFilter('all')}
                className={`rounded-[12px] px-3 py-2 min-h-[36px] text-[12px] font-semibold transition-colors ${
                  rawFilter === 'all'
                    ? 'bg-mintcom-green text-white shadow-sm'
                    : 'bg-[#E5E7EB] text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300'
                }`}
              >
                All ({rawMaterials.length})
              </button>
              <button
                type="button"
                onClick={() => setRawFilter('low')}
                className={`rounded-[12px] px-3 py-2 min-h-[36px] text-[12px] font-semibold transition-colors ${
                  rawFilter === 'low'
                    ? 'bg-[#F59E0B] text-white shadow-sm'
                    : 'bg-[#F59E0B]/15 text-[#D97706] hover:bg-[#F59E0B]/25'
                }`}
              >
                Low Stock ({lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => setRawFilter('out')}
                className={`rounded-[12px] px-3 py-2 min-h-[36px] text-[12px] font-semibold transition-colors ${
                  rawFilter === 'out'
                    ? 'bg-[#D55263] text-white shadow-sm'
                    : 'bg-[#D55263]/15 text-[#D55263] hover:bg-[#D55263]/25'
                }`}
              >
                Out of Stock ({outOfStockCount})
              </button>
            </>
          )}

          {mainTab === 'intermediate' && (
            <>
              <button
                type="button"
                onClick={() => setPrepFilter('all')}
                className={`rounded-[12px] px-3 py-2 min-h-[36px] text-[12px] font-semibold transition-colors ${
                  prepFilter === 'all'
                    ? 'bg-mintcom-green text-white shadow-sm'
                    : 'bg-[#E5E7EB] text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300'
                }`}
              >
                All ({subRecipes.length})
              </button>
              <button
                type="button"
                onClick={() => setPrepFilter('ready')}
                className={`rounded-[12px] px-3 py-2 min-h-[36px] text-[12px] font-semibold transition-colors ${
                  prepFilter === 'ready'
                    ? 'bg-mintcom-green text-white shadow-sm'
                    : 'bg-mintcom-green/15 text-mintcom-green hover:bg-mintcom-green/25'
                }`}
              >
                Ready to Prep ({readyToPrepCount})
              </button>
              <button
                type="button"
                onClick={() => setPrepFilter('shortage')}
                className={`rounded-[12px] px-3 py-2 min-h-[36px] text-[12px] font-semibold transition-colors ${
                  prepFilter === 'shortage'
                    ? 'bg-[#F59E0B] text-white shadow-sm'
                    : 'bg-[#F59E0B]/15 text-[#D97706] hover:bg-[#F59E0B]/25'
                }`}
              >
                Shortage ({shortagePrepCount})
              </button>
            </>
          )}

          {mainTab === 'recipes' && (
            <>
              <button
                type="button"
                onClick={() => setFinalFilter('all')}
                className={`rounded-[12px] px-3 py-2 min-h-[36px] text-[12px] font-semibold transition-colors ${
                  finalFilter === 'all'
                    ? 'bg-mintcom-green text-white shadow-sm'
                    : 'bg-[#E5E7EB] text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300'
                }`}
              >
                All ({finalRecipes.length})
              </button>
              <button
                type="button"
                onClick={() => setFinalFilter('products')}
                className={`rounded-[12px] px-3 py-2 min-h-[36px] text-[12px] font-semibold transition-colors ${
                  finalFilter === 'products'
                    ? 'bg-mintcom-green text-white shadow-sm'
                    : 'bg-mintcom-green/15 text-mintcom-green hover:bg-mintcom-green/25'
                }`}
              >
                Products ({productRecipesCount})
              </button>
              <button
                type="button"
                onClick={() => setFinalFilter('addons')}
                className={`rounded-[12px] px-3 py-2 min-h-[36px] text-[12px] font-semibold transition-colors ${
                  finalFilter === 'addons'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 dark:text-blue-400'
                }`}
              >
                Add-ons ({addonRecipesCount})
              </button>
            </>
          )}
        </div>

        {/* 3) KPI Metric Strip */}
        <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
          {mainTab === 'raw' && (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                  <Box size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Materials</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{rawMaterials.length} items</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#D97706]">
                  <AlertTriangle size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Stock Health</p>
                  <p className={`text-[13px] font-bold ${lowStockCount + outOfStockCount > 0 ? 'text-[#D97706]' : 'text-mintcom-green'}`}>
                    {lowStockCount + outOfStockCount > 0 ? `${lowStockCount + outOfStockCount} Alerts` : 'Optimal'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                  <CheckCircle2 size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Value</p>
                  <p className="text-[13px] font-bold text-mintcom-green">{money(rawTotalValue)}</p>
                </div>
              </div>
            </>
          )}

          {mainTab === 'intermediate' && (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Layers size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Prep Recipes</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{subRecipes.length} items</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                  <CheckCircle2 size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Ready to Prep</p>
                  <p className="text-[13px] font-bold text-mintcom-green">{readyToPrepCount} items</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                  <Package size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">In-Stock</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{subRecipes.filter(r => r.quantity > 0).length} stocked</p>
                </div>
              </div>
            </>
          )}

          {mainTab === 'recipes' && (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                  <BookOpen size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Recipes</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">{finalRecipes.length} recipes</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                  <CheckCircle2 size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Menu Linked</p>
                  <p className="text-[13px] font-bold text-mintcom-green">{finalRecipes.length} mapped</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                  <RotateCcw size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">POS Deduction</p>
                  <p className="text-[13px] font-bold text-mintcom-green">Auto-Active</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4) Card Grid / Empty States */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
        {/* RAW MATERIALS */}
        {mainTab === 'raw' && (
          <>
            {filteredRaw.length === 0 ? (
              <Empty
                icon={<Box size={48} />}
                title="No Raw Materials"
                body="Add raw materials to track your inventory"
              />
            ) : (
              <div className={cardGridCls}>
                {filteredRaw.map((m) => {
                  const status = getStockStatus(m);
                  return (
                    <Shell key={m.id} className="overflow-hidden">
                      <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between gap-2 p-[18px]">
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold leading-snug text-[#111827] dark:text-white">
                                {m.name}
                              </p>
                              <StatusPill active={m.active} />
                            </div>
                            <p className="text-[13px] text-[#6B7280] dark:text-mintcom-textSecondary">
                              Unit: {m.unit}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {m.active ? (
                              <>
                                <ActionChip
                                  tone="mint"
                                  label="Edit"
                                  onClick={() => openMaterial(m)}
                                >
                                  <Pencil size={16} />
                                </ActionChip>
                                <ActionChip
                                  tone="amber"
                                  label="Archive"
                                  onClick={() =>
                                    setModal({
                                      type: 'confirm',
                                      title: `Archive "${m.name}"`,
                                      body: `Archive "${m.name}"? It has usage or history, so it will become inactive instead of being deleted.`,
                                      onConfirm: () => {
                                        setRawMaterials((list) =>
                                          list.map((x) =>
                                            x.id === m.id ? { ...x, active: false } : x,
                                          ),
                                        );
                                        log('Archived raw material', m.name);
                                        setModal(null);
                                        ping('Material archived');
                                      },
                                    })
                                  }
                                >
                                  <Archive size={16} />
                                </ActionChip>
                              </>
                            ) : (
                              <ActionChip
                                tone="mint"
                                label="Reactivate"
                                onClick={() => {
                                  setRawMaterials((list) =>
                                    list.map((x) =>
                                      x.id === m.id ? { ...x, active: true } : x,
                                    ),
                                  );
                                  ping('Material reactivated');
                                }}
                              >
                                <RotateCcw size={16} />
                              </ActionChip>
                            )}
                          </div>
                        </div>

                        {/* Stock and cost info */}
                        <div className="flex items-start justify-between gap-6 border-t border-[#E5E7EB] px-4 pb-3 pt-3 dark:border-white/10">
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-[11px] font-semibold text-[#6B7280]">
                              Current Stock
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-lg font-bold tabular-nums leading-tight ${
                                  status === 'out'
                                    ? 'text-[#D55263]'
                                    : status === 'low'
                                      ? 'text-[#F59E0B]'
                                      : 'text-[#111827] dark:text-white'
                                }`}
                              >
                                {m.quantity.toFixed(2)} {m.unit}
                              </span>
                              {status !== 'ok' && (
                                <span
                                  className={`rounded-xl px-2 py-0.5 text-[11px] font-semibold ${
                                    status === 'out'
                                      ? 'bg-[#D55263]/15 text-[#D55263]'
                                      : 'bg-[#F59E0B]/20 text-[#D97706]'
                                  }`}
                                >
                                  {status === 'out' ? 'Out of Stock' : 'Low Stock'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-end">
                            <p className="mb-1 text-[11px] font-semibold text-[#6B7280]">
                              Cost per Unit
                            </p>
                            <p className="text-base font-semibold tabular-nums text-[#111827] dark:text-white">
                              {money(m.costPerUnit)}
                            </p>
                          </div>
                        </div>

                        {/* Restock Button */}
                        <button
                          type="button"
                          onClick={() => openRestock(m)}
                          disabled={!m.active}
                          className={`mx-3 mb-3 mt-2 flex items-center justify-center gap-1.5 rounded-xl py-2.5 min-h-[44px] text-sm font-semibold ${
                            m.active
                              ? 'bg-mintcom-green text-white hover:opacity-95 shadow-sm'
                              : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                          }`}
                        >
                          <Plus size={18} /> Restock
                        </button>
                      </div>
                    </Shell>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* PREPARED ITEMS */}
        {mainTab === 'intermediate' && (
          <>
            {filteredSub.length === 0 ? (
              <Empty
                icon={<Layers size={48} />}
                title="No Prepared Items"
                body="Create preparation recipes to produce intermediate ingredients"
              />
            ) : (
              <div className={cardGridCls}>
                {filteredSub.map((r) => {
                  const check = checkCanMake(r.ingredients, 1);
                  const canManufacture = r.active && check.ok;
                  return (
                    <Shell key={r.id} className="overflow-hidden">
                      <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between gap-2 p-[18px]">
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-[#111827] dark:text-white">
                                {r.name}
                              </p>
                              <StatusPill active={r.active} />
                            </div>
                            <p className="text-[13px] text-[#6B7280]">Prepared Prep Item</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {r.active ? (
                              <>
                                <ActionChip tone="mint" label="Edit" onClick={() => openSubRecipe(r)}>
                                  <Pencil size={16} />
                                </ActionChip>
                                <ActionChip
                                  tone="amber"
                                  label="Archive"
                                  onClick={() =>
                                    setModal({
                                      type: 'confirm',
                                      title: `Archive "${r.name}"`,
                                      body: `Archive "${r.name}"? It will become inactive instead of being deleted.`,
                                      onConfirm: () => {
                                        setSubRecipes((list) =>
                                          list.map((x) =>
                                            x.id === r.id ? { ...x, active: false } : x,
                                          ),
                                        );
                                        setModal(null);
                                        ping('Recipe archived');
                                      },
                                    })
                                  }
                                >
                                  <Archive size={16} />
                                </ActionChip>
                              </>
                            ) : (
                              <ActionChip
                                tone="mint"
                                label="Reactivate"
                                onClick={() => {
                                  setSubRecipes((list) =>
                                    list.map((x) =>
                                      x.id === r.id ? { ...x, active: true } : x,
                                    ),
                                  );
                                  ping('Recipe reactivated');
                                }}
                              >
                                <RotateCcw size={16} />
                              </ActionChip>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-6 border-t border-[#E5E7EB] px-4 pb-3 pt-3 dark:border-white/10">
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-[11px] font-semibold text-[#6B7280]">In Stock</p>
                            <p
                              className={`text-lg font-bold tabular-nums ${
                                r.quantity <= 0
                                  ? 'text-[#D55263]'
                                  : 'text-[#111827] dark:text-white'
                              }`}
                            >
                              {r.quantity.toFixed(2)} {r.yieldUnit}
                            </p>
                          </div>
                          <div className="shrink-0 text-end">
                            <p className="mb-1 text-[11px] font-semibold text-[#6B7280]">Yields</p>
                            <p className="text-base font-semibold tabular-nums text-[#111827] dark:text-white">
                              {fmtQty(r.yieldQty)} {r.yieldUnit}
                            </p>
                          </div>
                        </div>

                        <div className="mt-auto border-t border-dashed border-[#E5E7EB] bg-[#F8F9FA] p-3 dark:border-white/10 dark:bg-mintcom-dark/40">
                          <p className="mb-1.5 text-[10px] font-bold tracking-wide text-[#6B7280]">
                            Required ingredients
                          </p>
                          {r.ingredients.map((ing) => {
                            const have = getAvailable(ing);
                            const short = have + 1e-9 < ing.quantity;
                            return (
                              <div
                                key={ing.ingredientId}
                                className="mb-0.5 flex items-center justify-between gap-2"
                              >
                                <span className="min-w-0 flex-1 truncate text-xs text-[#111827] dark:text-white">
                                  {ing.ingredientName}
                                </span>
                                <span
                                  className={`shrink-0 text-xs font-medium tabular-nums ${
                                    short ? 'text-[#D55263]' : 'text-[#6B7280]'
                                  }`}
                                >
                                  {have.toFixed(1)} / {ing.quantity.toFixed(1)}
                                </span>
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            disabled={!r.active}
                            onClick={() => openManufacture(r)}
                            className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 min-h-[44px] text-sm font-semibold text-white shadow-sm ${
                              canManufacture
                                ? 'bg-mintcom-green hover:opacity-95'
                                : r.active
                                  ? 'bg-[#F59E0B] hover:opacity-95'
                                  : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                            }`}
                          >
                            <Wrench size={18} /> Produce Batch
                          </button>
                        </div>
                      </div>
                    </Shell>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* PRODUCT RECIPES */}
        {mainTab === 'recipes' && (
          <>
            {filteredFinal.length === 0 ? (
              <Empty
                icon={<BookOpen size={48} />}
                title="No Product Recipes"
                body="Add recipes to track ingredients used when selling products"
              />
            ) : (
              <div className={cardGridCls}>
                {filteredFinal.map((r) => (
                  <Shell
                    key={r.id}
                    className={`overflow-hidden ${!r.active ? 'border-[#94A3B8] opacity-75' : ''}`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between gap-2 p-[18px]">
                        <button
                          type="button"
                          onClick={() => r.active && openFinalRecipe(r)}
                          className="min-w-0 flex-1 text-start"
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-[#111827] dark:text-white">
                              {r.menuEmoji} {r.menuItemName}
                            </p>
                            <StatusPill active={r.active} />
                          </div>
                          <p className="text-[12px] text-[#6B7280]">
                            {r.ingredients.length} {r.ingredients.length === 1 ? 'ingredient' : 'ingredients'}
                          </p>
                        </button>
                        <div className="flex shrink-0 items-center gap-2">
                          {r.active ? (
                            <>
                              <ActionChip
                                tone="mint"
                                label="Edit"
                                onClick={() => openFinalRecipe(r)}
                              >
                                <Pencil size={16} />
                              </ActionChip>
                              <ActionChip
                                tone="amber"
                                label="Archive"
                                onClick={() =>
                                  setModal({
                                    type: 'confirm',
                                    title: `Archive "${r.menuItemName}"`,
                                    body: `Archive "${r.menuItemName}"? It will become inactive instead of being deleted.`,
                                    onConfirm: () => {
                                      setFinalRecipes((list) =>
                                        list.map((x) =>
                                          x.id === r.id ? { ...x, active: false } : x,
                                        ),
                                      );
                                      setModal(null);
                                      ping('Menu recipe archived');
                                    },
                                  })
                                }
                              >
                                <Archive size={16} />
                              </ActionChip>
                            </>
                          ) : (
                            <ActionChip
                              tone="mint"
                              label="Reactivate"
                              onClick={() => {
                                setFinalRecipes((list) =>
                                  list.map((x) =>
                                    x.id === r.id ? { ...x, active: true } : x,
                                  ),
                                );
                                ping('Menu recipe reactivated');
                              }}
                            >
                              <RotateCcw size={16} />
                            </ActionChip>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-[#E5E7EB] px-[18px] py-3 dark:border-white/10">
                        <p className="mb-2 text-[11px] font-semibold text-[#6B7280]">Ingredients</p>
                        {r.ingredients.map((ing) => (
                          <div
                            key={ing.ingredientId}
                            className="mb-1 flex items-center justify-between gap-2"
                          >
                            <span className="truncate text-[13px] text-[#111827] dark:text-white">
                              {ing.ingredientName}
                            </span>
                            <span className="shrink-0 text-[13px] tabular-nums text-[#6B7280]">
                              {fmtQty(ing.quantity)} {ing.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Shell>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals (mirror mintcom-pos ManufacturingInventoryScreen + RecipeManagementScreen) ── */}
      <AnimatePresence>
        {modal?.type === 'material' && (
          <ModalShell
            title={modal.edit ? 'Edit Raw Material' : 'Add Raw Material'}
            onClose={() => {
              setShowUnitPicker(false);
              setModal(null);
            }}
            footer={
              <FooterActions
                onCancel={() => {
                  setShowUnitPicker(false);
                  setModal(null);
                }}
                onConfirm={() => {
                  if (!dName.trim() || dName.trim().length < 2) {
                    setFieldErrors({ name: 'Material name must be at least 2 characters' });
                    return;
                  }
                  setFieldErrors({});
                  saveMaterial();
                }}
                confirmLabel="Save"
              />
            }
          >
            <Field label="Material Name" required error={fieldErrors.name}>
              <input
                className={`${inputCls} ${fieldErrors.name ? 'border-[#ef4444]' : ''}`}
                value={dName}
                onChange={(e) => {
                  setDName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
                }}
                placeholder="e.g., Flour, Tomatoes"
              />
            </Field>
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
              <Field label="Unit" required>
                <button
                  type="button"
                  onClick={() => {
                    setUnitPickerTarget('material');
                    setShowUnitPicker(true);
                  }}
                  className={`${inputCls} flex items-center justify-between text-start`}
                >
                  <span className={dUnit ? 'text-text-primary dark:text-white' : 'text-text-tertiary'}>
                    {dUnit ? UNIT_LABELS[dUnit] : 'Select unit'}
                  </span>
                  <ChevronDown size={18} className="text-text-secondary" />
                </button>
              </Field>
              <Field label="Initial Quantity">
                <input
                  className={inputNumericCls}
                  value={dQty}
                  inputMode="decimal"
                  onChange={(e) => setDQty(e.target.value)}
                  placeholder="0.00"
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
              <Field label="Cost per Unit ($)">
                <input
                  className={inputNumericCls}
                  value={dCost}
                  inputMode="numeric"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                    const cents = digits === '' ? 0 : parseInt(digits, 10);
                    setDCost((cents / 100).toFixed(2));
                  }}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Low Stock Threshold">
                <input
                  className={inputNumericCls}
                  value={dLow}
                  inputMode="decimal"
                  onChange={(e) => setDLow(e.target.value)}
                  placeholder="0.00"
                />
              </Field>
            </div>

            {/* Unit picker overlay — same as POS in-modal picker */}
            {showUnitPicker && unitPickerTarget === 'material' && (
              <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/40 p-3 sm:items-center">
                <div className="max-h-[70%] w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl dark:bg-mintcom-surface">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] px-[18px] py-4 dark:border-white/10">
                    <p className="text-[18px] font-bold text-text-primary dark:text-white">Select Unit</p>
                    <button type="button" onClick={() => setShowUnitPicker(false)}>
                      <X size={22} />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {UNITS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          setDUnit(u);
                          setShowUnitPicker(false);
                        }}
                        className={`flex w-full items-center justify-between border-b border-gray-100 px-4 py-3.5 text-start dark:border-white/8 ${
                          u === dUnit ? 'bg-mintcom-green/10' : ''
                        }`}
                      >
                        <span
                          className={`text-[15px] ${
                            u === dUnit ? 'font-semibold text-mintcom-green' : 'text-text-primary dark:text-white'
                          }`}
                        >
                          {UNIT_LABELS[u]}
                        </span>
                        {u === dUnit && <Check size={18} className="text-mintcom-green" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ModalShell>
        )}

        {modal?.type === 'restock' && (
          <ModalShell
            title={`Restock ${modal.material.name}`}
            onClose={() => setModal(null)}
            footer={
              <FooterActions
                onCancel={() => setModal(null)}
                onConfirm={saveRestock}
                confirmLabel="Restock"
              />
            }
          >
            <Field label={`Amount to Add (${modal.material.unit})`}>
              <input
                className={inputNumericCls}
                value={dQty}
                inputMode="decimal"
                onChange={(e) => setDQty(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </Field>
          </ModalShell>
        )}

        {modal?.type === 'manufacture' && (() => {
          const n = Math.max(1, Math.floor(parseFloat(batches) || 1));
          const check = checkCanMake(modal.recipe.ingredients, n);
          return (
            <ModalShell
              title="Manufacture Product"
              onClose={() => setModal(null)}
              footer={
                <FooterActions
                  onCancel={() => setModal(null)}
                  onConfirm={saveManufacture}
                  confirmLabel="Manufacture"
                  confirmDisabled={!check.ok}
                />
              }
            >
              <Field label="Batches to Produce">
                <input
                  className={inputNumericCls}
                  value={batches}
                  inputMode="numeric"
                  onChange={(e) => setBatches(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1"
                  autoFocus
                />
              </Field>

              <div className="rounded-xl border border-gray-100 bg-[#F9FAFB] p-3 dark:border-white/8 dark:bg-mintcom-dark">
                <p className="text-[13px] text-text-secondary">
                  Will produce:{' '}
                  <span className="font-semibold text-text-primary dark:text-white">
                    {fmtQty(modal.recipe.yieldQty * n)} {modal.recipe.yieldUnit}
                  </span>
                </p>

                <div className="mt-3 border-t border-gray-200 pt-3 dark:border-white/10">
                  <p className="mb-2 text-[13px] text-text-secondary">Required Ingredients</p>
                  <div className="space-y-2">
                    {modal.recipe.ingredients.map((ing) => {
                      const need = ing.quantity * n;
                      const have = getAvailable(ing);
                      const shortage = Math.max(0, need - have);
                      const short = shortage > 1e-9;
                      const raw = rawMaterials.find((m) => m.id === ing.ingredientId && m.active);
                      return (
                        <div
                          key={ing.ingredientId}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-medium text-text-primary dark:text-white">
                              {ing.ingredientName}
                            </p>
                            <p
                              className={`text-[12px] tabular-nums ${
                                short ? 'text-[#D55263]' : 'text-text-secondary'
                              }`}
                            >
                              {have.toFixed(1)} / {need.toFixed(1)}
                              {short ? ` (short: ${shortage.toFixed(1)})` : ''}
                            </p>
                          </div>
                          {short && raw && (
                            <button
                              type="button"
                              onClick={() => {
                                setDQty('');
                                setModal({ type: 'restock', material: raw });
                              }}
                              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-mintcom-green px-2 py-1 text-[12px] font-semibold text-mintcom-green"
                            >
                              <Plus size={14} /> Restock
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!check.ok && (
                  <button
                    type="button"
                    onClick={() => openSubRecipe(modal.recipe)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-mintcom-green py-2.5 text-[13px] font-semibold text-mintcom-green"
                  >
                    <Pencil size={14} /> Edit Recipe
                  </button>
                )}
              </div>
            </ModalShell>
          );
        })()}

        {modal?.type === 'sub-recipe' && (
          <ModalShell
            title={modal.edit ? 'Edit Recipe' : 'Add Sub-Recipe'}
            onClose={() => {
              setShowUnitPicker(false);
              setModal(null);
            }}
            footer={
              <FooterActions
                onCancel={() => {
                  setShowUnitPicker(false);
                  setModal(null);
                }}
                onConfirm={() => {
                  if (!dName.trim() || dName.trim().length < 2) {
                    setFieldErrors({ recipeName: 'Recipe name must be at least 2 characters' });
                    return;
                  }
                  if (dIngredients.length === 0) {
                    setFieldErrors({ ingredients: 'Add at least one ingredient' });
                    return;
                  }
                  setFieldErrors({});
                  saveSubRecipe();
                }}
                confirmLabel="Save"
              />
            }
          >
            <Field label="Recipe Name" required error={fieldErrors.recipeName}>
              <input
                className={`${inputCls} ${fieldErrors.recipeName ? 'border-[#ef4444]' : ''}`}
                value={dName}
                onChange={(e) => {
                  setDName(e.target.value);
                  if (fieldErrors.recipeName) setFieldErrors((p) => ({ ...p, recipeName: '' }));
                }}
                placeholder="e.g., Pizza Dough"
              />
            </Field>
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
              <Field label="Yield" required>
                <input
                  className={inputNumericCls}
                  value={dYield}
                  inputMode="decimal"
                  onChange={(e) => setDYield(e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Unit" required>
                <button
                  type="button"
                  onClick={() => {
                    setUnitPickerTarget('yield');
                    setShowUnitPicker(true);
                  }}
                  className={`${inputCls} flex items-center justify-between text-start`}
                >
                  <span>{UNIT_LABELS[dYieldUnit] || dYieldUnit}</span>
                  <ChevronDown size={18} className="text-text-secondary" />
                </button>
              </Field>
            </div>
            <IngredientEditor
              ings={dIngredients}
              setIngs={setDIngredients}
              options={ingredientOptions.filter((o) => o.source === 'raw')}
              addIngId={addIngId}
              setAddIngId={setAddIngId}
              addIngQty={addIngQty}
              setAddIngQty={setAddIngQty}
              onAdd={addIngredientToDraft}
              error={fieldErrors.ingredients}
            />
            {showUnitPicker && unitPickerTarget === 'yield' && (
              <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/40 p-3 sm:items-center">
                <div className="max-h-[70%] w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl dark:bg-mintcom-surface">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] px-[18px] py-4">
                    <p className="text-[18px] font-bold">Select Unit</p>
                    <button type="button" onClick={() => setShowUnitPicker(false)}>
                      <X size={22} />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {UNITS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          setDYieldUnit(u);
                          setShowUnitPicker(false);
                        }}
                        className={`flex w-full items-center justify-between border-b border-gray-100 px-4 py-3.5 text-start ${
                          u === dYieldUnit ? 'bg-mintcom-green/10' : ''
                        }`}
                      >
                        <span className={u === dYieldUnit ? 'font-semibold text-mintcom-green' : ''}>
                          {UNIT_LABELS[u]}
                        </span>
                        {u === dYieldUnit && <Check size={18} className="text-mintcom-green" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ModalShell>
        )}

        {modal?.type === 'final-recipe' && (
          <ModalShell
            title={modal.edit ? 'Edit Recipe' : 'Add Final Recipe'}
            onClose={() => setModal(null)}
            footer={
              <FooterActions
                onCancel={() => setModal(null)}
                onConfirm={() => {
                  if (dIngredients.length === 0) {
                    setFieldErrors({ ingredients: 'Add at least one ingredient' });
                    return;
                  }
                  setFieldErrors({});
                  saveFinalRecipe();
                }}
                confirmLabel="Save"
              />
            }
          >
            <Field label="Menu Item" required>
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none pe-10`}
                  value={dMenuId}
                  onChange={(e) => setDMenuId(e.target.value)}
                >
                  {MENU_TARGETS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary"
                />
              </div>
            </Field>
            <IngredientEditor
              ings={dIngredients}
              setIngs={setDIngredients}
              options={ingredientOptions}
              addIngId={addIngId}
              setAddIngId={setAddIngId}
              addIngQty={addIngQty}
              setAddIngQty={setAddIngQty}
              onAdd={addIngredientToDraft}
              error={fieldErrors.ingredients}
            />
          </ModalShell>
        )}

        {modal?.type === 'confirm' && (
          <ModalShell
            title={modal.title}
            onClose={() => setModal(null)}
            footer={
              <FooterActions
                onCancel={() => setModal(null)}
                onConfirm={modal.onConfirm}
                confirmLabel="Archive"
                danger
              />
            }
          >
            <p className="text-[14px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
              {modal.body}
            </p>
          </ModalShell>
        )}
      </AnimatePresence>

      <Toast msg={toast} />
    </div>
  );
}

function Empty({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 text-[#9CA3AF]">{icon}</div>
      <p className="text-[26px] font-bold tracking-[-0.6px] text-[#111827] dark:text-white">{title}</p>
      <p className="mt-3 max-w-sm text-base font-semibold leading-6 text-[#6B7280]">{body}</p>
    </div>
  );
}

/** Shared control height for ingredient add row — keeps Item / Qty / Add aligned */
const ingCtrlH = 'h-11';
const ingCtrlBase =
  `${ingCtrlH} rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-[16px] sm:text-[14px] outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-dark dark:text-white`;

function IngredientEditor({
  ings,
  setIngs,
  options,
  addIngId,
  setAddIngId,
  addIngQty,
  setAddIngQty,
  onAdd,
  error,
}: {
  ings: Ingredient[];
  setIngs: (ings: Ingredient[]) => void;
  options: { id: string; name: string; unit: Unit; source: 'raw' | 'intermediate'; label: string }[];
  addIngId: string;
  setAddIngId: (id: string) => void;
  addIngQty: string;
  setAddIngQty: (q: string) => void;
  onAdd: () => void;
  error?: string;
}) {
  return (
    <div className="mb-1">
      <p className="mb-2 text-[14px] font-normal text-text-secondary">
        Ingredients <span className="text-[#ef4444]">*</span>
      </p>
      {error && <p className="mb-2 text-[12px] text-[#ef4444]">{error}</p>}
      {ings.length === 0 && (
        <p className="mb-2 text-[13px] text-text-tertiary">No ingredients yet. Add one below.</p>
      )}
      <div className="mb-3 space-y-1.5">
        {ings.map((ing) => (
          <div
            key={ing.ingredientId}
            className="flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 dark:border-white/10 dark:bg-mintcom-dark"
          >
            <span className="min-w-0 flex-1 truncate text-[14px] font-medium dark:text-white">
              {ing.ingredientName}
            </span>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums text-mintcom-green">
              {fmtQty(ing.quantity)} {ing.unit}
            </span>
            <button
              type="button"
              onClick={() => setIngs(ings.filter((i) => i.ingredientId !== ing.ingredientId))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#D55263] hover:bg-[#D55263]/10"
              aria-label="Remove ingredient"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Add row: stacked on phones, aligned strip on sm+ */}
      <div className="rounded-xl border border-dashed border-[#E5E7EB] p-3 dark:border-white/10">
        <div className="grid grid-cols-1 min-[380px]:grid-cols-[1fr_4.5rem_auto] items-end gap-2">
          <div className="min-w-0">
            <span className="mb-1.5 block text-[12px] leading-none text-text-secondary">Item</span>
            <div className="relative">
              <select
                className={`${ingCtrlBase} w-full appearance-none truncate pe-8 ps-3 font-medium text-text-primary`}
                value={addIngId}
                onChange={(e) => setAddIngId(e.target.value)}
              >
                {options.length === 0 && <option value="">No items</option>}
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.unit})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-text-secondary"
              />
            </div>
          </div>
          <div className="min-w-0">
            <span className="mb-1.5 block text-[12px] leading-none text-text-secondary">Qty</span>
            <input
              className={`${ingCtrlBase} w-full px-2 text-center text-[15px] font-bold tabular-nums`}
              value={addIngQty}
              inputMode="decimal"
              onChange={(e) => setAddIngQty(e.target.value)}
              placeholder="1"
            />
          </div>
          <div>
            {/* spacer matches label line height so button lines up with fields */}
            <span className="mb-1.5 block h-3" aria-hidden />
            <button
              type="button"
              onClick={onAdd}
              disabled={!addIngId}
              className={`${ingCtrlH} inline-flex shrink-0 items-center justify-center gap-1 rounded-xl bg-mintcom-green px-3.5 text-[13px] font-bold text-white disabled:opacity-40`}
            >
              <Plus size={15} strokeWidth={2.5} /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

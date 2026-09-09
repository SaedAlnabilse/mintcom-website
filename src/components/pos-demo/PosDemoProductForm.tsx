/**
 * Demo Add/Edit Product modal — mirrors mintcom-pos ItemForm:
 * Name · Category · Cost · Price · Tax/Net · Description ·
 * Image/emoji · Track stock + thresholds · Add-ons multi-select ·
 * Footer Cancel / Save (edit: Remove + Cancel + Save)
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  HelpCircle,
  ImagePlus,
  Layers,
  Package,
  Percent,
  X,
} from 'lucide-react';

export type DemoProductFormValue = {
  id?: string;
  name: string;
  price: number;
  costPrice: number;
  emoji: string;
  categoryId: string;
  active: boolean;
  description: string;
  trackStock: boolean;
  availableStock: number;
  yellowThreshold: number;
  redThreshold: number;
  allowNegativeStock: boolean;
  attributeIds: string[];
  imageDataUrl?: string | null;
  taxId?: string | null;
  taxRate?: number;
};

type CategoryOpt = { id: string; name: string; emoji: string };
type AddonOpt = { id: string; name: string; multi?: boolean };
export type DemoTaxOpt = {
  id: string;
  name: string;
  rate: number;
  isDefault?: boolean;
};

type Props = {
  open: boolean;
  mode: 'add' | 'edit';
  initial?: Partial<DemoProductFormValue> | null;
  categories: CategoryOpt[];
  addons: AddonOpt[];
  taxes?: DemoTaxOpt[];
  taxRate?: number;
  /** true = product has no sales history → hard delete; false = archive. */
  willHardDelete?: boolean;
  onClose: () => void;
  onSave: (value: DemoProductFormValue) => void;
  onRemove?: () => void;
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? 'bg-mintcom-green' : 'bg-gray-300 dark:bg-mintcom-tertiary'
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          on ? 'start-5' : 'start-0.5'
        }`}
      />
    </button>
  );
}

function atmDisplay(cents: number) {
  return (cents / 100).toFixed(2);
}

function parseAtm(raw: string, maxCents = 99999999) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (!digits) return 0;
  return Math.min(maxCents, parseInt(digits, 10));
}


export function DemoProductFormModal({
  open,
  mode,
  initial,
  categories,
  addons,
  taxes,
  taxRate = 8,
  willHardDelete = false,
  onClose,
  onSave,
  onRemove,
}: Props) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [costCents, setCostCents] = useState(0);
  const [priceCents, setPriceCents] = useState(0);
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [trackStock, setTrackStock] = useState(false);
  const [availableStock, setAvailableStock] = useState('0');
  const [yellowThreshold, setYellowThreshold] = useState('5');
  const [redThreshold, setRedThreshold] = useState('2');
  const [allowNegative, setAllowNegative] = useState(false);
  const [attributeIds, setAttributeIds] = useState<string[]>([]);
  const [selectedTaxId, setSelectedTaxId] = useState<string>('');
  const [taxOpen, setTaxOpen] = useState(false);
  const [addonOpen, setAddonOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stockRef = useRef<HTMLDivElement>(null);

  const effectiveTaxes: DemoTaxOpt[] = useMemo(() => {
    if (taxes && taxes.length > 0) return taxes;
    return [
      { id: 'tax-default', name: 'Sales Tax', rate: (taxRate ?? 8) / 100, isDefault: true },
    ];
  }, [taxes, taxRate]);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setCategoryId(initial?.categoryId ?? categories[0]?.id ?? '');
    setCostCents(Math.round((initial?.costPrice ?? 0) * 100));
    setPriceCents(Math.round((initial?.price ?? 0) * 100));
    setDescription(initial?.description ?? '');
    setEmoji(initial?.emoji ?? '');
    setImageDataUrl(initial?.imageDataUrl ?? null);
    setTrackStock(initial?.trackStock ?? false);
    setAvailableStock(String(initial?.availableStock ?? 0));
    setYellowThreshold(String(initial?.yellowThreshold ?? 5));
    setRedThreshold(String(initial?.redThreshold ?? 2));
    setAllowNegative(initial?.allowNegativeStock ?? false);
    setAttributeIds(initial?.attributeIds ?? []);
    const defaultTaxId = effectiveTaxes.find((t) => t.isDefault)?.id || effectiveTaxes[0]?.id || '';
    setSelectedTaxId(initial?.taxId || defaultTaxId);
    setTaxOpen(false);
    setErrors({});
    setShowDeleteConfirm(false);
    setSaving(false);
  }, [open, initial, categories, effectiveTaxes]);

  const selectedTax = useMemo(() => {
    return (
      effectiveTaxes.find((t) => t.id === selectedTaxId) ||
      effectiveTaxes.find((t) => t.isDefault) ||
      effectiveTaxes[0] ||
      null
    );
  }, [effectiveTaxes, selectedTaxId]);

  const effectiveTaxRate = useMemo(() => {
    if (!selectedTax) return taxRate ?? 8;
    return selectedTax.rate >= 1
      ? selectedTax.rate
      : Number((selectedTax.rate * 100).toFixed(2));
  }, [selectedTax, taxRate]);

  const price = priceCents / 100;
  const cost = costCents / 100;
  const taxShare = useMemo(() => {
    if (effectiveTaxRate <= 0) return 0;
    const rate = effectiveTaxRate / 100;
    // Inclusive: tax is extracted from the shelf price (mirrors POS ItemForm).
    return price - price / (1 + rate);
  }, [price, effectiveTaxRate]);
  const netPrice = Math.max(0, price - taxShare);

  if (!open) return null;

  const setError = (key: string, msg: string) =>
    setErrors((e) => ({ ...e, [key]: msg }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Name is required (min 2 characters)';
    if (!categoryId) next.category = 'Select a category';
    if (priceCents <= 0) next.price = 'Settlement price is required';
    if (trackStock) {
      const stock = parseInt(availableStock, 10);
      if (!Number.isFinite(stock) || stock < 0) next.stock = 'Enter stock quantity';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    window.setTimeout(() => {
      onSave({
        id: initial?.id,
        name: name.trim(),
        price,
        costPrice: cost,
        emoji: emoji || '',
        categoryId,
        active: initial?.active ?? true,
        description: description.trim(),
        trackStock,
        availableStock: trackStock ? Math.max(0, parseInt(availableStock, 10) || 0) : 0,
        yellowThreshold: trackStock ? Math.max(0, parseInt(yellowThreshold, 10) || 0) : 0,
        redThreshold: trackStock ? Math.max(0, parseInt(redThreshold, 10) || 0) : 0,
        allowNegativeStock: trackStock ? allowNegative : false,
        attributeIds,
        imageDataUrl,
        taxId: selectedTax?.id ?? null,
        taxRate: effectiveTaxRate,
      });
      setSaving(false);
    }, 280);
  };

  const onPickImage = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setImageDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleAttr = (id: string) => {
    setAttributeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  // Mirrors ItemForm: enabling stock tracking scrolls the section into view.
  const handleTrackStock = (next: boolean) => {
    setTrackStock(next);
    if (next) {
      window.setTimeout(() => {
        stockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 140);
    }
  };

  return (
    <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-2.5">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex max-h-[min(560px,90%)] w-full max-w-[min(94%,560px)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-white/8">
          <div className="w-6" />
          <h3 className="text-lg font-semibold text-text-primary dark:text-white">
            {mode === 'edit' ? 'Edit product' : 'Add product'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-text-tertiary hover:bg-cream-100 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {/* Image Upload */}
          <div className="mb-4 flex flex-col items-center">
            <div className="relative mb-2">
              {imageDataUrl ? (
                <img
                  src={imageDataUrl}
                  alt=""
                  className="h-[120px] w-[120px] rounded-xl border-2 border-gray-200 object-cover dark:border-white/10"
                />
              ) : (
                <div className="flex h-[120px] w-[120px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-cream-50 text-text-tertiary dark:border-white/10 dark:bg-mintcom-dark">
                  <Package size={40} className="opacity-30" />
                </div>
              )}
              {imageDataUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageDataUrl(null);
                  }}
                  className="absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-mintcom-red text-white shadow"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-2.5 text-xs font-bold text-text-secondary hover:border-mintcom-green hover:text-mintcom-green dark:border-white/15">
              <ImagePlus size={16} />
              Upload photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
            </label>
          </div>

          {/* Name + Category row */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Product name <span className="text-mintcom-red">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value.slice(0, 80));
                  if (errors.name) setError('name', '');
                }}
                placeholder="e.g. Latte"
                className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-mintcom-green dark:bg-mintcom-dark dark:text-white ${
                  errors.name ? 'border-mintcom-red' : 'border-gray-200 dark:border-mintcom-tertiary'
                }`}
              />
              {errors.name && <p className="mt-1 text-[11px] font-bold text-mintcom-red">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Category <span className="text-mintcom-red">*</span>
              </label>
              <div
                className={`flex items-center gap-2 rounded-xl border bg-white px-3 dark:bg-mintcom-dark ${
                  errors.category ? 'border-mintcom-red' : 'border-gray-200 dark:border-mintcom-tertiary'
                }`}
              >
                <Layers size={16} className="shrink-0 text-mintcom-green" />
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    if (errors.category) setError('category', '');
                  }}
                  className="w-full bg-transparent py-2.5 text-sm outline-none dark:text-white"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.category && (
                <p className="mt-1 text-[11px] font-bold text-mintcom-red">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Financial grid */}
          <div className="mb-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#eaebed] p-3 dark:bg-mintcom-dark">
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="text-[11px] tracking-wide text-gray-500">Acquisition cost</span>
                  <span title="What you pay for the item (base cost)">
                    <HelpCircle size={12} className="text-gray-400" />
                  </span>
                </div>
                <div className="flex h-11 items-center rounded-xl bg-white px-2 dark:bg-mintcom-surface">
                  <span className="me-2 flex h-8 items-center rounded-xl bg-gray-200 px-2 text-xs font-bold text-gray-600">
                    $
                  </span>
                  <input
                    value={atmDisplay(costCents)}
                    onChange={(e) => setCostCents(parseAtm(e.target.value))}
                    inputMode="numeric"
                    className="w-full bg-transparent text-base font-semibold outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[#eaebed] p-3 dark:bg-mintcom-dark">
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="text-[11px] tracking-wide text-gray-500">
                    Settlement value <span className="text-mintcom-red">*</span>
                  </span>
                  <span title="Retail price charged to the customer (tax included)">
                    <HelpCircle size={12} className="text-gray-400" />
                  </span>
                </div>
                <div
                  className={`flex h-11 items-center rounded-xl bg-white px-2 dark:bg-mintcom-surface ${
                    errors.price ? 'ring-2 ring-mintcom-red' : 'ring-1 ring-mintcom-green'
                  }`}
                >
                  <span className="me-2 flex h-8 items-center rounded-xl bg-mintcom-green/20 px-2 text-xs font-bold text-mintcom-green">
                    $
                  </span>
                  <input
                    value={atmDisplay(priceCents)}
                    onChange={(e) => {
                      setPriceCents(parseAtm(e.target.value));
                      if (errors.price) setError('price', '');
                    }}
                    inputMode="numeric"
                    className="w-full bg-transparent text-lg font-bold outline-none dark:text-white"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-[11px] font-bold text-mintcom-red">{errors.price}</p>
                )}
              </div>
            </div>

            {/* Tax Selection — mirrors POS ItemForm & web ProductFormModal */}
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-mintcom-dark">
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Tax rate
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setTaxOpen((v) => !v);
                    setAddonOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-start text-sm outline-none transition-colors dark:bg-mintcom-surface ${
                    taxOpen ? 'border-mintcom-green ring-1 ring-mintcom-green' : 'border-gray-200 dark:border-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate text-text-primary dark:text-white">
                    <Percent size={15} className="shrink-0 text-mintcom-green" />
                    <span className="font-semibold">
                      {selectedTax
                        ? `${effectiveTaxRate}% — ${selectedTax.name}${selectedTax.isDefault ? ' (Default)' : ''}`
                        : `${effectiveTaxRate}% Standard Tax`}
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-text-tertiary transition-transform ${taxOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {taxOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setTaxOpen(false)} />
                    <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-mintcom-surface">
                      {effectiveTaxes.map((t) => {
                        const isSelected = selectedTax?.id === t.id;
                        const ratePct = t.rate >= 1 ? t.rate : Number((t.rate * 100).toFixed(2));
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTaxId(t.id);
                              setTaxOpen(false);
                            }}
                            className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2.5 text-start text-sm hover:bg-cream-100 dark:hover:bg-white/5"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-lg border ${
                                  isSelected
                                    ? 'border-mintcom-green bg-mintcom-green text-white'
                                    : 'border-gray-300 dark:border-white/20'
                                }`}
                              >
                                {isSelected && <Check size={13} />}
                              </span>
                              <span className="font-medium text-text-primary dark:text-white">
                                {t.name}
                                {t.isDefault && (
                                  <span className="ms-1.5 text-[11px] text-text-tertiary">
                                    (Default)
                                  </span>
                                )}
                              </span>
                            </span>
                            <span className="text-xs font-bold text-mintcom-green">
                              {ratePct}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="min-h-[64px] rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-mintcom-dark">
                <p className="text-[10px] tracking-wide text-gray-500">
                  {selectedTax ? selectedTax.name : 'Tax rate'}
                </p>
                <p className="text-lg font-bold dark:text-white">{effectiveTaxRate}%</p>
              </div>
              <div className="min-h-[64px] rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-mintcom-dark">
                <p className="text-[10px] tracking-wide text-mintcom-green">Tax included</p>
                <p className="text-lg font-bold text-mintcom-green">{taxShare.toFixed(2)} $</p>
              </div>
              <div className="min-h-[64px] rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-mintcom-dark">
                <p className="text-[10px] tracking-wide text-gray-500">Net (excl. tax)</p>
                <p className="text-lg font-bold dark:text-white">{netPrice.toFixed(2)} $</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[12px] font-medium text-text-secondary">
                Description <span className="text-indigo-500">(optional)</span>
              </label>
              <span
                className={`text-[11px] ${
                  description.length >= 200 ? 'text-mintcom-red' : 'text-text-tertiary'
                }`}
              >
                {description.length}/200
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              rows={3}
              placeholder="Short note shown on menus / kitchen tickets…"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-mintcom-green dark:border-mintcom-tertiary dark:bg-mintcom-dark dark:text-white"
            />
          </div>

          {/* Add-ons — multi-select dropdown (mirrors ItemForm MultiSelectDropdown) */}
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-text-primary dark:text-white">Select Add-ons</p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAddonOpen((v) => !v)}
                disabled={addons.length === 0}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-3 text-start text-sm outline-none focus:border-mintcom-green dark:bg-mintcom-dark ${
                  addonOpen ? 'border-mintcom-green' : 'border-gray-200 dark:border-mintcom-tertiary'
                } ${addons.length === 0 ? 'opacity-60' : ''}`}
              >
                <span className={`truncate ${attributeIds.length ? 'text-text-primary dark:text-white' : 'text-text-tertiary'}`}>
                  {addons.length === 0
                    ? 'No add-ons available'
                    : attributeIds.length === 0
                      ? 'Select add-ons'
                      : addons
                          .filter((a) => attributeIds.includes(a.id))
                          .map((a) => a.name)
                          .join(', ')}
                </span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-text-tertiary transition-transform ${addonOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {addonOpen && addons.length > 0 && (
                <>
                  <div className="absolute inset-0 z-10" onClick={() => setAddonOpen(false)} />
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-mintcom-surface">
                    {addons.map((a) => {
                      const on = attributeIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleAttr(a.id)}
                          className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2.5 text-start text-sm hover:bg-cream-100 dark:hover:bg-white/5"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-xl border ${
                                on ? 'border-mintcom-green bg-mintcom-green text-white' : 'border-gray-300 dark:border-white/20'
                              }`}
                            >
                              {on && <Check size={13} />}
                            </span>
                            <span className="text-text-primary dark:text-white">{a.name}</span>
                          </span>
                          <span className="text-[10px] font-medium text-text-tertiary">
                            {a.multi ? 'Multi-select' : 'Single choice'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <p className="mt-2 text-[11px] text-text-tertiary">
              Linked add-ons appear when cashiers tap this product on Sales.
            </p>
          </div>

          {/* Track stock */}
          <div
            ref={stockRef}
            className={`mb-3 scroll-mt-3 overflow-hidden rounded-xl border ${
              trackStock ? 'border-mintcom-green' : 'border-gray-200 dark:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-mintcom-green" />
                <div>
                  <p className="text-sm font-bold dark:text-white">Stock Applies</p>
                  <p className="text-[11px] text-text-tertiary">Track inventory for this product</p>
                </div>
              </div>
              <Toggle on={trackStock} onToggle={() => handleTrackStock(!trackStock)} />
            </div>
            {trackStock && (
            <div className="space-y-3 border-t border-gray-100 bg-cream-50/60 p-3 dark:border-white/8 dark:bg-mintcom-dark/50">
              <div>
                <label className="mb-1 block text-center text-[12px] text-text-secondary">
                  Available Stock
                </label>
                <input
                  value={availableStock}
                  onChange={(e) => setAvailableStock(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  className={`w-full rounded-xl border bg-white py-2.5 text-center text-sm outline-none dark:bg-mintcom-surface dark:text-white ${
                    errors.stock ? 'border-mintcom-red' : 'border-gray-200 dark:border-mintcom-tertiary'
                  }`}
                />
                {errors.stock && (
                  <p className="mt-1 text-center text-[11px] font-bold text-mintcom-red">{errors.stock}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 flex items-center justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-[12px] text-text-secondary">Yellow alert</span>
                  </div>
                  <input
                    value={yellowThreshold}
                    onChange={(e) => setYellowThreshold(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-center text-sm outline-none dark:border-mintcom-tertiary dark:bg-mintcom-surface dark:text-white"
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-mintcom-red" />
                    <span className="text-[12px] text-text-secondary">Red alert</span>
                  </div>
                  <input
                    value={redThreshold}
                    onChange={(e) => setRedThreshold(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-center text-sm outline-none dark:border-mintcom-tertiary dark:bg-mintcom-surface dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-mintcom-surface">
                <div>
                  <p className="text-sm font-bold dark:text-white">Allow Overselling</p>
                  <p className="text-[12px] text-text-tertiary">Sell when stock hits zero</p>
                </div>
                <Toggle on={allowNegative} onToggle={() => setAllowNegative((v) => !v)} />
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-3.5 dark:border-white/8">
          {mode === 'edit' && onRemove && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-xl bg-mintcom-red px-4 py-2.5 text-xs font-semibold text-white"
            >
              {willHardDelete ? 'Delete' : 'Archive'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-semibold text-text-secondary dark:border-white/10 dark:bg-mintcom-dark dark:text-mintcom-textSecondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-[1.2] rounded-xl bg-mintcom-green py-2.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : mode === 'edit' ? 'Save' : 'Add item'}
          </button>
        </div>
      </motion.div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-[95] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[min(94%,340px)] rounded-xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-mintcom-surface">
            <p className="text-base font-black dark:text-white">
              {willHardDelete ? 'Delete product?' : 'Archive product?'}
            </p>
            <p className="mt-1 text-[12px] text-text-secondary">
              {willHardDelete
                ? `“${name || 'This item'}” has no sales history and will be permanently deleted. This cannot be undone.`
                : `“${name || 'This item'}” has sales history, so it will be archived (hidden from new sales). Historical receipts keep their snapshots.`}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold dark:border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onRemove?.();
                }}
                className="flex-1 rounded-xl bg-mintcom-red py-2.5 text-xs font-black text-white"
              >
                {willHardDelete ? 'Delete' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

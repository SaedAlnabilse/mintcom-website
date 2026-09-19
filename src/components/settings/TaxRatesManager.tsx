import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Percent, Plus, Trash2, Settings2, X, Search, Edit3 } from 'lucide-react';
import api, { extractErrorMessage } from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../ConfirmModal';
import { EmptyState, ModalCloseButton } from '../ui';

interface TaxRate {
  id: string;
  name: string;
  rate: string | number;
  isDefault: boolean;
}

interface EditorState {
  id: string | null;
  name: string;
  ratePercent: string;
  isDefault?: boolean;
}

const emptyEditor: EditorState = {
  id: null,
  name: '',
  ratePercent: '',
};

/**
 * Normalize a typed percent: comma-locale decimal separators (and the Arabic
 * decimal separator/digits) behave like a dot; thousands commas are dropped.
 * Without this, typing "0,1" sanitized to "01" and saved a 1% tax instead
 * of 0.1%.
 */
const sanitizePercentInput = (value: string): string => {
  let out = value
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/٬/g, '')
    .replace(/٫/g, '.');
  const commaCount = (out.match(/,/g) || []).length;
  if (commaCount > 1) {
    out = out.replace(/,/g, '');
  } else if (commaCount === 1) {
    out = out.replace(/,/g, '.');
  }
  out = out.replace(/[^0-9.]/g, '');
  const firstDot = out.indexOf('.');
  if (firstDot !== -1) {
    out = out.slice(0, firstDot + 1) + out.slice(firstDot + 1).replace(/\./g, '');
  }
  return out;
};

export function TaxRatesManager() {
  const { t } = useTranslation();
  const [taxes, setTaxes] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaxRate | null>(null);
  const [deleteReferencedCount, setDeleteReferencedCount] = useState<number>(0);
  const [loadingImpact, setLoadingImpact] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/taxes', { params: { includeInactive: true } });
      const data = Array.isArray(res.data) ? res.data : [];
      setTaxes(data);
    } catch {
      setTaxes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => setEditor({ ...emptyEditor });
  const openEdit = (tax: TaxRate) =>
    setEditor({
      id: tax.id,
      name: tax.name,
      ratePercent: (Number(tax.rate) * 100).toFixed(2),
      isDefault: tax.isDefault,
    });

  const handleSave = async () => {
    if (!editor) return;
    if (!editor.name.trim()) {
      toast.error(t('settings.taxes.nameRequired', 'Tax name is required'));
      return;
    }
    const percent = parseFloat(editor.ratePercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      toast.error(t('settings.taxes.rateInvalid', 'Enter a rate between 0 and 100'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editor.name.trim(),
        rate: Number((percent / 100).toFixed(6)),
      };
      if (editor.id) {
        await api.patch(`/api/taxes/${editor.id}`, payload);
      } else {
        await api.post('/api/taxes', payload);
      }
      toast.success(t('settings.taxes.saved', 'Tax rate saved'));
      setEditor(null);
      await load();
      window.dispatchEvent(new Event('mintcom:taxes-updated'));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = async (tax: TaxRate) => {
    if (tax.isDefault) {
      toast.error(t('settings.taxes.cannotDeleteDefault', 'The default tax rate cannot be deleted. You can edit it instead.'));
      return;
    }
    if (loadingImpact) return;
    setDeleteTarget(tax);
    setDeleteReferencedCount(0);
    setLoadingImpact(true);
    try {
      const res = await api.get(`/api/taxes/${tax.id}/delete-impact`);
      setDeleteReferencedCount(Number(res.data?.referencedItems || 0));
    } catch {
      setDeleteReferencedCount(0);
    } finally {
      setLoadingImpact(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    // Taxes are archive-only server-side (never hard-deleted): a referenced
    // rate is deactivated, an unused one removed. Mirror that in the toast so
    // the wording matches the products/attributes/discounts contract.
    const wasReferenced = deleteReferencedCount > 0;
    try {
      await api.delete(`/api/taxes/${deleteTarget.id}`);
      toast.success(
        wasReferenced
          ? t('settings.taxes.deactivated', { defaultValue: 'Tax rate deactivated — assigned products now use your default Sales Tax' })
          : t('settings.taxes.deleted', 'Tax rate deleted successfully'),
      );
      setDeleteTarget(null);
      await load();
      window.dispatchEvent(new Event('mintcom:taxes-updated'));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = taxes.filter((tax) =>
    !filter || tax.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <div className="h-10 w-40 rounded-xl bg-stone-100 dark:bg-zinc-800 animate-pulse mb-3" />
        <div className="h-28 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-100 dark:border-zinc-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shrink-0">
            <Percent size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black tracking-tight text-stone-900 dark:text-zinc-100 leading-none">
              {t('settings.taxes.title', 'Taxes')}
            </h4>
            <p className="text-xs font-semibold text-stone-500 dark:text-zinc-400 leading-none mt-1">
              {t('settings.taxes.subtitle', 'Standard default sales tax · add custom rates per product')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-mintcom-green hover:bg-mintcom-green/90 active:bg-mintcom-green/80 text-black text-xs font-semibold tracking-wide transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          {t('settings.taxes.add', 'Add Tax')}
        </button>
      </div>

      {/* Search */}
      {taxes.length > 2 && (
        <div className="relative">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('settings.taxes.searchPlaceholder', 'Search tax rates…')}
            className="w-full pl-9 pr-9 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-400 hover:text-stone-600"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {taxes.length === 0 && (
        <EmptyState
          icon={Settings2}
          title={t('settings.taxes.emptyTitle', 'No tax rates yet')}
          description={t('settings.taxes.emptyDesc', 'Set up your standard sales tax rate or add custom rates.')}
          action={
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-mintcom-green hover:bg-mintcom-green/90 active:bg-mintcom-green/80 text-black text-xs font-semibold"
            >
              <Plus size={14} strokeWidth={2.5} />
              {t('settings.taxes.createFirst', 'Create tax rate')}
            </button>
          }
        />
      )}

      {/* No matches after filtering */}
      {taxes.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 px-6 py-6 text-center">
          <p className="text-xs font-bold text-stone-400">
            {t('settings.taxes.noMatches', 'No rates match “{{q}}”', { q: filter })}
          </p>
          <button
            type="button"
            onClick={() => setFilter('')}
            className="mt-2 text-xs font-black text-mintcom-green hover:underline"
          >
            {t('common.clearSearch', 'Clear search')}
          </button>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="hidden sm:grid grid-cols-[1fr_120px_100px] gap-4 px-5 py-2.5 bg-stone-50 dark:bg-zinc-800 border-b border-stone-100 dark:border-zinc-800">
            <span className="text-[10px] font-black tracking-widest text-stone-400 uppercase">{t('settings.taxes.colName', 'Name')}</span>
            <span className="text-[10px] font-black tracking-widest text-stone-400 uppercase text-right">{t('settings.taxes.colRate', 'Rate')}</span>
            <span className="text-[10px] font-black tracking-widest text-stone-400 uppercase text-right">{t('common.actions', 'Actions')}</span>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-zinc-800">
            {filtered.map((tax) => (
              <div
                key={tax.id}
                className="grid sm:grid-cols-[1fr_120px_100px] gap-2 sm:gap-4 px-5 py-3.5 items-center hover:bg-stone-50/60 dark:hover:bg-zinc-800/40 transition-colors"
              >
                {/* Name + default text */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-bold text-stone-900 dark:text-zinc-100 truncate">{tax.name}</span>
                  {tax.isDefault && (
                    <span className="text-xs font-semibold text-stone-400 dark:text-zinc-500 shrink-0">
                      ({t('common.default', 'Default')})
                    </span>
                  )}
                </div>

                {/* Rate */}
                <div className="flex sm:justify-end items-center">
                  <span className="text-sm font-black tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums">
                    {(Number(tax.rate) * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(tax)}
                    title={t('common.edit', 'Edit')}
                    className="h-8 px-2.5 inline-flex items-center gap-1 rounded-xl bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-xs font-bold text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Edit3 size={13} />
                    <span>{t('common.edit', 'Edit')}</span>
                  </button>
                  {!tax.isDefault && (
                    <button
                      type="button"
                      title={t('common.delete', 'Delete')}
                      onClick={() => handleDeleteRequest(tax)}
                      className="w-8 h-8 grid place-items-center rounded-xl border border-red-200/60 dark:border-red-500/20 bg-white dark:bg-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-2.5 bg-stone-50/60 dark:bg-zinc-800/40 border-t border-stone-100 dark:border-zinc-800">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 leading-relaxed">
              {t('settings.taxes.footnote', 'The default tax rate applies automatically to new products. Custom tax rates can be selected on individual products.')}
            </p>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editor && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && setEditor(null)} />
          <div className="relative w-full sm:max-w-[440px] bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black tracking-tight text-stone-900 dark:text-zinc-100">
                  {editor.id
                    ? (editor.isDefault ? t('settings.taxes.editDefaultTitle', 'Edit Default Sales Tax') : t('settings.taxes.editTitle', 'Edit Tax Rate'))
                    : t('settings.taxes.createTitle', 'New Tax Rate')}
                </h3>
                <p className="text-xs font-semibold text-stone-500 dark:text-zinc-400 mt-1">
                  {editor.isDefault
                    ? t('settings.taxes.defaultHint', 'This is the standard default tax rate used for all products unless a custom rate is assigned.')
                    : t('settings.taxes.customHint', 'Enter a custom tax rate for specific products.')}
                </p>
              </div>
              <ModalCloseButton
                onClose={() => setEditor(null)}
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black tracking-wide text-stone-600 dark:text-zinc-300">
                {t('settings.taxes.fieldName', 'Tax Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editor.name}
                maxLength={60}
                onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                placeholder={t('settings.taxes.namePlaceholder', 'e.g. Sales Tax')}
                className="w-full h-11 px-3.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/25 focus:border-mintcom-green"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black tracking-wide text-stone-600 dark:text-zinc-300">
                {t('settings.taxes.fieldRate', 'Rate %')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={editor.ratePercent}
                  onChange={(e) => setEditor({ ...editor, ratePercent: sanitizePercentInput(e.target.value) })}
                  placeholder="16"
                  className="w-full h-11 pl-3.5 pr-8 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm font-black tabular-nums text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/25 focus:border-mintcom-green"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-stone-400 pointer-events-none">%</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditor(null)}
                disabled={saving}
                className="px-4 h-10 rounded-xl text-sm font-black text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 h-10 rounded-lg bg-mintcom-green hover:bg-mintcom-green/90 active:bg-mintcom-green/80 text-black text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={
          deleteReferencedCount > 0
            ? t('settings.taxes.deactivateTitle', { defaultValue: 'Deactivate tax rate?' })
            : t('settings.taxes.deleteTitle', { defaultValue: 'Delete tax rate?' })
        }
        message={
          deleteTarget
            ? deleteReferencedCount > 0
              ? t('settings.taxes.deletePromptAssigned', {
                  defaultValue: `Are you sure you want to delete "${deleteTarget.name}" (${(Number(deleteTarget.rate) * 100).toFixed(2).replace(/\.00$/, '')}%)? ${deleteReferencedCount} product(s) using this rate will automatically switch to your default Sales Tax. Past sales and tax reports remain 100% preserved.`,
                  name: deleteTarget.name,
                  rate: (Number(deleteTarget.rate) * 100).toFixed(2).replace(/\.00$/, ''),
                  count: deleteReferencedCount,
                })
              : t('settings.taxes.deletePrompt', {
                  defaultValue: `Are you sure you want to delete "${deleteTarget.name}" (${(Number(deleteTarget.rate) * 100).toFixed(2).replace(/\.00$/, '')}%)? Any assigned products will use the default Sales Tax rate. Past sales and tax reports remain 100% preserved.`,
                  name: deleteTarget.name,
                  rate: (Number(deleteTarget.rate) * 100).toFixed(2).replace(/\.00$/, ''),
                })
            : ''
        }
        confirmText={
          deleteReferencedCount > 0
            ? t('common.deactivate', { defaultValue: 'Deactivate' })
            : t('common.delete', { defaultValue: 'Delete' })
        }
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        type="danger"
      />
    </div>
  );
}

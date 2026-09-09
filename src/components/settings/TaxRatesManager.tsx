import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Percent, Plus, Trash2, Settings2, X, Search, Edit3 } from 'lucide-react';
import api, { extractErrorMessage } from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../ConfirmModal';

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
      const res = await api.get('/api/taxes');
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
    try {
      await api.delete(`/api/taxes/${deleteTarget.id}`);
      toast.success(t('settings.taxes.deleted', 'Tax rate deleted successfully'));
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
      <div className="pt-6 border-t border-gray-100 dark:border-white/5">
        <div className="h-10 w-40 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse mb-3" />
        <div className="h-28 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="pt-6 border-t border-gray-100 dark:border-white/5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shrink-0">
            <Percent size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black tracking-tight text-gray-900 dark:text-white leading-none">
              {t('settings.taxes.title', 'Taxes')}
            </h4>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 leading-none mt-1">
              {t('settings.taxes.subtitle', 'Standard default sales tax · add custom rates per product')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-mintcom-green hover:bg-[#5fa888] text-black text-xs font-black tracking-wide shadow-sm transition-colors"
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
            className="w-full pl-9 pr-9 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-400 hover:text-gray-600"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {taxes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] px-6 py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 mx-auto grid place-items-center mb-3 shadow-sm">
            <Settings2 size={18} className="text-gray-400" />
          </div>
          <p className="text-sm font-black text-gray-900 dark:text-white">
            {t('settings.taxes.emptyTitle', 'No tax rates yet')}
          </p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {t('settings.taxes.emptyDesc', 'Set up your standard sales tax rate or add custom rates.')}
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-mintcom-green hover:bg-[#5fa888] text-black text-xs font-black shadow-sm"
          >
            <Plus size={14} strokeWidth={2.5} />
            {t('settings.taxes.createFirst', 'Create tax rate')}
          </button>
        </div>
      )}

      {/* No matches after filtering */}
      {taxes.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] px-6 py-6 text-center">
          <p className="text-xs font-bold text-gray-400">
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
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-sm">
          <div className="hidden sm:grid grid-cols-[1fr_120px_100px] gap-4 px-5 py-2.5 bg-gray-50 dark:bg-white/[0.04] border-b border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{t('settings.taxes.colName', 'Name')}</span>
            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase text-right">{t('settings.taxes.colRate', 'Rate')}</span>
            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase text-right">{t('common.actions', 'Actions')}</span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {filtered.map((tax) => (
              <div
                key={tax.id}
                className="grid sm:grid-cols-[1fr_120px_100px] gap-2 sm:gap-4 px-5 py-3.5 items-center hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Name + default text */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{tax.name}</span>
                  {tax.isDefault && (
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 shrink-0">
                      ({t('common.default', 'Default')})
                    </span>
                  )}
                </div>

                {/* Rate */}
                <div className="flex sm:justify-end items-center">
                  <span className="text-sm font-black tracking-tight text-gray-900 dark:text-white tabular-nums">
                    {(Number(tax.rate) * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(tax)}
                    title={t('common.edit', 'Edit')}
                    className="h-8 px-2.5 inline-flex items-center gap-1 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <Edit3 size={13} />
                    <span>{t('common.edit', 'Edit')}</span>
                  </button>
                  {!tax.isDefault && (
                    <button
                      type="button"
                      title={t('common.delete', 'Delete')}
                      onClick={() => handleDeleteRequest(tax)}
                      className="w-8 h-8 grid place-items-center rounded-xl border border-red-200/60 dark:border-red-500/20 bg-white dark:bg-white/5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-2.5 bg-gray-50/60 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('settings.taxes.footnote', 'The default tax rate applies automatically to new products. Custom tax rates can be selected on individual products.')}
            </p>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editor && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && setEditor(null)} />
          <div className="relative w-full sm:max-w-[440px] bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black tracking-tight text-gray-900 dark:text-white">
                  {editor.id
                    ? (editor.isDefault ? t('settings.taxes.editDefaultTitle', 'Edit Default Sales Tax') : t('settings.taxes.editTitle', 'Edit Tax Rate'))
                    : t('settings.taxes.createTitle', 'New Tax Rate')}
                </h3>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
                  {editor.isDefault
                    ? t('settings.taxes.defaultHint', 'This is the standard default tax rate used for all products unless a custom rate is assigned.')
                    : t('settings.taxes.customHint', 'Enter a custom tax rate for specific products.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditor(null)}
                disabled={saving}
                className="w-8 h-8 grid place-items-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black tracking-wide text-gray-600 dark:text-gray-300">
                {t('settings.taxes.fieldName', 'Tax Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editor.name}
                maxLength={60}
                onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                placeholder={t('settings.taxes.namePlaceholder', 'e.g. Sales Tax')}
                className="w-full h-11 px-3.5 bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/15 rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/25 focus:border-mintcom-green"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black tracking-wide text-gray-600 dark:text-gray-300">
                {t('settings.taxes.fieldRate', 'Rate %')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={editor.ratePercent}
                  onChange={(e) => setEditor({ ...editor, ratePercent: e.target.value.replace(/[^0-9.]/g, '') })}
                  placeholder="16"
                  className="w-full h-11 pl-3.5 pr-8 bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/15 rounded-xl text-sm font-black tabular-nums text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/25 focus:border-mintcom-green"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 pointer-events-none">%</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditor(null)}
                disabled={saving}
                className="px-4 h-10 rounded-xl text-sm font-black text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 h-10 rounded-xl bg-mintcom-green hover:bg-[#5fa888] text-black text-sm font-black shadow-sm transition-colors disabled:opacity-50"
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
        title={t('settings.taxes.deleteTitle', { defaultValue: 'Delete tax rate?' })}
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
        confirmText={t('common.delete', { defaultValue: 'Delete' })}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        type="danger"
      />
    </div>
  );
}

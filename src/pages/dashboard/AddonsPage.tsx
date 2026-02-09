import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  ChevronDown,
  X,
  Layers,
  DollarSign,
  MousePointerClick,
  CheckSquare
} from 'lucide-react';

import toast from 'react-hot-toast';
import api from '../../config/api';
import { useCurrency } from '../../context/CurrencyContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Pagination } from '../../components/ui';

interface SubAttribute {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  attributeId: string;
}

interface Attribute {
  id: string;
  name: string;
  inputType: 'SINGLE_SELECT' | 'MULTI_SELECT';
  isRequired: boolean;
  subAttributes: SubAttribute[];
}

export function AddonsPage() {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();
  const location = useLocation();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [showSubAttributeModal, setShowSubAttributeModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [editingSubAttribute, setEditingSubAttribute] = useState<SubAttribute | null>(null);
  const [parentAttributeId, setParentAttributeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Creative Filter States
  const [filterSelection, setFilterSelection] = useState<string>('ALL');
  const [filterRequirement, setFilterRequirement] = useState<string>('ALL');
  const [filterPricing, setFilterPricing] = useState<string>('ALL');

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const [attributeForm, setAttributeForm] = useState({
    name: '',
    inputType: 'SINGLE_SELECT' as 'SINGLE_SELECT' | 'MULTI_SELECT',
    isRequired: false,
  });
  const [subAttributeForm, setSubAttributeForm] = useState({
    name: '',
    price: 0,
    isAvailable: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/attributes');
      setAttributes(response.data || []);
    } catch {
      toast.error(t('attributes.errors.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const state = location.state as { openCreateModal?: boolean };
    if (state?.openCreateModal && !isLoading) {
      openAttributeModal();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isLoading]);

  const filteredAttributes = useMemo(() => {
    return (Array.isArray(attributes) ? attributes : []).filter((attr) => {
      const matchesSearch = attr.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSelection = filterSelection === 'ALL' || attr.inputType === filterSelection;
      const matchesRequirement = filterRequirement === 'ALL' || (filterRequirement === 'MANDATORY' ? attr.isRequired : !attr.isRequired);

      const hasPaid = (Array.isArray(attr.subAttributes) ? attr.subAttributes : []).some(sub => Number(sub.price) > 0);
      const hasFree = (Array.isArray(attr.subAttributes) ? attr.subAttributes : []).some(sub => Number(sub.price) === 0);
      const matchesPricing = filterPricing === 'ALL' || (filterPricing === 'PAID' ? hasPaid : hasFree);

      return matchesSearch && matchesSelection && matchesRequirement && matchesPricing;
    });
  }, [attributes, searchQuery, filterSelection, filterRequirement, filterPricing]);

  const totalPages = Math.ceil((Array.isArray(filteredAttributes) ? filteredAttributes : []).length / itemsPerPage);
  const paginatedAttributes = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return (Array.isArray(filteredAttributes) ? filteredAttributes : []).slice(start, start + itemsPerPage);
  }, [filteredAttributes, page]);

  // Compute real stats from add-on data
  const stats = useMemo(() => {
    const totalOptions = (Array.isArray(attributes) ? attributes : []).reduce((sum, attr) => sum + (Array.isArray(attr.subAttributes) ? attr.subAttributes.length : 0), 0);
    const paidOptions = (Array.isArray(attributes) ? attributes : []).reduce((sum, attr) =>
      sum + ((Array.isArray(attr.subAttributes) ? attr.subAttributes : []).filter(sub => Number(sub.price) > 0).length || 0), 0);
    const requiredGroups = (Array.isArray(attributes) ? attributes : []).filter(attr => attr.isRequired).length;
    const topGroup = [...(Array.isArray(attributes) ? attributes : [])].sort((a, b) =>
      ((Array.isArray(b.subAttributes) ? b.subAttributes.length : 0)) - ((Array.isArray(a.subAttributes) ? a.subAttributes.length : 0))
    )[0];

    return {
      totalGroups: attributes.length,
      totalOptions,
      paidOptions,
      requiredGroups,
      topGroup,
    };
  }, [attributes]);


  const openAttributeModal = (attribute?: Attribute) => {
    if (attribute) {
      setEditingAttribute(attribute);
      setAttributeForm({
        name: attribute.name,
        inputType: attribute.inputType,
        isRequired: attribute.isRequired,
      });
    } else {
      setEditingAttribute(null);
      setAttributeForm({ name: '', inputType: 'SINGLE_SELECT', isRequired: false });
    }
    setShowAttributeModal(true);
    setErrors({});
  };

  const openSubAttributeModal = (attributeId: string, subAttr?: SubAttribute) => {
    setParentAttributeId(attributeId);
    if (subAttr) {
      setEditingSubAttribute(subAttr);
      setSubAttributeForm({
        name: subAttr.name,
        price: Number(subAttr.price),
        isAvailable: subAttr.isAvailable,
      });
    } else {
      setEditingSubAttribute(null);
      setSubAttributeForm({ name: '', price: 0, isAvailable: true });
    }
    setShowSubAttributeModal(true);
    setErrors({});
  };

  const handleSaveAttribute = async () => {
    setErrors({});
    if (!attributeForm.name.trim()) {
      setErrors({ groupName: t('attributes.errors.groupNameRequired') });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingAttribute) {
        await api.put(`/api/attributes/${editingAttribute.id}`, attributeForm);
        toast.success(t('attributes.messages.groupUpdated'));
      } else {
        await api.post('/api/attributes', attributeForm);
        toast.success(t('attributes.messages.groupCreated'));
      }
      setShowAttributeModal(false);
      fetchAttributes();
    } catch {
      toast.error(t('attributes.errors.errorSaving'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    const attr = attributes.find((a) => a.id === id);

    if (attr && attr.subAttributes?.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: t('attributes.errors.deletionBlocked'),
        message: t('attributes.errors.deletionBlockedMsg', { name: attr.name, count: attr.subAttributes.length }),
        type: 'warning',
        confirmText: t('common.gotIt') || 'Got it',
        showCancel: false,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: t('attributes.errors.deleteGroupTitle'),
      message: t('attributes.errors.deleteGroupMsg', { name: attr?.name }),
      type: 'danger',
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.delete(`/api/attributes/${id}`);
          toast.success(t('attributes.messages.groupRemoved'));
          fetchAttributes();
        } catch {
          toast.error(t('attributes.errors.deleteFailed') || 'Failed to delete');
        }
      }
    });
  };

  const handleSaveSubAttribute = async () => {
    setErrors({});
    if (!subAttributeForm.name.trim()) {
      setErrors({ optionName: t('attributes.errors.optionNameRequired') });
      return;
    }
    if (!parentAttributeId) return;
    setIsSubmitting(true);
    try {
      if (editingSubAttribute) {
        await api.put(`/api/attributes/sub-attributes/${editingSubAttribute.id}`, subAttributeForm);
        toast.success(t('attributes.messages.optionSaved'));
      } else {
        await api.post(`/api/attributes/${parentAttributeId}/sub-attributes`, subAttributeForm);
        toast.success(t('attributes.messages.optionAdded'));
      }
      setShowSubAttributeModal(false);
      fetchAttributes();
    } catch {
      toast.error(t('attributes.errors.errorSavingOption'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubAttribute = async (subAttrId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: t('attributes.errors.deleteOptionTitle'),
      message: t('attributes.errors.deleteOptionMsg'),
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/attributes/sub-attributes/${subAttrId}`);
          toast.success(t('attributes.messages.optionRemoved'));
          fetchAttributes();
        } catch {
          toast.error(t('attributes.errors.deleteFailed') || 'Failed to delete');
        }
      }
    });
  };

  const handleQuickFilter = (
    priceType: 'ALL' | 'FREE' | 'PAID',
    findLargestInfo?: boolean
  ) => {
    // 1. Set Filter
    setFilterPricing(priceType);
    setPage(1); // Reset to first page
    setSearchQuery(''); // Clear search to ensure we find hits

    // 2. Find relevant group to auto-expand
    let targetGroup = null;

    if (findLargestInfo) {
      // Logic for "Total Options" card: Scroll to largest group
      targetGroup = stats.topGroup;
    } else {
      // Logic for Pricing: Find first group matching the priceType
      targetGroup = attributes.find(attr => {
        const hasPaid = attr.subAttributes?.some(sub => Number(sub.price) > 0);
        const hasFree = attr.subAttributes?.some(sub => Number(sub.price) === 0);

        if (priceType === 'PAID') return hasPaid;
        if (priceType === 'FREE') return hasFree;
        return true; // ALL
      });
    }

    // 3. Expand & Scroll
    if (targetGroup) {
      setExpandedId(targetGroup.id);
      setTimeout(() => {
        const element = document.getElementById(`group-${targetGroup.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight effect?
        }
      }, 100);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
              {t('dashboard.menu.itemsMenu')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('attributes.title')}</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">
            {t('attributes.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openAttributeModal()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>{t('attributes.newGroup')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: t('attributes.stats.groups'),
            value: stats.totalGroups,
            icon: Layers,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            action: () => handleQuickFilter('ALL')
          },
          {
            label: t('attributes.stats.options'),
            value: stats.totalOptions,
            icon: Package,
            color: 'text-paymint-green',
            bg: 'bg-paymint-green/10',
            action: () => handleQuickFilter('ALL', true)
          },
          {
            label: t('attributes.stats.sales'),
            value: stats.paidOptions,
            sub: t('attributes.stats.withPrice'),
            icon: DollarSign,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            action: () => handleQuickFilter('PAID')
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="group relative p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform duration-300`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 tracking-widest mb-0.5">{stat.label}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                {stat.sub && <p className="text-xs font-bold text-paymint-green tracking-wide mt-1">{stat.sub}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Control Bar & Filters */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-4 shadow-sm space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder={t('attributes.filters.searchPlaceholder')}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Selection Filter */}
          <div className="space-y-2">
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 tracking-widest px-1">{t('attributes.filters.selection')}</p>
            <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
              {['ALL', 'SINGLE_SELECT', 'MULTI_SELECT'].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilterSelection(f as any); setPage(1); }}
                  className={`flex-1 py-2 text-xs font-black tracking-tight rounded-lg transition-all ${filterSelection === f
                    ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {f === 'SINGLE_SELECT' ? t('attributes.filters.single') : f === 'MULTI_SELECT' ? t('attributes.filters.multi') : t('attributes.filters.all')}
                </button>
              ))}
            </div>
          </div>

          {/* Requirement Filter */}
          <div className="space-y-2">
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 tracking-widest px-1">{t('attributes.filters.required')}</p>
            <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
              {['ALL', 'MANDATORY', 'OPTIONAL'].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilterRequirement(f as any); setPage(1); }}
                  className={`flex-1 py-2 text-xs font-black tracking-tight rounded-lg transition-all ${filterRequirement === f
                    ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {f === 'MANDATORY' ? t('attributes.filters.mandatory') : f === 'OPTIONAL' ? t('attributes.filters.optional') : t('attributes.filters.all')}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Model */}
          <div className="space-y-2">
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 tracking-widest px-1">{t('attributes.filters.price')}</p>
            <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
              {['ALL', 'FREE', 'PAID'].map((f) => (
                <button
                  key={f}
                  onClick={() => handleQuickFilter(f as any)}
                  className={`flex-1 py-2 text-xs font-black tracking-tight rounded-lg transition-all ${filterPricing === f
                    ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {f === 'FREE' ? t('attributes.filters.free') : f === 'PAID' ? t('attributes.filters.paid') : t('attributes.filters.all')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reset Action */}
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => {
              setFilterSelection('ALL');
              setFilterRequirement('ALL');
              setFilterPricing('ALL');
              setSearchQuery('');
            }}
            className="text-xs font-black text-gray-400 hover:text-paymint-red tracking-widest flex items-center gap-1.5 transition-colors"
          >
            {t('attributes.filters.reset')}
          </button>
        </div>
      </div>

      {/* Add-ons List */}
      {isLoading ? (
        <div className="py-32 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin mb-4" />
        </div>
      ) : paginatedAttributes.length === 0 ? (
        <div className="py-24 bg-white dark:bg-[#0B1120] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
            <Package size={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('attributes.list.noAddons')}</h3>
          <p className="text-sm font-bold text-gray-500 max-w-xs">{t('attributes.list.noAddonsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedAttributes.map((attr) => (
            <div
              key={attr.id}
              id={`group-${attr.id}`}
              className="group relative bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute left-0 top-0 h-full w-1 bg-paymint-green opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
                onClick={() => setExpandedId(expandedId === attr.id ? null : attr.id)}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black border ${attr.isRequired ? 'bg-paymint-green text-black border-paymint-green' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'
                    }`}>
                    {attr.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{attr.name}</h3>
                      {attr.isRequired && (
                        <span className="text-xs font-black tracking-widest px-2 py-0.5 bg-paymint-green/10 text-paymint-green rounded-md border border-paymint-green/20">{t('attributes.list.mandatory')}</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-400 tracking-widest mt-1">
                      {attr.inputType === 'SINGLE_SELECT' ? t('attributes.list.singleChoice') : t('attributes.list.multipleChoice')} • {attr.subAttributes?.length || 0} {t('attributes.list.options')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); openAttributeModal(attr); }} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-paymint-green hover:border-paymint-green/30 transition-colors" title={t('common.edit')}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteAttribute(attr.id); }} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-paymint-red hover:border-paymint-red/30 transition-colors" title={t('common.delete')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform duration-500 ${expandedId === attr.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

                {expandedId === attr.id && (
                  <div
                    className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 p-8"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xs font-black text-gray-400 tracking-[0.2em]">{t('attributes.list.options')}</span>
                      <button
                        onClick={() => openSubAttributeModal(attr.id)}
                        className="px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-bold tracking-widest rounded-xl hover:bg-paymint-green hover:text-black hover:border-paymint-green transition-all flex items-center gap-2"
                      >
                        <Plus size={14} /> {t('attributes.list.addOption')}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {attr.subAttributes
                        ?.filter(sub => {
                          if (filterPricing === 'PAID') return Number(sub.price) > 0;
                          if (filterPricing === 'FREE') return Number(sub.price) === 0;
                          return true;
                        })
                        .map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between p-4 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 group/sub hover:border-paymint-green/30 transition-all shadow-sm">
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white text-base">{sub.name}</p>
                              <p className="text-xs font-black text-paymint-green mt-1">
                                {Number(sub.price) > 0 ? `+${formatAmount(Number(sub.price))}` : t('attributes.list.complimentary')}
                              </p>
                            </div>
                            <div className="flex gap-1 transition-opacity">
                              <button onClick={() => openSubAttributeModal(attr.id, sub)} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-paymint-green hover:bg-paymint-green/10" title={t('common.edit')}>
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteSubAttribute(sub.id)} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-paymint-red hover:bg-paymint-red/10" title={t('common.delete')}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          ))}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
        </div>
      )}

      {/* Add-on Group Modal */}
        {showAttributeModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm font-sans">
            <div className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full sm:max-w-md overflow-hidden shadow-2xl h-[92vh] sm:h-auto flex flex-col">
              {/* Mobile drag handle */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
              </div>
              <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('attributes.form.groupTitle')}</h2>
                <button onClick={() => setShowAttributeModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                <div>
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] mb-3 px-1">
                    {t('attributes.form.groupNameLabel')} <span className="text-paymint-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={attributeForm.name}
                    onChange={(e) => {
                      setAttributeForm({ ...attributeForm, name: e.target.value });
                      if (errors.groupName) setErrors({ ...errors, groupName: '' });
                    }}
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.groupName ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder={t('attributes.form.groupNamePlaceholder')}
                  />
                  {errors.groupName && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.groupName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAttributeForm({ ...attributeForm, inputType: 'SINGLE_SELECT' })}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 text-left relative overflow-hidden group ${attributeForm.inputType === 'SINGLE_SELECT'
                      ? 'bg-paymint-green/10 border-paymint-green'
                      : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/5 hover:border-paymint-green/30'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${attributeForm.inputType === 'SINGLE_SELECT' ? 'bg-paymint-green text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                      <MousePointerClick size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${attributeForm.inputType === 'SINGLE_SELECT' ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>{t('attributes.form.single')}</p>
                      <p className="text-xs font-medium text-gray-400 mt-1">{t('attributes.form.singleDesc')}</p>
                    </div>
                    {attributeForm.inputType === 'SINGLE_SELECT' && (
                      <div className="absolute top-4 right-4 text-paymint-green">
                        <div className="w-2 h-2 rounded-full bg-paymint-green shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttributeForm({ ...attributeForm, inputType: 'MULTI_SELECT' })}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 text-left relative overflow-hidden group ${attributeForm.inputType === 'MULTI_SELECT'
                      ? 'bg-paymint-green/10 border-paymint-green'
                      : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/5 hover:border-paymint-green/30'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${attributeForm.inputType === 'MULTI_SELECT' ? 'bg-paymint-green text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                      <CheckSquare size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${attributeForm.inputType === 'MULTI_SELECT' ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>{t('attributes.form.multiple')}</p>
                      <p className="text-xs font-medium text-gray-400 mt-1">{t('attributes.form.multipleDesc')}</p>
                    </div>
                    {attributeForm.inputType === 'MULTI_SELECT' && (
                      <div className="absolute top-4 right-4 text-paymint-green">
                        <div className="w-2 h-2 rounded-full bg-paymint-green shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t('attributes.form.requiredLabel')}</p>
                    <p className="text-xs text-gray-500 font-bold mt-0.5">{t('attributes.form.requiredDesc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={attributeForm.isRequired} onChange={() => setAttributeForm({ ...attributeForm, isRequired: !attributeForm.isRequired })} className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:bg-paymint-green transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>
                </div>

                <button onClick={handleSaveAttribute} disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] tracking-widest text-xs flex items-center justify-center gap-2">
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Add-on Option Modal */}
        {showSubAttributeModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm font-sans">
            <div className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-sm overflow-hidden shadow-2xl h-[92vh] sm:h-auto flex flex-col">
              {/* Mobile drag handle */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
              </div>
              <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('attributes.form.optionTitle')}</h2>
                <button onClick={() => setShowSubAttributeModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                <div>
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] mb-3 px-1">
                    {t('attributes.form.optionNameLabel')} <span className="text-paymint-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={subAttributeForm.name}
                    onChange={(e) => {
                      setSubAttributeForm({ ...subAttributeForm, name: e.target.value });
                      if (errors.optionName) setErrors({ ...errors, optionName: '' });
                    }}
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${errors.optionName ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder={t('attributes.form.optionNamePlaceholder')}
                  />
                  {errors.optionName && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.optionName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 tracking-widest mb-2 px-1">{t('attributes.form.priceLabel')}</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-lg">
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-black">{currencySymbol}</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={subAttributeForm.price === 0 ? '' : subAttributeForm.price.toFixed(2)}
                      placeholder="0.00"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const numericValue = parseInt(val || '0', 10) / 100;
                        setSubAttributeForm({ ...subAttributeForm, price: numericValue });
                      }}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-16 pr-4 py-3 text-gray-900 dark:text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
                    />
                  </div>
                  <p className="mt-2 text-xs font-black text-paymint-green tracking-widest px-1">{t('attributes.form.atmStyle')}</p>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                  <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{t('attributes.form.availableLabel')}</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={subAttributeForm.isAvailable} onChange={() => setSubAttributeForm({ ...subAttributeForm, isAvailable: !subAttributeForm.isAvailable })} className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:bg-paymint-green transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>
                </div>

                <button onClick={handleSaveSubAttribute} disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] tracking-widest text-xs transition-all flex items-center justify-center gap-2">
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        showCancel={confirmConfig.showCancel}
        type={confirmConfig.type}
      />
    </div>
  );
}

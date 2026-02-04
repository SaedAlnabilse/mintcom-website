import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
      toast.error('Failed to load attributes');
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
    return attributes.filter((attr) => {
      const matchesSearch = attr.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSelection = filterSelection === 'ALL' || attr.inputType === filterSelection;
      const matchesRequirement = filterRequirement === 'ALL' || (filterRequirement === 'MANDATORY' ? attr.isRequired : !attr.isRequired);

      const hasPaid = attr.subAttributes?.some(sub => Number(sub.price) > 0);
      const hasFree = attr.subAttributes?.some(sub => Number(sub.price) === 0);
      const matchesPricing = filterPricing === 'ALL' || (filterPricing === 'PAID' ? hasPaid : hasFree);

      return matchesSearch && matchesSelection && matchesRequirement && matchesPricing;
    });
  }, [attributes, searchQuery, filterSelection, filterRequirement, filterPricing]);

  const totalPages = Math.ceil(filteredAttributes.length / itemsPerPage);
  const paginatedAttributes = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredAttributes.slice(start, start + itemsPerPage);
  }, [filteredAttributes, page]);

  // Compute real stats from add-on data
  const stats = useMemo(() => {
    const totalOptions = attributes.reduce((sum, attr) => sum + (attr.subAttributes?.length || 0), 0);
    const paidOptions = attributes.reduce((sum, attr) =>
      sum + (attr.subAttributes?.filter(sub => Number(sub.price) > 0).length || 0), 0);
    const requiredGroups = attributes.filter(attr => attr.isRequired).length;
    const topGroup = [...attributes].sort((a, b) =>
      (b.subAttributes?.length || 0) - (a.subAttributes?.length || 0)
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
      setErrors({ groupName: 'Required' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingAttribute) {
        await api.put(`/api/attributes/${editingAttribute.id}`, attributeForm);
        toast.success('Group updated');
      } else {
        await api.post('/api/attributes', attributeForm);
        toast.success('Group created');
      }
      setShowAttributeModal(false);
      fetchAttributes();
    } catch {
      toast.error('Error saving group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    const attr = attributes.find((a) => a.id === id);

    if (attr && attr.subAttributes?.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: 'Deletion Blocked',
        message: `The group "${attr.name}" contains ${attr.subAttributes.length} active options. You must delete all options within this group before you can remove the group itself.`,
        type: 'warning',
        confirmText: 'Got it',
        showCancel: false,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Delete Add-on Group',
      message: `Are you sure you want to permanently remove the "${attr?.name}" group? This action cannot be undone.`,
      type: 'danger',
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.delete(`/api/attributes/${id}`);
          toast.success('Group removed');
          fetchAttributes();
        } catch {
          toast.error('Failed to delete');
        }
      }
    });
  };

  const handleSaveSubAttribute = async () => {
    setErrors({});
    if (!subAttributeForm.name.trim()) {
      setErrors({ optionName: 'Required' });
      return;
    }
    if (!parentAttributeId) return;
    setIsSubmitting(true);
    try {
      if (editingSubAttribute) {
        await api.put(`/api/attributes/sub-attributes/${editingSubAttribute.id}`, subAttributeForm);
        toast.success('Option saved');
      } else {
        await api.post(`/api/attributes/${parentAttributeId}/sub-attributes`, subAttributeForm);
        toast.success('Option added');
      }
      setShowSubAttributeModal(false);
      fetchAttributes();
    } catch {
      toast.error('Failed to save option');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubAttribute = async (subAttrId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Option',
      message: 'Remove this specific add-on option?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/attributes/sub-attributes/${subAttrId}`);
          toast.success('Option removed');
          fetchAttributes();
        } catch {
          toast.error('Failed to delete');
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
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
              Menu
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Add-ons</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">
            Manage extra options and pricing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openAttributeModal()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Attributes/Groups',
            value: stats.totalGroups,
            icon: Layers,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            action: () => handleQuickFilter('ALL')
          },
          {
            label: 'Add-ons Options',
            value: stats.totalOptions,
            icon: Package,
            color: 'text-paymint-green',
            bg: 'bg-paymint-green/10',
            action: () => handleQuickFilter('ALL', true)
          },
          {
            label: 'Sales from Paid Add-ons',
            value: stats.paidOptions,
            sub: 'With price',
            icon: DollarSign,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            action: () => handleQuickFilter('PAID')
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="group relative p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
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
            placeholder="Search groups..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Selection Filter */}
          <div className="space-y-2">
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 tracking-widest px-1">Selection</p>
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
                  {f.replace('_SELECT', '').replace('ALL', 'All')}
                </button>
              ))}
            </div>
          </div>

          {/* Requirement Filter */}
          <div className="space-y-2">
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 tracking-widest px-1">Required</p>
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
                  {f.replace('ALL', 'All')}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Model */}
          <div className="space-y-2">
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 tracking-widest px-1">Price</p>
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
                  {f.replace('ALL', 'All')}
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
            Reset Filters
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
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No add-ons</h3>
          <p className="text-sm font-bold text-gray-500 max-w-xs">Create add-ons to allow staff to customize items.</p>
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
                        <span className="text-xs font-black tracking-widest px-2 py-0.5 bg-paymint-green/10 text-paymint-green rounded-md border border-paymint-green/20">Mandatory</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-400 tracking-widest mt-1">
                      {attr.inputType === 'SINGLE_SELECT' ? 'Single Choice' : 'Multiple Choice'} • {attr.subAttributes?.length || 0} Options
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); openAttributeModal(attr); }} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-paymint-green hover:border-paymint-green/30 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteAttribute(attr.id); }} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-paymint-red hover:border-paymint-red/30 transition-colors">
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
                      <span className="text-xs font-black text-gray-400 tracking-[0.2em]">Options</span>
                      <button
                        onClick={() => openSubAttributeModal(attr.id)}
                        className="px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-bold tracking-widest rounded-xl hover:bg-paymint-green hover:text-black hover:border-paymint-green transition-all flex items-center gap-2"
                      >
                        <Plus size={14} /> Add Option
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
                                {Number(sub.price) > 0 ? `+${formatAmount(Number(sub.price))}` : 'Complimentary'}
                              </p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                              <button onClick={() => openSubAttributeModal(attr.id, sub)} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-paymint-green hover:bg-paymint-green/10">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteSubAttribute(sub.id)} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-paymint-red hover:bg-paymint-red/10">
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add-on Group</h2>
                <button onClick={() => setShowAttributeModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] mb-3 px-1">
                    Group Name <span className="text-paymint-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={attributeForm.name}
                    onChange={(e) => {
                      setAttributeForm({ ...attributeForm, name: e.target.value });
                      if (errors.groupName) setErrors({ ...errors, groupName: '' });
                    }}
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.groupName ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder="e.g. Cooking Preference"
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
                      <p className={`text-sm font-bold ${attributeForm.inputType === 'SINGLE_SELECT' ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>Single Select</p>
                      <p className="text-xs font-medium text-gray-400 mt-1">Customer picks exactly one option.</p>
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
                      <p className={`text-sm font-bold ${attributeForm.inputType === 'MULTI_SELECT' ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>Multi Select</p>
                      <p className="text-xs font-medium text-gray-400 mt-1">Customer can pick multiple options.</p>
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
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Required</p>
                    <p className="text-xs text-gray-500 font-bold mt-0.5">Customer must select an option</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={attributeForm.isRequired} onChange={() => setAttributeForm({ ...attributeForm, isRequired: !attributeForm.isRequired })} className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:bg-paymint-green transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>
                </div>

                <button onClick={handleSaveAttribute} disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] tracking-widest text-xs flex items-center justify-center gap-2">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Add-on Option Modal */}
        {showSubAttributeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add-on Option</h2>
                <button onClick={() => setShowSubAttributeModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] mb-3 px-1">
                    Option Name <span className="text-paymint-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={subAttributeForm.name}
                    onChange={(e) => {
                      setSubAttributeForm({ ...subAttributeForm, name: e.target.value });
                      if (errors.optionName) setErrors({ ...errors, optionName: '' });
                    }}
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${errors.optionName ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder="e.g. Double Espresso"
                  />
                  {errors.optionName && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.optionName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 tracking-widest mb-2 px-1">Price</label>
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
                  <p className="mt-2 text-xs font-black text-paymint-green tracking-widest px-1">Digits shift right to left (Atm Style)</p>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                  <p className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">Available</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={subAttributeForm.isAvailable} onChange={() => setSubAttributeForm({ ...subAttributeForm, isAvailable: !subAttributeForm.isAvailable })} className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:bg-paymint-green transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>
                </div>

                <button onClick={handleSaveSubAttribute} disabled={isSubmitting} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl hover:scale-[1.02] tracking-widest text-xs transition-all flex items-center justify-center gap-2">
                  Save Option
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

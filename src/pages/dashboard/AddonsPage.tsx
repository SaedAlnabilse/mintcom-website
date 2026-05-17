import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  CheckSquare,
  RotateCcw
} from 'lucide-react';

import toast from 'react-hot-toast';
import api from '../../config/api';
import { useCurrency } from '../../context/CurrencyContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Pagination, SelectInput } from '../../components/ui';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { QuickInfo } from '../../components/QuickInfo';
import { formatInputPlaceholder, formatInputLabel } from '../../utils/textCase';

interface SubAttribute {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  isActive?: boolean;
  deletedAt?: string | null;
  deactivatedAt?: string | null;
  attributeId: string;
}

interface Attribute {
  id: string;
  name: string;
  inputType: 'SINGLE_SELECT' | 'MULTI_SELECT';
  isRequired: boolean;
  isActive?: boolean;
  deletedAt?: string | null;
  deactivatedAt?: string | null;
  subAttributes: SubAttribute[];
}

type StatusFilterValue = 'ALL' | 'ACTIVE' | 'INACTIVE';

const isArchivedRecord = (record: { deletedAt?: string | null; deactivatedAt?: string | null; isActive?: boolean }) =>
  !!record?.deletedAt || !!record?.deactivatedAt || record?.isActive === false;

const sortArchivedLastByNewest = <T extends { id?: string; deletedAt?: string | null; deactivatedAt?: string | null; isActive?: boolean }>(
  records: T[],
) =>
  [...records].sort((a, b) => {
    const aArchived = isArchivedRecord(a);
    const bArchived = isArchivedRecord(b);

    if (aArchived !== bArchived) {
      return aArchived ? 1 : -1;
    }

    return (b.id || '').localeCompare(a.id || '');
  });

const normalizeAttributesForDisplay = (records: Attribute[]) =>
  sortArchivedLastByNewest(records).map((attribute) => ({
    ...attribute,
    subAttributes: sortArchivedLastByNewest(Array.isArray(attribute.subAttributes) ? attribute.subAttributes : []),
  }));

export function AddonsPage() {
  const { t } = useTranslation();
  const { currentEstablishment } = useAuth();
  usePermissionGuard(['manage_inventory']);
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

  // Filter States
  const [filterSelection, setFilterSelection] = useState<string>('ALL');
  const [filterRequirement, setFilterRequirement] = useState<string>('ALL');
  const [filterPricing, setFilterPricing] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<StatusFilterValue>('ACTIVE');
  const [recentlyArchivedAttributeIds, setRecentlyArchivedAttributeIds] = useState<Set<string>>(() => new Set());

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onSecondary?: () => void;
    type?: 'danger' | 'success' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    secondaryText?: string;
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

  const isAttributeActive = (attribute: Attribute) =>
    attribute.isActive !== false && !attribute.deletedAt && !attribute.deactivatedAt;

  const isSubAttributeActive = (subAttribute: SubAttribute) =>
    subAttribute.isActive !== false && !subAttribute.deletedAt && !subAttribute.deactivatedAt;

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/attributes', {
        params: { includeInactive: true },
      });
      setRecentlyArchivedAttributeIds(new Set());
      setAttributes(normalizeAttributesForDisplay(Array.isArray(response.data) ? response.data : []));
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
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE'
          ? isAttributeActive(attr) || recentlyArchivedAttributeIds.has(attr.id)
          : !isAttributeActive(attr));
      
      const subAttributes = Array.isArray(attr.subAttributes) ? attr.subAttributes : [];
      const hasPaid = subAttributes.some(sub => Number(sub.price) > 0);
      const hasFree = subAttributes.some(sub => Number(sub.price) === 0);
      const matchesPricing = filterPricing === 'ALL' || (filterPricing === 'PAID' ? hasPaid : hasFree);

      return matchesSearch && matchesSelection && matchesRequirement && matchesPricing && matchesStatus;
    });
  }, [attributes, searchQuery, filterSelection, filterRequirement, filterPricing, filterStatus, recentlyArchivedAttributeIds]);
  const shouldShowStatusEmptyState =
    !searchQuery.trim() &&
    filterSelection === 'ALL' &&
    filterRequirement === 'ALL' &&
    filterPricing === 'ALL' &&
    filterStatus !== 'ALL';
  const addonsEmptyTitle = shouldShowStatusEmptyState
    ? t(
        filterStatus === 'INACTIVE' ? 'attributes.list.noInactiveAddons' : 'attributes.list.noActiveAddons',
        {
          defaultValue: filterStatus === 'INACTIVE' ? 'No inactive add-ons found' : 'No active add-ons found',
        },
      )
    : searchQuery.trim()
      ? t('common.noResults')
      : t('attributes.list.noAddons');
  const addonsEmptyDescription = shouldShowStatusEmptyState
    ? ''
    : searchQuery.trim()
      ? t('common.noMatchingResults', { entity: 'add-ons', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' })
      : t('attributes.list.noAddonsDesc');

  const totalPages = Math.ceil(filteredAttributes.length / itemsPerPage);
  const paginatedAttributes = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredAttributes.slice(start, start + itemsPerPage);
  }, [filteredAttributes, page]);

  const stats = useMemo(() => {
    const totalOptions = attributes.reduce((sum, attr) => sum + (Array.isArray(attr.subAttributes) ? attr.subAttributes.length : 0), 0);
    const paidOptions = attributes.reduce((sum, attr) => sum + (Array.isArray(attr.subAttributes) ? attr.subAttributes : []).filter(sub => Number(sub.price) > 0).length, 0);
    const requiredGroups = attributes.filter(attr => attr.isRequired).length;
    const topGroup = [...attributes].sort((a, b) => (b.subAttributes?.length || 0) - (a.subAttributes?.length || 0))[0];

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

  const moveCreateViewToActive = () => {
    if (filterStatus === 'INACTIVE') {
      setFilterStatus('ACTIVE');
      setPage(1);
    }
  };

  const reactivateAttributeById = async (id: string) => {
    await api.post(`/api/attributes/${id}/reactivate`);
    toast.success(t('attributes.messages.groupReactivated', { defaultValue: 'Add-on group reactivated' }));
    setShowAttributeModal(false);
    fetchAttributes();
  };

  const reactivateSubAttributeById = async (id: string) => {
    await api.post(`/api/attributes/sub-attributes/${id}/reactivate`);
    toast.success(t('attributes.messages.optionReactivated', { defaultValue: 'Add-on option reactivated' }));
    setShowSubAttributeModal(false);
    fetchAttributes();
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
    if (editingAttribute && !isAttributeActive(editingAttribute)) {
      return;
    }

    setErrors({});
    if (!attributeForm.name.trim()) {
      setErrors({ groupName: t('attributes.errors.groupNameRequired') });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingAttribute) {
        await api.patch(`/api/attributes/${editingAttribute.id}`, attributeForm);
        toast.success(t('attributes.messages.groupUpdated'));
      } else {
        const conflict = await api.get('/api/attributes/name-conflicts', {
          params: { name: attributeForm.name },
        });
        const data = conflict.data;
        if (data?.activeDuplicate) {
          setErrors({ groupName: `An active add-on group named "${data.activeDuplicate.displayName}" already exists.` });
          return;
        }
        const archived = data?.archivedDuplicates?.[0];
        if (archived) {
          setConfirmConfig({
            isOpen: true,
            title: 'Archived add-on group found',
            message: `An archived add-on group named "${archived.displayName}" already exists. Restore it, or create a new group with the same name?`,
            type: 'warning',
            confirmText: 'Restore archived',
            secondaryText: 'Create new anyway',
            onConfirm: async () => {
              await reactivateAttributeById(archived.id);
            },
            onSecondary: async () => {
              setIsSubmitting(true);
              try {
                await api.post('/api/attributes', attributeForm);
                toast.success(t('attributes.messages.groupCreated'));
                moveCreateViewToActive();
                setShowAttributeModal(false);
                fetchAttributes();
              } catch (error: any) {
                setErrors({ groupName: error.response?.data?.message || t('attributes.errors.errorSaving') });
              } finally {
                setIsSubmitting(false);
              }
            },
          });
          return;
        }
        await api.post('/api/attributes', attributeForm);
        toast.success(t('attributes.messages.groupCreated'));
        moveCreateViewToActive();
      }
      setShowAttributeModal(false);
      fetchAttributes();
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error;
      if (message?.toLowerCase().includes('already exists')) {
        setErrors({ groupName: message });
      } else {
        toast.error(message || t('attributes.errors.errorSaving'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSubAttribute = async () => {
    if (editingSubAttribute && !isSubAttributeActive(editingSubAttribute)) {
      return;
    }

    if (!subAttributeForm.name.trim()) {
      setErrors({ optionName: t('attributes.errors.optionNameRequired') });
      return;
    }
    if (!parentAttributeId) return;

    setIsSubmitting(true);
    try {
      if (editingSubAttribute) {
        await api.patch(`/api/attributes/sub-attributes/${editingSubAttribute.id}`, subAttributeForm);
        toast.success(t('attributes.messages.optionUpdated'));
      } else {
        const conflict = await api.get('/api/attributes/name-conflicts', {
          params: { name: subAttributeForm.name, attributeId: parentAttributeId },
        });
        const data = conflict.data;
        if (data?.activeDuplicate) {
          setErrors({ optionName: `An active option named "${data.activeDuplicate.displayName}" already exists.` });
          return;
        }
        const archived = data?.archivedDuplicates?.[0];
        if (archived) {
          setConfirmConfig({
            isOpen: true,
            title: 'Archived add-on option found',
            message: `An archived option named "${archived.displayName}" already exists. Restore it, or create a new option with the same name?`,
            type: 'warning',
            confirmText: 'Restore archived',
            secondaryText: 'Create new anyway',
            onConfirm: async () => {
              await reactivateSubAttributeById(archived.id);
            },
            onSecondary: async () => {
              setIsSubmitting(true);
              try {
                await api.post(`/api/attributes/${parentAttributeId}/sub-attributes`, subAttributeForm);
                toast.success(t('attributes.messages.optionCreated'));
                moveCreateViewToActive();
                setShowSubAttributeModal(false);
                fetchAttributes();
              } catch (error: any) {
                setErrors({ optionName: error.response?.data?.message || t('attributes.errors.errorSavingOption') });
              } finally {
                setIsSubmitting(false);
              }
            },
          });
          return;
        }
        await api.post(`/api/attributes/${parentAttributeId}/sub-attributes`, subAttributeForm);
        toast.success(t('attributes.messages.optionCreated'));
        moveCreateViewToActive();
      }
      setShowSubAttributeModal(false);
      fetchAttributes();
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error;
      toast.error(message || t('attributes.errors.errorSavingOption'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttribute = (attribute: Attribute) => {
    setConfirmConfig({
      isOpen: true,
      title: t('attributes.confirm.deleteGroupTitle'),
      message: t('attributes.confirm.deleteGroupMessage', { name: attribute.name }),
      confirmText: t('common.archive'),
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await api.delete(`/api/attributes/${attribute.id}`);
          const archivedAt = new Date().toISOString();
          const archivedAttribute = response.data as Partial<Attribute> | undefined;
          const shouldKeepArchived =
            !archivedAttribute ||
            !!archivedAttribute.deletedAt ||
            !!archivedAttribute.deactivatedAt ||
            archivedAttribute.isActive === false;

          if (shouldKeepArchived) {
            setRecentlyArchivedAttributeIds((prev) => new Set(prev).add(attribute.id));
            setAttributes((currentAttributes) =>
              currentAttributes.map((currentAttribute) =>
                currentAttribute.id === attribute.id
                  ? {
                      ...currentAttribute,
                      ...archivedAttribute,
                      deletedAt: archivedAttribute?.deletedAt ?? archivedAt,
                      deactivatedAt: archivedAttribute?.deactivatedAt ?? archivedAt,
                      isActive: false,
                      subAttributes: (currentAttribute.subAttributes || []).map((subAttribute) => ({
                        ...subAttribute,
                        deletedAt: subAttribute.deletedAt ?? archivedAt,
                        deactivatedAt: subAttribute.deactivatedAt ?? archivedAt,
                        isActive: false,
                        isAvailable: false,
                      })),
                    }
                  : currentAttribute,
              ),
            );
          } else {
            setRecentlyArchivedAttributeIds((prev) => {
              const next = new Set(prev);
              next.delete(attribute.id);
              return next;
            });
            setAttributes((currentAttributes) =>
              currentAttributes.filter((currentAttribute) => currentAttribute.id !== attribute.id),
            );
          }
          toast.success(t('attributes.messages.groupDeleted'));
        } catch {
          toast.error(t('attributes.errors.errorDeleting'));
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeleteSubAttribute = (sub: SubAttribute) => {
    setConfirmConfig({
      isOpen: true,
      title: t('attributes.confirm.deleteOptionTitle'),
      message: t('attributes.confirm.deleteOptionMessage', { name: sub.name }),
      confirmText: t('common.archive'),
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await api.delete(`/api/attributes/sub-attributes/${sub.id}`);
          const archivedAt = new Date().toISOString();
          const archivedSubAttribute = response.data as Partial<SubAttribute> | undefined;
          const shouldKeepArchived =
            !archivedSubAttribute ||
            !!archivedSubAttribute.deletedAt ||
            !!archivedSubAttribute.deactivatedAt ||
            archivedSubAttribute.isActive === false ||
            archivedSubAttribute.isAvailable === false;

          setAttributes((currentAttributes) =>
            currentAttributes.map((attribute) => ({
              ...attribute,
              subAttributes: shouldKeepArchived
                ? (attribute.subAttributes || []).map((currentSubAttribute) =>
                    currentSubAttribute.id === sub.id
                      ? {
                          ...currentSubAttribute,
                          ...archivedSubAttribute,
                          deletedAt: archivedSubAttribute?.deletedAt ?? archivedAt,
                          deactivatedAt: archivedSubAttribute?.deactivatedAt ?? archivedAt,
                          isActive: false,
                          isAvailable: false,
                        }
                      : currentSubAttribute,
                  )
                : (attribute.subAttributes || []).filter((currentSubAttribute) => currentSubAttribute.id !== sub.id),
            })),
          );
          toast.success(t('attributes.messages.optionDeleted'));
        } catch {
          toast.error(t('attributes.errors.errorDeleting'));
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleReactivateAttribute = (attribute: Attribute) => {
    setConfirmConfig({
      isOpen: true,
      title: t('common.reactivate', { defaultValue: 'Reactivate' }),
      message: t('attributes.confirm.reactivateGroupMessage', {
        name: attribute.name,
        defaultValue: `Reactivate "${attribute.name}" and restore the options archived with this group? Historical order option snapshots stay unchanged.`,
      }),
      confirmText: t('common.reactivate', { defaultValue: 'Reactivate' }),
      type: 'success',
      onConfirm: async () => {
        try {
          await reactivateAttributeById(attribute.id);
        } catch (error: any) {
          toast.error(error.response?.data?.message || t('attributes.errors.errorSaving'));
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleReactivateSubAttribute = (sub: SubAttribute) => {
    setConfirmConfig({
      isOpen: true,
      title: t('common.reactivate', { defaultValue: 'Reactivate' }),
      message: t('attributes.confirm.reactivateOptionMessage', {
        name: sub.name,
        defaultValue: `Reactivate "${sub.name}" so it can be selected in new sales again? Historical order option snapshots stay unchanged.`,
      }),
      confirmText: t('common.reactivate', { defaultValue: 'Reactivate' }),
      type: 'success',
      onConfirm: async () => {
        try {
          await reactivateSubAttributeById(sub.id);
        } catch (error: any) {
          toast.error(error.response?.data?.message || t('attributes.errors.errorSavingOption'));
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleQuickFilter = (priceType: 'ALL' | 'FREE' | 'PAID', findLargestInfo = false) => {
    setFilterPricing(priceType);
    setPage(1);
    setSearchQuery('');

    let targetGroup = null;
    if (findLargestInfo) {
      targetGroup = stats.topGroup;
    } else {
      targetGroup = attributes.find(attr => {
        const subAttributes = Array.isArray(attr.subAttributes) ? attr.subAttributes : [];
        const hasPaid = subAttributes.some(sub => Number(sub.price) > 0);
        const hasFree = subAttributes.some(sub => Number(sub.price) === 0);
        if (priceType === 'PAID') return hasPaid;
        if (priceType === 'FREE') return hasFree;
        return true;
      });
    }

    if (targetGroup) {
      setExpandedId(targetGroup.id);
      setTimeout(() => {
        const element = document.getElementById(`group-${targetGroup.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('attributes.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
            <span>{t('attributes.subtitle')}</span>
            {currentEstablishment?.name && (
              <span className="px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 text-mintcom-green label-strong font-outfit border border-mintcom-green/20">
                {currentEstablishment.name}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openAttributeModal()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-mintcom-green text-black font-bold text-sm hover:bg-[#5fa888] transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>{t('attributes.newGroup')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('attributes.stats.groups'), value: stats.totalGroups, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t('attributes.stats.options'), value: stats.totalOptions, icon: Package, color: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
          { label: t('attributes.stats.sales'), value: stats.paidOptions, sub: t('attributes.stats.withPrice'), icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] shadow-sm overflow-hidden text-left relative">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10 flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="dashboard-stat-title mb-1.5">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="dashboard-card-value">{stat.value.toLocaleString(t('common.locale'))}</p>
                </div>
                {stat.sub && <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{stat.sub}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar & Filters */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-4 shadow-sm space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input maxLength={255}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder={formatInputPlaceholder(t('attributes.filters.searchPlaceholder'), t('common.locale'))}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 transition-all font-medium focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors rounded-lg"
            >
              <X size={12} strokeWidth={2.75} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-widest px-1">{t('common.status.label', 'Status')}</p>
            <SelectInput
              value={filterStatus === 'ALL' ? null : filterStatus}
              onChange={(value) => {
                setFilterStatus((value as StatusFilterValue) || 'ALL');
                setPage(1);
              }}
              options={[
                { label: t('common.active', 'Active'), value: 'ACTIVE' },
                { label: t('common.inactive', 'Inactive'), value: 'INACTIVE' },
              ]}
              allOptionLabel={t('common.allStatuses', 'All Statuses')}
              placeholder={t('common.allStatuses', 'All Statuses')}
            />
          </div>

          {/* Selection Filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-widest px-1">{t('attributes.filters.selection')}</p>
            <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
              {['ALL', 'SINGLE_SELECT', 'MULTI_SELECT'].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilterSelection(f); setPage(1); }}
                  className={`flex-1 py-2 text-xs font-medium tracking-tight rounded-lg transition-all ${filterSelection === f ? 'bg-white dark:bg-white/10 text-mintcom-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {f === 'SINGLE_SELECT' ? t('attributes.filters.single') : f === 'MULTI_SELECT' ? t('attributes.filters.multi') : t('attributes.filters.all')}
                </button>
              ))}
            </div>
          </div>

          {/* Requirement Filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-widest px-1">{t('attributes.filters.required')}</p>
            <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
              {['ALL', 'MANDATORY', 'OPTIONAL'].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilterRequirement(f); setPage(1); }}
                  className={`flex-1 py-2 text-xs font-medium tracking-tight rounded-lg transition-all ${filterRequirement === f ? 'bg-white dark:bg-white/10 text-mintcom-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {f === 'MANDATORY' ? t('attributes.filters.mandatory') : f === 'OPTIONAL' ? t('attributes.filters.optional') : t('attributes.filters.all')}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Model */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-widest px-1">{t('attributes.filters.price')}</p>
            <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
              {['ALL', 'FREE', 'PAID'].map((f) => (
                <button
                  key={f}
                  onClick={() => handleQuickFilter(f as any)}
                  className={`flex-1 py-2 text-xs font-medium tracking-tight rounded-lg transition-all ${filterPricing === f ? 'bg-white dark:bg-white/10 text-mintcom-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
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
              setFilterStatus('ACTIVE');
              setSearchQuery('');
              setPage(1);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-mintcom-red bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl transition-all active:scale-95 group"
          >
            <RotateCcw size={14} className="group-hover:rotate-[-120deg] transition-transform duration-300" />
            <span>{t('attributes.filters.reset')}</span>
          </button>
        </div>
      </div>

      {/* Add-ons List */}
      {isLoading ? (
        <div className="py-32 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-mintcom-green/30 border-t-mintcom-green rounded-full animate-spin mb-4" />
        </div>
      ) : paginatedAttributes.length === 0 ? (
        <div className="py-24 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
            <Package size={32} className="text-gray-300" />
          </div>
          <h3 className="dashboard-card-value mb-2">{addonsEmptyTitle}</h3>
          {addonsEmptyDescription ? (
            <p className="text-sm font-bold text-gray-500 max-w-xs">{addonsEmptyDescription}</p>
          ) : null}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm">
          <div className="p-6 space-y-4">
            {paginatedAttributes.map((attr) => (
              <div
                key={attr.id}
                id={`group-${attr.id}`}
                className={`group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden transition-all duration-300 ${
                  isAttributeActive(attr) ? 'hover:shadow-sm' : 'opacity-75'
                }`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-mintcom-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute left-0 top-0 h-full w-1 bg-mintcom-green opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div
                  onClick={() => setExpandedId(expandedId === attr.id ? null : attr.id)}
                  className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black border ${attr.isRequired ? 'bg-mintcom-green text-black border-mintcom-green' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}>
                      {attr.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{attr.name}</h3>
                        {attr.isRequired && (
                          <span className="label-strong font-outfit px-2 py-0.5 bg-mintcom-green/10 text-mintcom-green rounded-md border border-mintcom-green/20">{t('attributes.list.mandatory')}</span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${
                          isAttributeActive(attr)
                            ? 'bg-mintcom-green/10 text-mintcom-green'
                            : 'bg-mintcom-red/10 text-mintcom-red'
                        }`}>
                          {isAttributeActive(attr) ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-400 tracking-widest mt-1 uppercase capitalize-none">
                        {attr.inputType === 'SINGLE_SELECT' ? t('attributes.list.singleChoice') : t('attributes.list.multipleChoice')} &bull; {attr.subAttributes?.length || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-3">
                      {isAttributeActive(attr) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubAttributeForm({ name: '', price: 0, isAvailable: true });
                            setParentAttributeId(attr.id);
                            setShowSubAttributeModal(true);
                          }}
                          className="w-10 h-10 flex items-center justify-center bg-mintcom-green text-black rounded-xl hover:bg-[#5fa888] transition-all shadow-lg shadow-mintcom-green/20 group active:scale-90"
                          title={t('attributes.addOption')}
                        >
                          <Plus size={20} strokeWidth={3} className="transition-transform group-hover:rotate-90" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); openAttributeModal(attr); }} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-mintcom-green hover:border-mintcom-green/30 transition-colors" title={t('common.edit')}>
                        <Edit2 size={16} />
                      </button>
                      {isAttributeActive(attr) ? (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAttribute(attr); }} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-mintcom-red hover:border-mintcom-red/30 transition-colors" title={t('common.archive')}>
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); handleReactivateAttribute(attr); }} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-mintcom-green hover:border-mintcom-green/30 transition-colors" title={t('common.reactivate', { defaultValue: 'Reactivate' })}>
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(expandedId === attr.id ? null : attr.id);
                      }}
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all ${expandedId === attr.id ? 'bg-mintcom-green/10 text-mintcom-green' : 'text-gray-300'}`}
                    >
                      <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${expandedId === attr.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {expandedId === attr.id && (
                  <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-widest uppercase capitalize-none border-b-2 border-mintcom-green/30 pb-1 inline-block">
                        {t('attributes.list.optionsTitle', 'Group Options')}
                      </h4>
                      {isAttributeActive(attr) && (
                        <button
                          onClick={() => openSubAttributeModal(attr.id)}
                          className="w-8 h-8 flex items-center justify-center bg-mintcom-green text-black rounded-lg hover:bg-[#5fa888] transition-all shadow-md shadow-mintcom-green/10 group active:scale-90"
                          title={t('attributes.addOption')}
                        >
                          <Plus size={16} strokeWidth={3} className="transition-transform group-hover:rotate-90" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {(attr.subAttributes || [])
                        .filter(sub => {
                          if (filterPricing === 'PAID') return Number(sub.price) > 0;
                          if (filterPricing === 'FREE') return Number(sub.price) === 0;
                          return true;
                        })
                        .map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between p-4 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 group/sub hover:border-mintcom-green/30 transition-all shadow-sm">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900 dark:text-white text-base">{sub.name}</p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isSubAttributeActive(sub)
                                    ? 'bg-mintcom-green/10 text-mintcom-green'
                                    : 'bg-mintcom-red/10 text-mintcom-red'
                                }`}>
                                  {isSubAttributeActive(sub) ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-mintcom-green mt-1">
                                {Number(sub.price) > 0 ? `+${formatAmount(Number(sub.price))}` : t('attributes.list.complimentary')}
                              </p>
                            </div>
                            <div className="flex gap-1 transition-opacity">
                              <button onClick={() => openSubAttributeModal(attr.id, sub)} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-mintcom-green hover:bg-mintcom-green/10" title={t('common.edit')}>
                                <Edit2 size={14} />
                              </button>
                              {isSubAttributeActive(sub) ? (
                                <button onClick={() => handleDeleteSubAttribute(sub)} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-mintcom-red hover:bg-mintcom-red/10" title={t('common.archive')}>
                                  <Trash2 size={14} />
                                </button>
                              ) : (
                                <button onClick={() => handleReactivateSubAttribute(sub)} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-mintcom-green hover:bg-mintcom-green/10" title={t('common.reactivate', { defaultValue: 'Reactivate' })}>
                                  <RotateCcw size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            variant="footer"
            totalItems={filteredAttributes.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Add-on Group Modal */}
      {createPortal(
        <AnimatePresence>
          {showAttributeModal && (
            <div
              key="attribute-group-modal-overlay"
              className="fixed inset-0 z-[10000] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans"
              dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
            >
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full sm:max-w-md overflow-hidden h-[92vh] sm:h-auto flex flex-col"
              >
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                </div>
                <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{t('attributes.form.groupTitle')}</h2>
                  <button onClick={() => setShowAttributeModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="px-8 pt-5 pb-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                  <div>
                    <label className="block text-xs font-normal text-gray-400 tracking-normal mb-3 px-1 lowercase">
                      {t('attributes.form.groupNameLabel')} <span className="text-mintcom-red">*</span>
                    </label>
                    <input maxLength={255}
                      type="text"
                      value={attributeForm.name}
                      onChange={(e) => {
                        setAttributeForm({ ...attributeForm, name: e.target.value });
                        if (errors.groupName) setErrors({ ...errors, groupName: '' });
                      }}
                      className={`w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.groupName ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 transition-all`}
                      placeholder={formatInputPlaceholder(t('attributes.form.groupNamePlaceholder'), t('common.locale'))}
                    />
                    {errors.groupName && <p className="mt-1 text-xs font-bold text-mintcom-red">{errors.groupName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAttributeForm({ ...attributeForm, inputType: 'SINGLE_SELECT' })}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 text-left relative overflow-hidden group ${attributeForm.inputType === 'SINGLE_SELECT'
                        ? 'bg-mintcom-green/10 border-mintcom-green'
                        : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/5 hover:border-mintcom-green/30'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${attributeForm.inputType === 'SINGLE_SELECT' ? 'bg-mintcom-green text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                        <MousePointerClick size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${attributeForm.inputType === 'SINGLE_SELECT' ? 'text-mintcom-green' : 'text-gray-900 dark:text-white'}`}>{t('attributes.form.single')}</p>
                        <p className="text-xs font-medium text-gray-400 mt-1">{t('attributes.form.singleDesc')}</p>
                      </div>
                      {attributeForm.inputType === 'SINGLE_SELECT' && (
                        <div className="absolute top-4 right-4 text-mintcom-green">
                          <div className="w-2 h-2 rounded-full bg-mintcom-green shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttributeForm({ ...attributeForm, inputType: 'MULTI_SELECT' })}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 text-left relative overflow-hidden group ${attributeForm.inputType === 'MULTI_SELECT'
                        ? 'bg-mintcom-green/10 border-mintcom-green'
                        : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/5 hover:border-mintcom-green/30'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${attributeForm.inputType === 'MULTI_SELECT' ? 'bg-mintcom-green text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                        <CheckSquare size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${attributeForm.inputType === 'MULTI_SELECT' ? 'text-mintcom-green' : 'text-gray-900 dark:text-white'}`}>{t('attributes.form.multiple')}</p>
                        <p className="text-xs font-medium text-gray-400 mt-1">{t('attributes.form.multipleDesc')}</p>
                      </div>
                      {attributeForm.inputType === 'MULTI_SELECT' && (
                        <div className="absolute top-4 right-4 text-mintcom-green">
                          <div className="w-2 h-2 rounded-full bg-mintcom-green shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-none mb-1">{t('attributes.form.requiredLabel')}</p>
                      <p className="text-xs text-gray-500 font-medium">{t('attributes.form.requiredDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={attributeForm.isRequired} onChange={() => setAttributeForm({ ...attributeForm, isRequired: !attributeForm.isRequired })} className="sr-only peer" />
                      <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:bg-mintcom-green transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    {editingAttribute && !isAttributeActive(editingAttribute) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowAttributeModal(false)}
                          disabled={isSubmitting}
                          className="flex-1 py-4 bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black rounded-2xl border border-gray-200 dark:border-white/10 hover:text-gray-900 dark:hover:text-white tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReactivateAttribute(editingAttribute)}
                          disabled={isSubmitting}
                          className="flex-1 py-4 bg-mintcom-green text-black font-black rounded-2xl hover:scale-[1.02] tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-mintcom-green/20 transition-all"
                        >
                          <RotateCcw size={16} />
                          {t('common.reactivate', { defaultValue: 'Reactivate' })}
                        </button>
                      </>
                    ) : (
                      <>
                        {editingAttribute && isAttributeActive(editingAttribute) && (
                          <button
                            onClick={() => {
                              setShowAttributeModal(false);
                              handleDeleteAttribute(editingAttribute);
                            }}
                            disabled={isSubmitting}
                            className="flex-1 py-4 border border-mintcom-red/20 text-mintcom-red font-black rounded-2xl hover:bg-mintcom-red/5 tracking-widest text-xs flex items-center justify-center gap-2"
                          >
                            <Trash2 size={16} />
                            {t('common.archive')}
                          </button>
                        )}
                        <button onClick={handleSaveAttribute} disabled={isSubmitting} className="flex-1 py-4 bg-mintcom-green text-black font-black rounded-2xl hover:scale-[1.02] tracking-widest text-xs flex items-center justify-center gap-2">
                          {t('common.save')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Add-on Option Modal */}
      {createPortal(
        <AnimatePresence>
          {showSubAttributeModal && (
            <div
              key="attribute-option-modal-overlay"
              className="fixed inset-0 z-[10000] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans"
              dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
            >
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-sm overflow-hidden h-[92vh] sm:h-auto flex flex-col"
              >
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                </div>
                <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{t('attributes.form.optionTitle')}</h2>
                  <button onClick={() => setShowSubAttributeModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="px-8 pt-5 pb-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                  <div>
                    <label className="block text-xs font-normal text-gray-400 tracking-normal mb-3 px-1 lowercase">
                      {t('attributes.form.optionNameLabel')} <span className="text-mintcom-red">*</span>
                    </label>
                    <input maxLength={255}
                      type="text"
                      value={subAttributeForm.name}
                      onChange={(e) => {
                        setSubAttributeForm({ ...subAttributeForm, name: e.target.value });
                        if (errors.optionName) setErrors({ ...errors, optionName: '' });
                      }}
                      className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${errors.optionName ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 transition-all`}
                      placeholder={formatInputPlaceholder(t('attributes.form.optionNamePlaceholder'), t('common.locale'))}
                    />
                    {errors.optionName && <p className="mt-1 text-xs font-bold text-mintcom-red">{errors.optionName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-gray-400 tracking-normal mb-3 px-1 lowercase">{formatInputLabel(t('attributes.form.priceLabel'), t('common.locale'))}</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-lg">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-black">{currencySymbol}</span>
                      </div>
                      <input maxLength={255}
                        type="text"
                        inputMode="decimal"
                        value={subAttributeForm.price === 0 ? '' : subAttributeForm.price.toFixed(2)}
                        placeholder={formatInputPlaceholder("0.00", t('common.locale'))}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length > 19) return;
                          const numericValue = parseInt(val || '0', 10) / 100;
                          setSubAttributeForm({ ...subAttributeForm, price: numericValue });
                        }}                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-16 pr-4 py-3.5 text-gray-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
                      />
                    </div>
                    <p className="mt-2 text-[10px] font-bold text-mintcom-green tracking-widest px-1">{t('attributes.form.atmStyle')}</p>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white tracking-tight">{t('attributes.form.availableLabel')}</p>
                      <QuickInfo text={t('attributes.form.availableTip')} />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={subAttributeForm.isAvailable} onChange={() => setSubAttributeForm({ ...subAttributeForm, isAvailable: !subAttributeForm.isAvailable })} className="sr-only peer" />
                      <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:bg-mintcom-green transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    {editingSubAttribute && !isSubAttributeActive(editingSubAttribute) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowSubAttributeModal(false)}
                          disabled={isSubmitting}
                          className="flex-1 py-4 bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black rounded-2xl border border-gray-200 dark:border-white/10 hover:text-gray-900 dark:hover:text-white tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReactivateSubAttribute(editingSubAttribute)}
                          disabled={isSubmitting}
                          className="flex-1 py-4 bg-mintcom-green text-black font-black rounded-2xl hover:scale-[1.02] tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-mintcom-green/20"
                        >
                          <RotateCcw size={16} />
                          {t('common.reactivate', { defaultValue: 'Reactivate' })}
                        </button>
                      </>
                    ) : (
                      <>
                        {editingSubAttribute && isSubAttributeActive(editingSubAttribute) && (
                          <button
                            onClick={() => {
                              setShowSubAttributeModal(false);
                              handleDeleteSubAttribute(editingSubAttribute);
                            }}
                            disabled={isSubmitting}
                            className="flex-1 py-4 border border-mintcom-red/20 text-mintcom-red font-black rounded-2xl hover:bg-mintcom-red/5 tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 size={16} />
                            {t('common.archive')}
                          </button>
                        )}
                        <button onClick={handleSaveSubAttribute} disabled={isSubmitting} className="flex-1 py-4 bg-mintcom-green text-black font-black rounded-2xl hover:scale-[1.02] tracking-widest text-xs transition-all flex items-center justify-center gap-2">
                          {t('common.save')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        secondaryText={confirmConfig.secondaryText}
        onSecondary={confirmConfig.onSecondary}
        showCancel={confirmConfig.showCancel}
        type={confirmConfig.type}
      />
    </div>
  );
}


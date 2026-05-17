import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Minus,
  User,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit2,
  History,
  Award,
  X,
  ShoppingBag,
  Calendar,
  MoreVertical,
  Download,
  Eye
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { PortalDropdown } from '../../components/PortalDropdown';
import { exportToCSV } from '../../utils/export';
import { SearchInput, Pagination } from '../../components/ui';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { useCurrency } from '../../context/CurrencyContext';
import { formatInputPlaceholder, formatInputLabel } from '../../utils/textCase';

interface ApiError {
  response?: {
    data?: {
      message?: string;
      code?: string;
      allowedAction?: string;
    };
  };
}

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
  tier: string;
  totalSpent: number;
  totalVisits: number;
  address?: string;
  notes?: string;
}

interface CustomerStats {
  totalCustomers: number;
  totalPoints: number;
  totalSpent: number;
}

interface TableActionMenuProps {
  customer: Customer;
  onViewProfile: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

function TableActionMenu({ customer, onViewProfile, onDelete }: TableActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More actions"
        className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all ${
          isOpen 
            ? 'bg-mintcom-green text-black border-mintcom-green' 
            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
        }`}
      >
        <MoreVertical size={18} />
      </button>

      <PortalDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        align="right"
      >
        <div className="py-1">
          <button
            onClick={() => {
              onViewProfile(customer);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
          >
            <Eye size={14} className="text-mintcom-green" />
            {t('customers.messages.viewProfile')}
          </button>
          <button
            onClick={() => {
              onDelete(customer);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-mintcom-red hover:bg-mintcom-red/10 transition-colors text-left border-t border-gray-100 dark:border-white/5"
          >
            <Trash2 size={14} />
            {t('customers.messages.removeCustomer')}
          </button>
        </div>
      </PortalDropdown>
    </>
  );
}

export function CustomersPage() {
  const { t } = useTranslation();
  const { currentEstablishment } = useAuth();
  usePermissionGuard();

  const { formatAmount, currencySymbol } = useCurrency();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointsAction, setPointsAction] = useState<'add' | 'deduct'>('add');
  const [pointsAmount, setPointsAmount] = useState<number>(0);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    totalPoints: 0,
    totalSpent: 0,
  });
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning';
    confirmText?: string;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const [customersResponse, statsResponse] = await Promise.all([
        api.get('/customers', {
          params: {
            page,
            limit: 10,
            search: searchQuery,
          },
        }),
        api.get('/customers/stats'),
      ]);

      setCustomers(customersResponse.data.customers || []);
      setTotalPages(customersResponse.data.pagination?.totalPages || 1);
      setStats({
        totalCustomers: customersResponse.data.pagination?.total || statsResponse.data.totalCustomers || 0,
        totalPoints: Number(statsResponse.data.totalPoints || 0),
        totalSpent: Number(statsResponse.data.totalSpent || 0),
      });
    } catch {
      toast.error(t('customers.messages.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  useEffect(() => {
    if (page === 1) {
      fetchCustomers();
      return;
    }
    setPage(1);
  }, [searchQuery]);

  const handleSaveCustomer = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, data);
        toast.success(t('customers.messages.updated'));
      } else {
        await api.post('/customers', data);
        toast.success(t('customers.messages.created'));
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || t('customers.messages.errorSaving'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setConfirmConfig({
      isOpen: true,
      title: t('customers.messages.removeCustomer'),
      message: t('customers.messages.deleteConfirm'),
      type: 'danger',
      confirmText: t('common.continue'),
      onConfirm: () => {
        setShowSecurityModal(true);
      }
    });
  };

  const onSecurityVerify = async () => {
    setShowSecurityModal(false);
    fetchCustomers();
  };

  const handleAnonymizeCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      await api.post(`/customers/${selectedCustomer.id}/anonymize`, {
        reason: 'Customer removed from management UI',
      });
      toast.success(t('customers.messages.anonymized'));
      setShowDetailModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || t('customers.messages.anonymizeFailed'));
    }
  };

  const handleSecurityError = (error: ApiError) => {
    const data = error.response?.data;
    if (data?.code !== 'RECORD_HAS_HISTORY' && data?.allowedAction !== 'anonymize_customer') {
      return false;
    }

    setShowSecurityModal(false);
    setConfirmConfig({
      isOpen: true,
      title: t('customers.messages.anonymizeCustomer'),
      message: t('customers.messages.anonymizeConfirm', { name: selectedCustomer?.name || '' }),
      type: 'warning',
      confirmText: t('common.anonymize'),
      onConfirm: handleAnonymizeCustomer,
    });
    return true;
  };

  const handlePointsUpdate = async () => {
    if (!selectedCustomer || pointsAmount <= 0) return;
    setPointsError(null);

    if (pointsAction === 'deduct' && pointsAmount > selectedCustomer.points) {
      setPointsError(t('customers.messages.insufficientPoints', { points: selectedCustomer.points }));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/customers/${selectedCustomer.id}/points`, {
        points: pointsAction === 'add' ? pointsAmount : -pointsAmount,
      });
      toast.success(t('customers.messages.pointsAdjusted'));
      setShowPointsModal(false);
      setPointsAmount(0);
      fetchCustomers();
    } catch (err) {
      setPointsError((err as ApiError).response?.data?.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleExport = async () => {
    try {
      toast.loading('Exporting...', { id: 'export' });
      const response = await api.get('/customers', {
        params: {
          limit: 1000,
          search: searchQuery,
        },
      });

      const allCustomers = response.data.customers || [];
      const exportData = allCustomers.map((c: Customer) => ({
        name: c.name,
        phone: c.phone,
        email: c.email || 'N/a',
        tier: c.tier,
        points: c.points,
        totalSpent: c.totalSpent,
        visits: c.totalVisits
      }));

      exportToCSV(exportData, 'customers_registry', {
        name: t('customers.form.name'),
        phone: t('customers.form.phone'),
        email: t('customers.form.email'),
        tier: t('rewards.items.tier', { defaultValue: 'Tier' }),
        points: t('customers.details.points'),
        totalSpent: `${t('customers.details.spent')} (${currencySymbol})`,
        visits: t('customers.details.visits')
      });
      toast.success('Export complete', { id: 'export' });
    } catch {
      toast.error('Failed to export customers', { id: 'export' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-10" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('customers.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
            <span>{t('customers.subtitle')}</span>
            {currentEstablishment?.name && (
              <span className="px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 text-mintcom-green label-strong font-outfit border border-mintcom-green/20">
                {currentEstablishment.name}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExport}
            className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
          >
            <Download size={18} />
            <span>{t('orders.export')}</span>
          </button>
          <button
            onClick={() => { setEditingCustomer(null); reset({ name: '', phone: '', email: '', address: '', notes: '' }); setShowModal(true); }}
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-mintcom-green text-black font-bold text-sm hover:bg-[#5fa888] transition-all shadow-sm touch-target"
          >
            <Plus size={18} />
            <span className="hidden xs:inline">{t('customers.addCustomer')}</span>
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto scrollbar-none gap-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible pb-2 sm:pb-0">
        {[
          { label: t('customers.stats.total'), value: stats.totalCustomers, icon: User, color: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
          { label: t('customers.stats.points'), value: stats.totalPoints, icon: Award, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t('customers.stats.spent'), value: formatAmount(stats.totalSpent), icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden transition-all duration-300 min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="dashboard-stat-title mb-1 truncate">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">{stat.value.toLocaleString(t('common.locale'))}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/5 p-3 sm:p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder={formatInputPlaceholder(t('customers.searchPlaceholder'), t('common.locale'))}
            className="w-full"
          />
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm min-h-[250px] lg:min-h-[350px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 sm:p-32">
            <div className="w-12 h-12 border-4 border-mintcom-green/10 border-t-mintcom-green rounded-full animate-spin mb-4" />
            <p className="label-strong font-outfit">{t('customers.messages.loading')}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 sm:p-32 text-center bg-gray-50/30 dark:bg-black/10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center mb-4 sm:mb-6 border border-gray-200 dark:border-white/5 shadow-sm">
              <User size={32} className="sm:w-10 sm:h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {searchQuery.trim() ? t('common.noResults') : t('customers.messages.noCustomers')}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8">
              {searchQuery.trim()
                ? t('common.noMatchingResults', {
                    entity: 'customers',
                    query: searchQuery.trim(),
                    defaultValue: 'No {{entity}} matching "{{query}}"',
                  })
                : t('customers.messages.noCustomersDesc')}
            </p>
            {!searchQuery.trim() && (
              <button
                onClick={() => { setEditingCustomer(null); reset({ name: '', phone: '', email: '', address: '', notes: '' }); setShowModal(true); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-mintcom-green text-black font-bold text-sm hover:bg-[#5fa888] transition-all shadow-sm"
              >
                <Plus size={18} />
                <span>{t('customers.addCustomer')}</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
              {customers.map((customer, idx) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => { setSelectedCustomer(customer); setShowDetailModal(true); }}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer active:bg-gray-100 dark:active:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.totalVisits} {t('customers.details.visits')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-mintcom-green">{customer.points}</p>
                      <p className="text-xs text-gray-400">{t('rewards.points')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 pt-3 border-t border-gray-100 dark:border-white/5">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('staff.form.phoneLabel')}</p>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white truncate">
                        <Phone size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{customer.phone || t('common.notAvailable')}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('customers.details.spent')}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{customer.totalSpent.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setSelectedCustomer(customer); setPointsAmount(0); setShowPointsModal(true); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-mintcom-green/10 text-mintcom-green text-xs font-bold touch-target"
                    >
                      <Award size={14} />
                      {t('customers.details.points')}
                    </button>
                    <button
                      onClick={() => openEditModal(customer)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 text-xs font-bold touch-target"
                    >
                      <Edit2 size={14} />
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-500/20 text-mintcom-red hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-xs font-bold touch-target"
                    >
                      <Trash2 size={14} />
                      {t('common.remove')}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr className="border-b border-gray-200 dark:border-white/5">
                    <th className="px-6 py-4 text-left dashboard-card-label">{t('customers.form.name')}</th>
                    <th className="px-6 py-4 text-center dashboard-card-label">{t('customers.details.points')}</th>
                    <th className="px-6 py-4 text-center dashboard-card-label">{t('staff.table.contact')}</th>
                    <th className="px-6 py-4 text-center dashboard-card-label">{t('customers.details.spent')}</th>
                    <th className="px-6 py-4 text-center dashboard-card-label">{t('owner.locations.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {customers.map((customer, idx) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => { setSelectedCustomer(customer); setShowDetailModal(true); }}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{customer.name}</p>
                            <p className="dashboard-card-label">{customer.totalVisits} {t('customers.details.visits')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col gap-1 items-center justify-center">
                          <p className="text-sm font-black text-mintcom-green">{customer.points}</p>
                          <p className="dashboard-card-label">{t('rewards.points')}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1 flex flex-col items-center justify-center">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Phone size={12} className="text-gray-400" />
                            <span className="font-medium">{customer.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Mail size={12} className="text-gray-400" />
                            <span className="font-medium">{customer.email || t('owner.staff.noEmail')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-black text-gray-900 dark:text-white text-sm">{customer.totalSpent.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</p>
                        <p className="text-xs text-mintcom-green font-black tracking-widest">{t('common.active')}</p>
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button
                            onClick={() => { setSelectedCustomer(customer); setPointsAmount(0); setShowPointsModal(true); }}
                            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-mintcom-green hover:border-mintcom-green/30 transition-all"
                            title="Adjust Points"
                          >
                            <Award size={18} />
                          </button>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          
                          <TableActionMenu 
                            customer={customer} 
                            onViewProfile={(c) => {
                              setSelectedCustomer(c);
                              setShowDetailModal(true);
                            }}
                            onDelete={(c) => handleDeleteCustomer(c)}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              variant="footer"
            />
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && createPortal(
          <div className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white dark:bg-[#1E293B] rounded-t-2xl sm:rounded-xl border border-gray-200 dark:border-white/5 w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="dashboard-card-value">
                  {editingCustomer ? t('customers.editCustomer') : t('customers.newCustomer')}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit(handleSaveCustomer)} className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="block text-xs font-normal text-gray-400 tracking-[0.2em] px-1 flex items-center">
                    {t('customers.form.name')} <span className="text-mintcom-red mx-1">*</span>
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-mintcom-green transition-colors" />
                    <input maxLength={255}
                      type="text"
                      {...register('name')}
                      placeholder={formatInputPlaceholder(t('customers.form.namePlaceholder'), t('common.locale'))}
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/20 border ${errors.name ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl text-gray-900 dark:text-white font-normal focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all shadow-sm`}
                    />
                  </div>
                  {errors.name && <p className="text-mintcom-red text-xs px-1 font-black tracking-widest mt-1.5">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-xs font-normal text-gray-400 tracking-[0.2em] px-1">
                      {t('customers.form.phone')} (optional)
                    </label>
                    <input maxLength={255}
                      type="tel"
                      {...register('phone')}
                      placeholder={formatInputPlaceholder(t('customers.form.phonePlaceholder'), t('common.locale'))}
                      className={`w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.phone ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl text-gray-900 dark:text-white font-normal focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all shadow-sm`}
                    />
                    {errors.phone && <p className="text-mintcom-red text-xs px-1 font-black tracking-widest mt-1.5">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-normal text-gray-400 tracking-[0.2em] px-1">{t('customers.form.email')} (optional)</label>
                    <input maxLength={255}
                      type="email"
                      {...register('email')}
                      placeholder={formatInputPlaceholder(t('customers.form.emailPlaceholder'), t('common.locale'))}
                      className={`w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.email ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl text-gray-900 dark:text-white font-normal focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all shadow-sm`}
                    />
                    {errors.email && <p className="text-mintcom-red text-xs px-1 font-black tracking-widest mt-1.5">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-normal text-gray-400 tracking-[0.2em] px-1">{t('customers.form.address')} (optional)</label>
                  <input maxLength={255}
                    type="text"
                    {...register('address')}
                    placeholder={formatInputPlaceholder(t('customers.form.addressPlaceholder'), t('common.locale'))}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-normal focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all shadow-sm"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black tracking-[0.2em] text-xs rounded-xl hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5 active:scale-95 shadow-sm"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-mintcom-green text-black font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 tracking-[0.2em] text-xs shadow-lg shadow-mintcom-green/20"
                  >
                    {editingCustomer ? t('customers.form.updateCustomer') : t('customers.form.saveCustomer')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPointsModal && selectedCustomer && createPortal(
          <div className="fixed inset-0 z-[9999] popup-surface flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowPointsModal(false)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/5 w-full max-w-sm overflow-hidden relative shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('customers.details.adjustLoyalty')}</h2>
                <button
                  onClick={() => {
                    setShowPointsModal(false);
                    setPointsError(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('customers.details.customer')}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                </div>

                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
                  {['add', 'deduct'].map((action) => (
                    <button
                      key={action}
                      onClick={() => {
                        setPointsAction(action as 'add' | 'deduct');
                        setPointsError(null);
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        pointsAction === action
                          ? action === 'add'
                            ? 'bg-mintcom-green text-black shadow-sm'
                            : 'bg-mintcom-red text-white shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      {action === 'add' ? <Plus size={14} /> : <Minus size={14} />}
                      {t(`customers.details.${action}`)}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-normal text-gray-400  tracking-normal">{formatInputLabel(t('customers.details.points'), t('common.locale'))}</label>
                  <div className="relative">
                    <input maxLength={255}
                      type="text"
                      inputMode="numeric"
                      value={pointsAmount === 0 ? '' : pointsAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length > 19) return;
                        const numericValue = parseInt(val || '0', 10);
                        setPointsAmount(numericValue);
                        setPointsError(null);
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border ${pointsError ? 'border-mintcom-red' : 'border-gray-200 dark:border-white/10'} rounded-xl text-lg font-bold focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all outline-none`}
                      placeholder={formatInputPlaceholder("0", t('common.locale'))}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-mintcom-green tracking-widest px-1">{t('attributes.form.atmStyle', { defaultValue: 'Digits shift right to left (ATM style)' })}</p>                  {pointsError && (                    <p className="text-[10px] font-bold text-mintcom-red uppercase tracking-wider">
                      {pointsError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowPointsModal(false)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold text-xs rounded-xl hover:text-gray-900 dark:hover:text-white transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    onClick={handlePointsUpdate} 
                    disabled={isSubmitting || pointsAmount <= 0} 
                    className="flex-[2] py-3 bg-mintcom-green text-black font-bold rounded-xl hover:bg-[#5fa888] transition-all disabled:opacity-50 text-xs"
                  >
                    {t('customers.details.confirmAdjustment')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailModal && selectedCustomer && createPortal(
          <div className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="bg-white dark:bg-[#1E293B] rounded-t-2xl sm:rounded-xl border border-gray-200 dark:border-white/5 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-10 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-transparent">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
                      <User size={28} />
                    </div>
                    <div>
                      <h2 className="dashboard-card-value">{selectedCustomer.name}</h2>
                      <div className="mt-2 flex items-center gap-2 text-mintcom-green">
                        <Award size={14} className="animate-pulse" />
                        <p className="text-lg font-black tracking-tight">{selectedCustomer.points} {t('rewards.points')}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="p-3 bg-white dark:bg-white/5 rounded-xl text-gray-400 hover:text-black dark:hover:text-white transition-colors shadow-sm">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: t('customers.details.spent'), value: formatAmount(selectedCustomer.totalSpent), icon: ShoppingBag },
                    { label: t('customers.details.visits'), value: `${selectedCustomer.totalVisits.toLocaleString(t('common.locale'))} ${t('customers.details.orders')}`, icon: Calendar },
                    { label: t('customers.details.points'), value: `${selectedCustomer.points.toLocaleString(t('common.locale'))} ${t('rewards.points')}`, icon: Award },
                  ].map((stat, i) => (
                    <div key={i} className="p-5 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                      <p className="dashboard-stat-title mb-3">{stat.label}</p>
                      <p className="dashboard-card-value">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Mail size={12} className="text-mintcom-green" /> {t('customers.details.contactInfo')}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                        <Phone size={14} className="text-mintcom-green flex-shrink-0" />
                        <span className="truncate">{selectedCustomer.phone || t('common.notAvailable')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                        <Mail size={14} className="text-mintcom-green flex-shrink-0" />
                        <span className="truncate">{selectedCustomer.email || t('owner.staff.noEmail')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                        <MapPin size={14} className="text-mintcom-green flex-shrink-0" />
                        <span className="break-words">{selectedCustomer.address || t('common.notAvailable')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <History size={12} className="text-mintcom-green" /> {t('customers.details.insights')}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                       <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('customers.details.visits')}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedCustomer.totalVisits} {t('customers.details.orders')}</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('customers.details.spent')}</p>
                        <p className="text-sm font-bold text-mintcom-green">{formatAmount(selectedCustomer.totalSpent)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCustomer.notes && (
                  <div className="p-6 bg-mintcom-green/5 border border-mintcom-green/10 rounded-xl">
                    <p className="label-strong font-outfit text-mintcom-green mb-2">{t('customers.details.notes')}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <button onClick={() => { setShowDetailModal(false); handleDeleteCustomer(selectedCustomer); }} className="px-6 py-4 bg-mintcom-red/10 text-mintcom-red font-black rounded-xl text-xs tracking-widest transition-all hover:bg-mintcom-red hover:text-white active:scale-95 shadow-sm">
                    <Trash2 size={18} />
                  </button>
                  <button onClick={() => { setShowDetailModal(false); openEditModal(selectedCustomer); }} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-xl text-xs tracking-[0.2em] transition-all hover:scale-[1.02] shadow-lg active:scale-95">
                    {t('common.edit')}
                  </button>
                  <button onClick={() => { setShowDetailModal(false); setShowPointsModal(true); setPointsAmount(0); }} className="flex-1 py-4 bg-mintcom-green text-black font-black rounded-xl text-xs tracking-[0.2em] transition-all hover:scale-[1.02] shadow-lg shadow-mintcom-green/20 active:scale-95">
                    {t('customers.details.points')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        showCancel={confirmConfig.showCancel}
      />

      <SecurityVerificationModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        onSuccess={onSecurityVerify}
        targetId={selectedCustomer?.id || ''}
        targetName={selectedCustomer?.name || ''}
        mode="delete-customer"
        onError={handleSecurityError}
      />
    </div>
  );
}




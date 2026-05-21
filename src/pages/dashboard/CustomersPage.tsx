import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
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
  Award,
  X,
  ShoppingBag,
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
import { StatValue } from '../../components/ui/StatValue';

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
          { label: t('customers.stats.total'), value: stats.totalCustomers, icon: User, color: 'text-mintcom-green', bg: 'bg-mintcom-green/10', isCurrency: false },
          { label: t('customers.stats.points'), value: stats.totalPoints, icon: Award, color: 'text-blue-500', bg: 'bg-blue-500/10', isCurrency: false },
          { label: t('customers.stats.spent'), value: stats.totalSpent, icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-500/10', isCurrency: true },
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
                <StatValue 
                    value={stat.value} 
                    currency={stat.isCurrency ? currencySymbol : null}
                    className="text-2xl"
                    isInteger={!stat.isCurrency}
                />
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('customers.messages.noCustomers')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{t('customers.messages.noResults')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase">{t('customers.form.name')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase">{t('customers.form.phone')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase">{t('rewards.items.tier', { defaultValue: 'Tier' })}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase">{t('customers.details.points')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase text-right">{t('customers.details.spent')}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {customers.map((customer) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-bold text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-mintcom-green transition-colors">
                            {customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-medium">{customer.phone || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border ${
                          customer.tier === 'GOLD' 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                            : customer.tier === 'SILVER'
                            ? 'bg-gray-400/10 text-gray-500 border-gray-400/20'
                            : 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20'
                        }`}>
                          <Award size={10} />
                          {customer.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{customer.points.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-gray-400">{t('customers.details.points')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatAmount(customer.totalSpent)}</p>
                        <p className="text-[10px] font-bold text-gray-400">{customer.totalVisits} {t('customers.details.visits')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-mintcom-green hover:text-black hover:border-mintcom-green transition-all"
                            aria-label="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <TableActionMenu
                            customer={customer}
                            onViewProfile={(c) => { setSelectedCustomer(c); setShowDetailModal(true); }}
                            onDelete={handleDeleteCustomer}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-auto border-t border-gray-100 dark:border-white/5 p-4 bg-gray-50/50 dark:bg-white/[0.02]">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Customer Form Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10"
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
                    {editingCustomer ? <Edit2 size={20} /> : <Plus size={20} />}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingCustomer ? t('customers.messages.editCustomer') : t('customers.addCustomer')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleSaveCustomer)} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                      {formatInputLabel(t('customers.form.name'), t('common.locale'))}
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input maxLength={255}
                        {...register('name')}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green outline-none transition-all"
                      />
                    </div>
                    {errors.name && <p className="text-[10px] font-bold text-mintcom-red px-1">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                      {formatInputLabel(t('customers.form.phone'), t('common.locale'))}
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input maxLength={255}
                        {...register('phone')}
                        placeholder="+1 234 567 890"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                    {formatInputLabel(t('customers.form.email'), t('common.locale'))}
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input maxLength={255}
                      {...register('email')}
                      type="email"
                      placeholder="john@example.com"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                    {formatInputLabel(t('customers.form.address'), t('common.locale'))}
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input maxLength={255}
                      {...register('address')}
                      placeholder="Street, City, Country"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                    {formatInputLabel(t('common.notes'), t('common.locale'))}
                  </label>
                  <textarea maxLength={1000}
                    {...register('notes')}
                    rows={3}
                    className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green outline-none transition-all resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 py-4 px-8 bg-mintcom-green text-black font-black text-sm rounded-2xl hover:bg-[#5fa888] disabled:opacity-50 transition-all shadow-lg shadow-mintcom-green/20"
                  >
                    {isSubmitting ? t('common.saving') : editingCustomer ? t('customers.messages.updateCustomer') : t('customers.messages.saveCustomer')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCustomer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10"
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User size={20} className="text-mintcom-green" />
                  {t('customers.messages.customerProfile')}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-20 h-20 rounded-full bg-mintcom-green text-black flex items-center justify-center text-3xl font-black shadow-lg shadow-mintcom-green/20">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</h3>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                      <span className="px-2.5 py-1 rounded-lg bg-mintcom-green/10 text-mintcom-green text-[10px] font-black tracking-wider uppercase border border-mintcom-green/20">
                        {selectedCustomer.tier}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 text-[10px] font-black tracking-wider uppercase border border-gray-200 dark:border-white/10">
                        ID: {selectedCustomer.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowDetailModal(false); openEditModal(selectedCustomer); }}
                      className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-mintcom-green transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => { setShowDetailModal(false); handleDeleteCustomer(selectedCustomer); }}
                      className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-mintcom-red transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('customers.details.points')}</p>
                    <StatValue value={selectedCustomer.points} isInteger={true} className="text-xl font-black" />
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('customers.details.spent')}</p>
                    <StatValue value={selectedCustomer.totalSpent} currency={currencySymbol} className="text-xl font-black text-mintcom-green" />
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('customers.details.visits')}</p>
                    <StatValue value={selectedCustomer.totalVisits} isInteger={true} className="text-xl font-black" />
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('customers.details.avgValue')}</p>
                    <StatValue
                      value={selectedCustomer.totalVisits > 0 ? selectedCustomer.totalSpent / selectedCustomer.totalVisits : 0}
                      currency={currencySymbol}
                      className="text-xl font-black"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{t('customers.details.contact')}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <Phone size={16} className="text-mintcom-green" />
                        <span className="font-medium">{selectedCustomer.phone || '—'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <Mail size={16} className="text-mintcom-green" />
                        <span className="font-medium">{selectedCustomer.email || '—'}</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-gray-500">
                        <MapPin size={16} className="text-mintcom-green shrink-0 mt-0.5" />
                        <span className="font-medium">{selectedCustomer.address || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{t('common.notes')}</h4>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                      {selectedCustomer.notes || t('customers.messages.noNotes')}
                    </p>
                  </div>
                </div>

                {/* Points Quick Actions */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <button
                    onClick={() => { setShowDetailModal(false); setShowPointsModal(true); }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-mintcom-green/10 hover:bg-mintcom-green/20 border border-mintcom-green/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-mintcom-green text-black flex items-center justify-center shadow-sm">
                        <Award size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{t('customers.details.managePoints')}</p>
                        <p className="text-[10px] font-bold text-mintcom-green uppercase tracking-wider">{t('customers.details.addOrDeduct')}</p>
                      </div>
                    </div>
                    <Plus size={20} className="text-mintcom-green group-hover:scale-125 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Points Adjustment Modal */}
      <AnimatePresence>
        {showPointsModal && selectedCustomer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPointsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10"
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('customers.details.adjustPoints')}</h2>
                <button
                  onClick={() => setShowPointsModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-10 h-10 rounded-full bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-bold">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                    <p className="text-xs font-medium text-gray-500">{t('customers.details.currentBalance')}: <span className="text-mintcom-green font-bold">{selectedCustomer.points.toLocaleString()}</span></p>
                  </div>
                </div>

                <div className="flex p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl gap-1.5">
                  <button
                    onClick={() => setPointsAction('add')}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                      pointsAction === 'add' 
                        ? 'bg-mintcom-green text-black shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <Plus size={16} className="inline mr-2" />
                    {t('customers.details.add')}
                  </button>
                  <button
                    onClick={() => setPointsAction('deduct')}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                      pointsAction === 'deduct' 
                        ? 'bg-mintcom-red text-white shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <Minus size={16} className="inline mr-2" />
                    {t('customers.details.deduct')}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">{t('customers.details.pointsAmount')}</label>
                  <div className="relative">
                    <Award size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input maxLength={255}
                      type="number"
                      value={pointsAmount || ''}
                      onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-lg font-black focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                  {pointsError && <p className="text-xs font-bold text-mintcom-red px-1">{pointsError}</p>}
                </div>

                <button
                  onClick={handlePointsUpdate}
                  disabled={isSubmitting || pointsAmount <= 0}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${
                    pointsAction === 'add'
                      ? 'bg-mintcom-green text-black hover:bg-[#5fa888] shadow-mintcom-green/20'
                      : 'bg-mintcom-red text-white hover:bg-red-600 shadow-red-500/20'
                  } disabled:opacity-50`}
                >
                  {isSubmitting 
                    ? t('common.saving') 
                    : pointsAction === 'add' 
                      ? t('customers.details.addPoints') 
                      : t('customers.details.deductPoints')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Security and Confirmation Modals */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          setConfirmConfig({ ...confirmConfig, isOpen: false });
          confirmConfig.onConfirm();
        }}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
      />

      <SecurityVerificationModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        onSuccess={onSecurityVerify}
        onError={handleSecurityError}
        mode="delete-customer"
        targetId={selectedCustomer?.id || ''}
        targetName={selectedCustomer?.name || ''}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus,
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
import { exportToCSV } from '../../utils/export';
import { SearchInput, Pagination } from '../../components/ui';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { useCurrency } from '../../context/CurrencyContext';

interface ApiError {
  response?: {
    data?: {
      message?: string;
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

export function CustomersPage() {
  const { t } = useTranslation();
  // Permission guard - redirects if user lacks permission
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
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning';
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
      const response = await api.get('/customers', {
        params: {
          page,
          limit: 10,
          search: searchQuery,
        },
      });
      setCustomers(response.data.customers || []);
      setTotalPages(response.data.totalPages || 1);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, searchQuery]);

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
    setConfirmConfig({
      isOpen: true,
      title: t('paymentMethods.confirm.removeTitle'),
      message: t('customers.messages.removed') + ` ${customer.name}?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/customers/${customer.id}`);
          toast.success(t('customers.messages.removed'));
          fetchCustomers();
        } catch (err) {
          toast.error((err as ApiError).response?.data?.message || t('common.error'));
        }
      }
    });
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
      // Fetch all customers (no limit) for export
      const response = await api.get('/customers', {
        params: {
          limit: 1000, // Large enough limit to get all
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
        name: 'Full Name',
        phone: 'Phone',
        email: 'Email',
        tier: 'Tier level',
        points: 'Loyalty Points',
        totalSpent: `Total Spent (${currencySymbol})`,
        visits: 'Total Visits'
      });
      toast.success('Export complete', { id: 'export' });
    } catch {
      toast.error('Failed to export customers', { id: 'export' });
    }
  };


  const formatCurrency = (value: number) => {
    return formatAmount(value);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <span className="px-2.5 sm:px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
              {t('customers.badge')}
            </span>
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
              </div>
              <span className="text-xs font-bold text-paymint-green tracking-widest">Live</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('customers.title')}</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">{t('customers.subtitle')}</p>
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
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20 touch-target"
          >
            <Plus size={18} />
            <span className="hidden xs:inline">{t('customers.addCustomer')}</span>
          </button>
        </div>
      </div>

      {/* Stats Overview - horizontal scroll on mobile */}
      <div className="flex overflow-x-auto scrollbar-none gap-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible pb-2 sm:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative p-4 sm:p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-lg transition-all min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-paymint-green/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center">
              <User size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 tracking-widest">{t('customers.stats.total')}</p>
              <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">{(Array.isArray(customers) ? customers : []).length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative p-4 sm:p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-lg transition-all min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Award size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 tracking-widest">{t('customers.stats.points')}</p>
              <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                {(Array.isArray(customers) ? customers : []).reduce((acc, curr) => acc + (curr.points || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group relative p-4 sm:p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-lg transition-all min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <ShoppingBag size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 tracking-widest">{t('customers.stats.spent')}</p>
              <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                {formatCurrency((Array.isArray(customers) ? customers : []).reduce((acc, curr) => acc + (Number(curr.totalSpent) || 0), 0))}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-3 sm:p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder={t('customers.searchPlaceholder')}
            className="w-full"
          />
        </div>
      </div>


      {/* Main List */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm min-h-[250px] lg:min-h-[350px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 sm:p-32">
            <div className="w-12 h-12 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-xs font-black tracking-widest text-gray-400">{t('customers.messages.loading')}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 sm:p-32 text-center bg-gray-50/30 dark:bg-black/10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 border border-gray-200 dark:border-white/5 shadow-sm">
              <User size={32} className="sm:w-10 sm:h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('customers.messages.noCustomers')}</h3>
            <p className="text-sm font-bold text-gray-500 max-w-xs mx-auto">{t('customers.messages.noCustomersDesc')}</p>
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
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.totalVisits} {t('customers.details.visits')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-paymint-green">{customer.points}</p>
                      <p className="text-xs text-gray-400">{t('rewards.points')}</p>
                    </div>
                  </div>

                  {/* Card Details */}
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
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setSelectedCustomer(member); setPointsAmount(0); setShowPointsModal(true); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-paymint-green/10 text-paymint-green text-xs font-bold touch-target"
                    >
                      <Award size={14} />
                      {t('customers.details.points')}
                    </button>
                    <button
                      onClick={() => openEditModal(member)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 text-xs font-bold touch-target"
                    >
                      <Edit2 size={14} />
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(member)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-500/20 text-paymint-red hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-xs font-bold touch-target"
                    >
                      <Trash2 size={14} />
                      {t('common.delete')}
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
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('customers.form.name')}</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('customers.details.points')}</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('staff.table.contact')}</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('customers.details.spent')}</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-gray-400 tracking-widest">{t('owner.locations.actions')}</th>
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
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform duration-300">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{customer.name}</p>
                            <p className="text-xs font-black text-gray-400 tracking-widest">{customer.totalVisits} {t('customers.details.visits')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-black text-paymint-green">{customer.points}</p>
                          <p className="text-xs font-black text-gray-400 tracking-widest">{t('rewards.points')}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
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
                      <td className="px-6 py-4">
                        <p className="font-black text-gray-900 dark:text-white text-sm">{formatCurrency(customer.totalSpent)}</p>
                        <p className="text-xs text-paymint-green font-black tracking-widest">{t('common.active')}</p>
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button
                            onClick={() => { setSelectedCustomer(customer); setPointsAmount(0); setShowPointsModal(true); }}
                            aria-label="Adjust loyalty points"
                            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-paymint-green hover:border-paymint-green/30 transition-all"
                            title="Adjust Points"
                          >
                            <Award size={18} />
                          </button>
                          <button
                            onClick={() => openEditModal(customer)}
                            aria-label="Edit customer"
                            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <div className="relative" data-action-menu>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === customer.id ? null : customer.id);
                              }}
                              aria-label="More actions"
                              aria-expanded={activeMenu === customer.id}
                              className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border transition-all ${activeMenu === customer.id ? 'bg-paymint-green text-black border-paymint-green' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                            >
                              <MoreVertical size={18} />
                            </button>

                            {activeMenu === customer.id && (
                              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 z-50 overflow-hidden">
                                <button
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setShowDetailModal(true);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                                >
                                  <Eye size={14} className="text-paymint-green" />
                                  View Profile
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteCustomer(customer);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-paymint-red hover:bg-paymint-red/10 transition-colors text-left border-t border-gray-100 dark:border-white/5"
                                >
                                  <Trash2 size={14} />
                                  Delete Customer
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />

      {/* Customer Form Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white dark:bg-[#1E293B] rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingCustomer ? 'Edit Customer' : 'New Customer'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  aria-label="Close modal"
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit(handleSaveCustomer)} className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] px-1 flex items-center">
                    Name <span className="text-paymint-red mx-1">*</span>
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-paymint-green transition-colors" />
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="e.g. Alexander Hamilton"
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/20 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                    />
                  </div>
                  {errors.name && <p className="text-paymint-red text-xs px-1 font-black tracking-widest mt-1.5">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-xs font-black text-gray-400 tracking-[0.2em] px-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="+000 000 000"
                      className={`w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.phone ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                    />
                    {errors.phone && <p className="text-paymint-red text-xs px-1 font-black tracking-widest mt-1.5">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-black text-gray-400 tracking-[0.2em] px-1">Email</label>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="client@example.com"
                      className={`w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.email ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                    />
                    {errors.email && <p className="text-paymint-red text-xs px-1 font-black tracking-widest mt-1.5">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] px-1">Address</label>
                  <input
                    type="text"
                    {...register('address')}
                    placeholder="Enter address..."
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black tracking-[0.2em] text-xs rounded-2xl hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5 active:scale-95 shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 tracking-[0.2em] text-xs shadow-lg shadow-paymint-green/20"
                  >
                    {editingCustomer ? 'Update Customer' : 'Save Customer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Points Adjustment Modal */}
      <AnimatePresence>
        {showPointsModal && selectedCustomer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowPointsModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-sm overflow-hidden relative shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowPointsModal(false);
                  setPointsError(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8 text-center border-b border-gray-100 dark:border-white/5">
                <div className="w-20 h-20 bg-paymint-green/10 text-paymint-green rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Award size={40} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adjust Loyalty</h2>
                <p className="text-gray-500 font-bold mt-1 text-xs tracking-widest">Partner: {selectedCustomer.name}</p>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                  {['add', 'deduct'].map((action) => (
                    <button
                      key={action}
                      onClick={() => {
                        setPointsAction(action as 'add' | 'deduct');
                        setPointsError(null);
                      }}
                      className={`flex-1 py-3 rounded-xl text-xs font-black tracking-[0.2em] transition-all ${pointsAction === action
                        ? (action === 'deduct' ? 'bg-paymint-red text-white shadow-lg shadow-paymint-red/20' : 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg')
                        : 'text-gray-400'
                        }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
                <div>
                  <input
                    type="number"
                    value={pointsAmount === 0 ? '' : pointsAmount}
                    onChange={(e) => {
                      setPointsAmount(Math.max(0, parseInt(e.target.value) || 0));
                      setPointsError(null);
                    }}
                    className={`w-full bg-transparent text-center text-6xl font-black focus:outline-none ${pointsAction === 'deduct' ? 'text-paymint-red placeholder:text-paymint-red/20' : 'text-paymint-green placeholder:text-paymint-green/20'}`}
                    placeholder="0"
                  />
                  <div className="min-h-[48px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {pointsError ? (
                        <motion.p
                          key="error"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="w-full text-center text-xs font-black text-paymint-red tracking-widest bg-paymint-red/10 py-2 px-3 rounded-lg border border-paymint-red/20"
                        >
                          {pointsError}
                        </motion.p>
                      ) : (
                        <motion.p
                          key="label"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center text-xs font-black text-gray-400 tracking-widest"
                        >
                          Points Allocation
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <button onClick={handlePointsUpdate} disabled={isSubmitting || pointsAmount <= 0} className={`w-full py-4 font-black rounded-2xl hover:scale-[1.02] tracking-widest text-xs transition-all shadow-lg ${pointsAction === 'deduct' ? 'bg-paymint-red text-white shadow-paymint-red/20' : 'bg-paymint-green text-black shadow-paymint-green/20'}`}>
                  Confirm Adjustment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Detail View */}
      <AnimatePresence>
        {showDetailModal && selectedCustomer && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="bg-white dark:bg-[#1E293B] rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-10 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-transparent">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-paymint-green/10 text-paymint-green flex items-center justify-center text-3xl font-black">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</h2>
                      <div className="mt-2 flex items-center gap-2 text-paymint-green">
                        <Award size={14} className="animate-pulse" />
                        <p className="text-lg font-black tracking-tight">{selectedCustomer.points} Points</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="p-3 bg-white dark:bg-white/5 rounded-2xl text-gray-400 hover:text-black dark:hover:text-white transition-colors shadow-sm">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'Total Spent', value: formatCurrency(selectedCustomer.totalSpent), icon: ShoppingBag },
                    { label: 'Visits', value: `${selectedCustomer.totalVisits} Orders`, icon: Calendar },
                    { label: 'Points', value: `${selectedCustomer.points} Pts`, icon: Award },
                  ].map((stat, i) => (
                    <div key={i} className="p-5 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                      <p className="text-xs font-black text-gray-400 tracking-widest mb-3">{stat.label}</p>
                      <p className="text-lg font-black text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 space-y-10">
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-gray-400 tracking-[0.2em] flex items-center gap-2">
                      <Mail size={12} className="text-paymint-green" /> Contact Info
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                        <Phone size={14} className="opacity-30" /> {selectedCustomer.phone}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                        <Mail size={14} className="opacity-30" /> {selectedCustomer.email || 'No email'}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                        <MapPin size={14} className="opacity-30" /> {selectedCustomer.address || 'No address'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-gray-400 tracking-[0.2em] flex items-center gap-2">
                      <History size={12} className="text-paymint-green" /> Insights
                    </h3>
                    <div className="p-6 bg-paymint-green/5 border border-paymint-green/10 rounded-2xl">
                      <p className="text-xs font-black text-paymint-green tracking-widest mb-2">Notes</p>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                        {selectedCustomer.notes || "No notes."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <button onClick={() => { setShowDetailModal(false); handleDeleteCustomer(selectedCustomer); }} className="px-6 py-4 bg-paymint-red/10 text-paymint-red font-black rounded-2xl text-xs tracking-widest transition-all hover:bg-paymint-red hover:text-white active:scale-95 shadow-sm">
                    <Trash2 size={18} />
                  </button>
                  <button onClick={() => { setShowDetailModal(false); openEditModal(selectedCustomer); }} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl text-xs tracking-[0.2em] transition-all hover:scale-[1.02] shadow-lg active:scale-95">
                    Edit
                  </button>
                  <button onClick={() => { setShowDetailModal(false); setShowPointsModal(true); setPointsAmount(0); }} className="flex-1 py-4 bg-paymint-green text-black font-black rounded-2xl text-xs tracking-[0.2em] transition-all hover:scale-[1.02] shadow-lg shadow-paymint-green/20 active:scale-95">
                    Points
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
}

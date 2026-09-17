import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  User,
  Trash2,
  Edit2,
  Award,
  MoreVertical,
  Eye
} from 'lucide-react';
import { biIcon } from '../../components/ui/BiIcon';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { BusyOverlay } from '../../components/BusyOverlay';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { PortalDropdown } from '../../components/PortalDropdown';
import { exportTable } from '../../utils/export';
import type { ExportFormat } from '../../utils/export';
import { ExportMenu } from '../../components/ExportMenu';
import { SearchInput, Pagination, PageHeader, Badge } from '../../components/ui';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { useCurrency } from '../../context/CurrencyContext';
import { formatInputPlaceholder } from '../../utils/textCase';
import { StatValue } from '../../components/ui/StatValue';
import { useRealtime } from '../../hooks/useRealtime';
import { DataChangeEventTypes } from '../../services/realtimeService';
import { CustomerModal } from '../../components/forms/CustomerModal';
import type { Customer, CustomerFormData } from '../../components/forms/CustomerModal';

interface ApiError {
  response?: {
    data?: {
      message?: string;
      code?: string;
      allowedAction?: string;
    };
  };
}

interface CustomerStats {
  totalCustomers: number;
  totalPoints: number;
  totalSpent: number;
}

interface TableActionMenuProps {
  customer: Customer;
  onOpenCustomer: (customer: Customer, tab?: 'profile' | 'loyalty') => void;
  onDelete: (customer: Customer) => void;
}

function TableActionMenu({ customer, onOpenCustomer, onDelete }: TableActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.moreActions')}
        className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
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
              onOpenCustomer(customer, 'profile');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
          >
            <Eye size={14} className="text-mintcom-green" />
            {t('customers.messages.viewProfile')}
          </button>
          <button
            onClick={() => {
              onOpenCustomer(customer, 'loyalty');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
          >
            <Award size={14} className="text-amber-500" />
            {t('customers.details.managePoints', { defaultValue: 'Manage Loyalty Points' })}
          </button>
          <button
            onClick={() => {
              onDelete(customer);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-mintcom-red hover:bg-mintcom-red/10 transition-colors text-left border-t border-gray-100 dark:border-white/5 cursor-pointer"
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
  const { onRefresh } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
  });

  const { formatAmount, currencySymbol } = useCurrency();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Unified modal state
  const [customerModalConfig, setCustomerModalConfig] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    initialTab: 'profile' | 'loyalty';
  }>({
    isOpen: false,
    customer: null,
    initialTab: 'profile',
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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

  // `silent` skips the blocking loading state — used for realtime background
  // refreshes so the busy overlay doesn't flash on every incoming event.
  const fetchCustomers = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
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
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    const customerEvents = new Set<string>([
      DataChangeEventTypes.CUSTOMER_CREATED,
      DataChangeEventTypes.CUSTOMER_UPDATED,
      DataChangeEventTypes.CUSTOMER_DELETED,
      DataChangeEventTypes.ORDER_CREATED,
      DataChangeEventTypes.ORDER_REFUNDED,
    ]);

    const unsubscribe = onRefresh((eventType) => {
      if (customerEvents.has(eventType)) {
        // Background refresh: don't block the UI for realtime events.
        fetchCustomers(true);
      }
    });

    return unsubscribe;
  }, [onRefresh, currentEstablishment?.id, page, searchQuery]);

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

  const handleSaveCustomer = async (data: CustomerFormData, customerId?: string) => {
    try {
      const phone = data.phone?.trim() || '';
      const payload = {
        name: data.name?.trim() || undefined,
        phone,
        email: data.email?.trim() || undefined,
      };

      if (customerId) {
        await api.patch(`/customers/${customerId}`, payload);
        toast.success(t('customers.messages.updated'));
      } else {
        await api.post('/customers', payload);
        toast.success(t('customers.messages.created'));
      }
      setCustomerModalConfig({ isOpen: false, customer: null, initialTab: 'profile' });
      fetchCustomers();
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || t('customers.messages.errorSaving'));
      throw err;
    }
  };

  const handleAdjustPoints = async (customerId: string, amount: number, action: 'add' | 'deduct') => {
    try {
      const pointsDiff = action === 'add' ? amount : -amount;
      const res = await api.post(`/customers/${customerId}/points`, {
        points: pointsDiff,
      });
      toast.success(t('customers.messages.pointsAdjusted'));
      fetchCustomers(true);

      const newPoints =
        res.data?.points ??
        (customerModalConfig.customer ? customerModalConfig.customer.points + pointsDiff : undefined);

      if (typeof newPoints === 'number') {
        setCustomerModalConfig((prev) =>
          prev.customer ? { ...prev, customer: { ...prev.customer, points: newPoints } } : prev
        );
      }
      return newPoints;
    } catch (err) {
      const msg = (err as ApiError).response?.data?.message || t('common.error');
      toast.error(msg);
      throw new Error(msg);
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
        setCustomerModalConfig({ isOpen: false, customer: null, initialTab: 'profile' });
        setShowSecurityModal(true);
      }
    });
  };

  const onSecurityVerify = async () => {
    setShowSecurityModal(false);
    fetchCustomers();
  };

  const handleAnonymizeCustomer = async () => {
    const target = selectedCustomer || customerModalConfig.customer;
    if (!target) return;

    try {
      await api.post(`/customers/${target.id}/anonymize`, {
        reason: 'Customer removed from management UI',
      });
      toast.success(t('customers.messages.anonymized'));
      setCustomerModalConfig({ isOpen: false, customer: null, initialTab: 'profile' });
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

    const target = selectedCustomer || customerModalConfig.customer;
    setShowSecurityModal(false);
    setConfirmConfig({
      isOpen: true,
      title: t('customers.messages.anonymizeCustomer'),
      message: t('customers.messages.anonymizeConfirm', {
        name: target?.name || target?.phone || '',
      }),
      type: 'warning',
      confirmText: t('common.anonymize'),
      onConfirm: handleAnonymizeCustomer,
    });
    return true;
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      toast.loading(`${t('common.export')}...`, { id: 'export' });
      const PAGE_SIZE = 100;
      const allCustomers: Customer[] = [];
      for (let p = 1; p < 1000; p++) {
        const response = await api.get('/customers', {
          params: { page: p, limit: PAGE_SIZE, search: searchQuery },
        });
        const batch: Customer[] = response.data.customers || [];
        allCustomers.push(...batch);
        if (batch.length === 0) break;
        if (typeof response.data.total === 'number' && allCustomers.length >= response.data.total) break;
      }

      const exportData = allCustomers.map((c: Customer) => ({
        name: c.name || '',
        phone: c.phone,
        email: c.email || 'N/a',
        points: c.points,
        totalSpent: c.totalSpent,
        visits: c.totalVisits
      }));

      if (exportData.length === 0) {
        toast.error(t('dashboard.messages.noData', { defaultValue: 'No data to export' }), { id: 'export' });
        return;
      }

      await exportTable(format, {
        filename: 'customers_registry',
        title: t('customers.title', { defaultValue: 'Customers' }),
        meta: currentEstablishment?.name ? [{ label: t('common.location'), value: currentEstablishment.name }] : undefined,
        columns: [
          { key: 'name', label: t('common.name', { defaultValue: 'Name' }) },
          { key: 'phone', label: t('customers.form.phone') },
          { key: 'email', label: t('customers.form.email') },
          { key: 'points', label: t('customers.details.points') },
          { key: 'totalSpent', label: `${t('customers.details.spent')} (${currencySymbol})` },
          { key: 'visits', label: t('customers.details.visits') },
        ],
        rows: exportData,
      });
      toast.success(t('customers.messages.exportComplete'), { id: 'export' });
    } catch {
      toast.error(t('customers.messages.exportFailed'), { id: 'export' });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-10" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Full-screen blocker while a user-triggered load (search, pagination)
          is in flight — realtime refreshes stay silent. */}
      <BusyOverlay visible={isLoading} />
      {/* Header */}
      <PageHeader
          title={t('customers.title')}
          subtitle={
              <>
                  <span>{t('customers.subtitle')}</span>
                  {currentEstablishment?.name && (
                      <Badge>{currentEstablishment.name}</Badge>
                  )}
              </>
          }
          actions={
              <>
                  <ExportMenu onExport={handleExport} className="hidden sm:flex" />
                  <button
                      onClick={() => setCustomerModalConfig({ isOpen: true, customer: null, initialTab: 'profile' })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-mintcom-green text-black font-semibold text-sm hover:bg-mintcom-green/90 active:bg-mintcom-green/80 transition-colors cursor-pointer"
                  >
                      <Plus size={18} strokeWidth={2.5} />
                      <span className="hidden xs:inline">{t('customers.addCustomer')}</span>
                  </button>
              </>
          }
      />

      <div className="flex overflow-x-auto scrollbar-none gap-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible pb-2 sm:pb-0">
        {[
          { label: t('customers.stats.total'), value: stats.totalCustomers, icon: biIcon('bi-people'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10', isCurrency: false },
          { label: t('customers.stats.points'), value: stats.totalPoints, icon: biIcon('bi-award'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10', isCurrency: false },
          { label: t('customers.stats.spent'), value: stats.totalSpent, icon: biIcon('bi-bag-check'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10', isCurrency: true },
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
            <p className="label-strong font-sans">{t('customers.messages.loading')}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 sm:p-32 text-center bg-gray-50/30 dark:bg-black/10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center mb-4 sm:mb-6 border border-gray-200 dark:border-white/5 shadow-sm">
              <User size={32} className="sm:w-10 sm:h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('customers.messages.noCustomers')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              {searchQuery.trim()
                ? t('customers.messages.noResults', { defaultValue: 'No customers found matching your search' })
                : t('customers.messages.noCustomersDesc', { defaultValue: 'Create your customers to see them here' })}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <th className="px-6 py-4 text-start text-[11px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap">{t('common.name', { defaultValue: 'Name' })}</th>
                    <th className="px-6 py-4 text-start text-[11px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap">{t('customers.form.phone')}</th>
                    <th className="px-6 py-4 text-end text-[11px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap">{t('customers.details.points')}</th>
                    <th className="px-6 py-4 text-end text-[11px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap">{t('customers.details.spent')}</th>
                    <th className="px-6 py-4 text-end text-[11px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap">{t('common.actions')}</th>
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
                      <td className="px-6 py-4 text-start">
                        <button
                          type="button"
                          onClick={() => setCustomerModalConfig({ isOpen: true, customer, initialTab: 'profile' })}
                          className="flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-mintcom-green/40 cursor-pointer"
                          aria-label={t('customers.messages.viewProfile')}
                        >
                          <div className="w-10 h-10 rounded-full bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-bold text-sm shrink-0">
                            {(customer.name || customer.phone || '#').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-mintcom-green transition-colors underline-offset-2 group-hover:underline decoration-mintcom-green/40">
                            {customer.name || customer.phone}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-start text-sm text-gray-500 dark:text-gray-400 font-medium">{customer.phone || '—'}</td>
                      <td className="px-6 py-4 text-end">
                        <button
                          type="button"
                          onClick={() => setCustomerModalConfig({ isOpen: true, customer, initialTab: 'loyalty' })}
                          className="inline-flex items-center gap-1 justify-end group/points hover:opacity-80 transition-opacity cursor-pointer"
                          title={t('customers.details.managePoints', { defaultValue: 'Manage Loyalty Points' })}
                        >
                          <span className="text-sm font-bold text-gray-900 dark:text-white group-hover/points:text-mintcom-green transition-colors">{customer.points.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-gray-400">{t('customers.details.points')}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatAmount(customer.totalSpent)}</p>
                        <p className="text-[10px] font-bold text-gray-400">{customer.totalVisits} {t('customers.details.visits')}</p>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setCustomerModalConfig({ isOpen: true, customer, initialTab: 'profile' })}
                            className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-mintcom-green hover:text-black hover:border-mintcom-green transition-all cursor-pointer"
                            aria-label="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <TableActionMenu
                            customer={customer}
                            onOpenCustomer={(c, tab) => setCustomerModalConfig({ isOpen: true, customer: c, initialTab: tab || 'profile' })}
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

      {/* Unified Creative All-in-One Customer Modal */}
      <CustomerModal
        isOpen={customerModalConfig.isOpen}
        onClose={() => setCustomerModalConfig({ isOpen: false, customer: null, initialTab: 'profile' })}
        customer={customerModalConfig.customer}
        initialTab={customerModalConfig.initialTab}
        onSaveCustomer={handleSaveCustomer}
        onAdjustPoints={handleAdjustPoints}
        onDeleteCustomer={handleDeleteCustomer}
        currencySymbol={currencySymbol}
        formatAmount={formatAmount}
      />

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
        targetName={selectedCustomer?.name || selectedCustomer?.phone || ''}
      />
    </div>
  );
}

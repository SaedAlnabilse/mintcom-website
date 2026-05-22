import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import {
  Search,
  History,
  X,
  Shield,
  FileText,
  Download
} from 'lucide-react';

import api from '../../config/api';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/export';
import { SingleSelect } from '../../components/SingleSelect';
import { DateRangePicker } from '../../components/DateRangePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import { Pagination } from '../../components/ui';
import { usePermissionGuard, checkPermission } from '../../hooks/usePermissionGuard';
import { useAuth } from '../../context/AuthContext';
import { formatInputPlaceholder } from '../../utils/textCase';

interface ActivityLog {
  id: string;
  userId: string;
  performedBy?: {
    username?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  action: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

const actionColors: Record<string, string> = {
  // Inventory
  'Added product': 'bg-mintcom-green/ text-mintcom-green border-mintcom-green/',
  'Updated product': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Deleted product': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
  'Archived product': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
  'Removed product image': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Deleted all products': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
  'Archived all products': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
  'Added category': 'bg-mintcom-green/ text-mintcom-green border-mintcom-green/',
  'Updated category': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Deleted category': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
  'Archived category': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
  'Archived attribute group': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
  'Archived sub-attribute': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',

  // Staff
  'Added employee': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Updated employee': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Deleted employee': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  'Deactivated employee': 'bg-gray-500/10 text-gray-500 border-gray-500/20',

  // Settings
  'Updated restaurant name': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Updated working hours': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Updated farewell message': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Updated restaurant logo': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Updated tax rate': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Updated loyalty program': 'bg-pink-500/10 text-pink-500 border-pink-500/20',

  // Payments & Discounts
  'Added discount': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  'Updated discount': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Deleted discount': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
  'Deactivated discount': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
  'Added payment method': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  'Updated payment method': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Deleted payment method': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
  'Deactivated payment method': 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
};

export function ActivityLogsPage() {
  const { t } = useTranslation();
  const { account , currentEstablishment } = useAuth();
  usePermissionGuard([
    'view_activity_logs',
    'manage_settings',
    'manage_establishment_profile',
    'manage_tax_currency',
    'manage_receipt_settings',
  ]);

  const canExport = useMemo(() => checkPermission(account, ['export_data']), [account]);

  const localizedDateOptions = useMemo(() =>
    DATE_PERIOD_OPTIONS.map(opt => ({
      ...opt,
      label: t(`common.datePeriods.${opt.value}`)
    })), [t]);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Date Filters State
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const { start, end } = calculateDateRange('last_30_days');
    return {
      start: formatDateForInput(start),
      end: formatDateForInput(end)
    };
  });
  const [activePreset, setActivePreset] = useState('last_30_days');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, actionFilter, dateRange, searchQuery]);

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);

    if (preset === 'custom') {
      return; // Don't change dates on click if custom
    }

    const { start, end } = calculateDateRange(preset as DatePeriod);
    setDateRange({
      start: formatDateForInput(start),
      end: formatDateForInput(end)
    });
    setPage(1);
  };

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {
        page,
        limit: 10,
        search: searchQuery,
      };

      if (actionFilter !== 'all') params.action = actionFilter;

      if (dateRange.start) {
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        params.startDate = start.toISOString();
      }

      if (dateRange.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        params.endDate = end.toISOString();
      }

      const response = await api.get('/activity-log', { params });

      const logsData = response.data.logs || response.data;
      const validLogs = Array.isArray(logsData) ? logsData : [];

      setLogs(validLogs);
      setTotalPages(response.data.totalPages || 1);
      setTotalLogs(response.data.total || validLogs.length);
    } catch {
      toast.error(t('activity.syncError'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const locale = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(dateString).toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionKey = (action: string) => {
    // Maps "Added product" -> "addProduct", "Updated restaurant name" -> "updateName"
    const map: Record<string, string> = {
      'Added product': 'addProduct',
      'Updated product': 'updateProduct',
      'Deleted product': 'deleteProduct',
      'Archived product': 'archiveProduct',
      'Removed product image': 'removeProductImage',
      'Deleted all products': 'deleteProduct', // fallback
      'Archived all products': 'archiveAllProducts',
      'Added category': 'addCategory',
      'Updated category': 'updateCategory',
      'Deleted category': 'deleteCategory',
      'Archived category': 'archiveCategory',
      'Archived attribute group': 'archiveAttributeGroup',
      'Archived sub-attribute': 'archiveSubAttribute',
      'Added employee': 'addEmployee',
      'Updated employee': 'updateEmployee',
      'Deleted employee': 'deleteEmployee',
      'Deactivated employee': 'deactivateEmployee',
      'Updated restaurant name': 'updateName',
      'Updated working hours': 'updateHours',
      'Updated farewell message': 'updateMessage',
      'Updated restaurant logo': 'updateLogo',
      'Updated tax rate': 'updateTax',
      'Updated loyalty program': 'updateLoyalty',
      'Added discount': 'addDiscount',
      'Updated discount': 'updateDiscount',
      'Deleted discount': 'deleteDiscount',
      'Deactivated discount': 'deactivateDiscount',
      'Added payment method': 'addPayment',
      'Updated payment method': 'updatePayment',
      'Deleted payment method': 'deletePayment',
      'Deactivated payment method': 'deactivatePayment',
    };
    return map[action] || action.toLowerCase().replace(/ /g, '_');
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const getActionLabel = (action: string) => {
    const translation = t(`activity.actions.${getActionKey(action)}`);
    return translation.includes('activity.actions.') ? action : translation;
  };

  const getActorName = (log: ActivityLog) => {
    const fullName =
      `${log.performedBy?.firstName || ''} ${log.performedBy?.lastName || ''}`.trim();
    return (
      log.performedBy?.name?.trim() ||
      fullName ||
      log.performedBy?.username?.trim() ||
      t('activity.owner')
    );
  };

  const getActorInitial = (log: ActivityLog) => {
    const actorName = getActorName(log);
    return actorName?.charAt(0)?.toUpperCase() || 'A';
  };

  const handleExport = () => {
    const logsToExport = Array.isArray(logs) ? logs : [];
    const exportData = logsToExport.map(l => ({
      time: formatDate(l.timestamp),
      user: getActorName(l),
      action: l.action,
      desc: l.description,
      ip: l.ipAddress
    }));

    exportToCSV(exportData, 'activity_log', {
      time: t('activity.time'),
      user: t('activity.user'),
      action: t('activity.action'),
      desc: t('activity.details'),
      ip: t('activity.ip')
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('activity.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('activity.subtitle')}</span>
                        {currentEstablishment?.name && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 text-mintcom-green label-strong font-outfit border border-mintcom-green/20">
                                {currentEstablishment.name}
                            </span>
                        )}
                    </p>
        </div>

        <div className="flex items-center gap-3">
          {canExport && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
            >
              <Download size={18} />
              <span>{t('activity.export')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full">
          <div className="flex-1 w-full xl:w-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input maxLength={255}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder={formatInputPlaceholder(t('activity.searchPlaceholder'), t('common.locale'))}
              className="w-full pl-11 pr-11 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setPage(1); }}
                aria-label={t('common.clearSearch', 'Clear search')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X size={12} strokeWidth={2.75} />
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            {/* Action Filter */}
            <div className="w-full md:w-64">
              <SingleSelect
                value={actionFilter === 'all' ? null : actionFilter}
                onChange={(val) => { setActionFilter(val || 'all'); setPage(1); }}
                options={[
                  { label: getActionLabel('Added product'), value: 'Added product' },
                  { label: getActionLabel('Updated product'), value: 'Updated product' },
                  { label: getActionLabel('Deleted product'), value: 'Deleted product' },
                  { label: getActionLabel('Archived product'), value: 'Archived product' },
                  { label: getActionLabel('Removed product image'), value: 'Removed product image' },
                  { label: getActionLabel('Deleted all products'), value: 'Deleted all products' },
                  { label: getActionLabel('Archived all products'), value: 'Archived all products' },
                  { label: getActionLabel('Added category'), value: 'Added category' },
                  { label: getActionLabel('Updated category'), value: 'Updated category' },
                  { label: getActionLabel('Deleted category'), value: 'Deleted category' },
                  { label: getActionLabel('Archived category'), value: 'Archived category' },
                  { label: getActionLabel('Archived attribute group'), value: 'Archived attribute group' },
                  { label: getActionLabel('Archived sub-attribute'), value: 'Archived sub-attribute' },
                  { label: getActionLabel('Added employee'), value: 'Added employee' },
                  { label: getActionLabel('Updated employee'), value: 'Updated employee' },
                  { label: getActionLabel('Deleted employee'), value: 'Deleted employee' },
                  { label: getActionLabel('Deactivated employee'), value: 'Deactivated employee' },
                  { label: getActionLabel('Updated restaurant name'), value: 'Updated restaurant name' },
                  { label: getActionLabel('Updated working hours'), value: 'Updated working hours' },
                  { label: getActionLabel('Updated farewell message'), value: 'Updated farewell message' },
                  { label: getActionLabel('Updated restaurant logo'), value: 'Updated restaurant logo' },
                  { label: getActionLabel('Updated tax rate'), value: 'Updated tax rate' },
                  { label: getActionLabel('Updated loyalty program'), value: 'Updated loyalty program' },
                  { label: getActionLabel('Added discount'), value: 'Added discount' },
                  { label: getActionLabel('Updated discount'), value: 'Updated discount' },
                  { label: getActionLabel('Deleted discount'), value: 'Deleted discount' },
                  { label: getActionLabel('Deactivated discount'), value: 'Deactivated discount' },
                  { label: getActionLabel('Added payment method'), value: 'Added payment method' },
                  { label: getActionLabel('Updated payment method'), value: 'Updated payment method' },
                  { label: getActionLabel('Deleted payment method'), value: 'Deleted payment method' },
                  { label: getActionLabel('Deactivated payment method'), value: 'Deactivated payment method' },
                ]}
                allOptionLabel={t('activity.allActions')}
                placeholder={formatInputPlaceholder(t('activity.allActions'), t('common.locale'))}
              />
            </div>

            {/* Date Filters Container - Split for visual feedback */}
            <div className="flex items-center gap-3">
              {/* Presets Dropdown */}
              <div className="w-40 rounded-2xl transition-all">
                <SingleSelect
                  value={activePreset === 'custom' ? null : activePreset}
                  onChange={(val) => {
                    if (val) handlePresetChange(val);
                  }}
                  options={localizedDateOptions}
                  placeholder={formatInputPlaceholder(t('activity.customRange'), t('common.locale'))}
                  showAllOption={false}
                  allowClear={false}
                />
              </div>

              {/* Custom Date Inputs Group */}
              <div className="flex-none min-w-[200px] sm:min-w-[240px] relative z-[60]">
                <DateRangePicker
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onRangeChange={(start, end) => {
                    setDateRange({ start, end });
                    setActivePreset('custom');
                    setPage(1);
                  }}
                  onClear={() => handlePresetChange('today')}
                  isActive={activePreset === 'custom'}
                  align="left"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Logs Area */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col min-h-[300px] lg:min-h-[250px] lg:min-h-[350px]">
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
            {isLoading ? (
              <div className="py-32 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-mintcom-green/10 border-t-mintcom-green rounded-full animate-spin" />
                  <p className="label-strong font-outfit">{t('activity.loading')}</p>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-32 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                    <History size={24} className="text-gray-300" />
                  </div>
                  {searchQuery.trim() ? (
                    <>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('common.noResults')}</h3>
                      <p className="text-sm font-bold text-gray-500">
                        {t('common.noMatchingResults', {
                          entity: 'logs',
                          query: searchQuery.trim(),
                          defaultValue: 'No {{entity}} matching "{{query}}"',
                        })}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 font-bold text-xs tracking-widest">{t('activity.noLogs')}</p>
                  )}
                </div>
              </div>
            ) : (
              Array.isArray(logs) && logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-black">
                        {getActorInitial(log)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight truncate max-w-[150px]">{getActorName(log)}</p>
                        <p className="text-xs text-gray-400 font-black">{log.ipAddress || t('activity.internal')}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest border ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                    {log.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {new Date(log.timestamp).toLocaleTimeString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {new Date(log.timestamp).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {log.metadata && (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-mintcom-green transition-all"
                      >
                        <FileText size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th className="px-8 py-4 text-left label-strong font-outfit">{t('activity.time')}</th>
                <th className="px-8 py-4 text-center label-strong font-outfit">{t('activity.user')}</th>
                <th className="px-8 py-4 text-center label-strong font-outfit">{t('activity.action')}</th>
                <th className="px-8 py-4 text-center label-strong font-outfit">{t('activity.details')}</th>
                <th className="px-8 py-4 text-center label-strong font-outfit">{t('activity.data')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-mintcom-green/10 border-t-mintcom-green rounded-full animate-spin" />
                        <p className="label-strong font-outfit">{t('activity.loading')}</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                          <History size={24} className="text-gray-300" />
                        </div>
                        {searchQuery.trim() ? (
                    <>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('common.noResults')}</h3>
                      <p className="text-sm font-bold text-gray-500">
                        {t('common.noMatchingResults', {
                          entity: 'logs',
                          query: searchQuery.trim(),
                          defaultValue: 'No {{entity}} matching "{{query}}"',
                        })}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 font-bold text-xs tracking-widest">{t('activity.noLogs')}</p>
                  )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  Array.isArray(logs) && logs.map((log) => (
                    <tr
                      key={log.id}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="text-xs font-bold text-gray-400">
                            {new Date(log.timestamp).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                            {getActorInitial(log)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight truncate max-w-[100px]">{getActorName(log)}</p>
                            <p className="text-xs text-gray-400 font-black">{log.ipAddress || t('activity.internal')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg label-strong font-outfit border ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 max-w-sm line-clamp-1 group-hover:line-clamp-none transition-all text-center">
                          {log.description}
                        </p>
                      </td>
                      <td className="px-8 py-4 text-center">
                        {log.metadata ? (
                          <div className="flex justify-center">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-mintcom-green transition-all"
                            >
                              <FileText size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-black text-gray-200 dark:text-white/5 tracking-widest">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalLogs}
            itemsPerPage={10}
            variant="footer"
          />
        </div>

            {/* Detail Modal */}
        {selectedLog && createPortal(
          <div className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans">
            <div
              className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden h-[92vh] sm:h-auto sm:max-h-[85vh] flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/5 relative z-10"
            >
                {/* Mobile Drag Handle */}
                <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
                  <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                </div>
              <div className="p-8 border-b border-gray-200 dark:border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('activity.logDetails')}</h2>
                    <p className="label-strong font-outfit text-mintcom-green">{selectedLog.action ? getActionLabel(selectedLog.action) : ''}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="label-strong font-outfit mb-2">{t('activity.time')}</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatDate(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <p className="label-strong font-outfit mb-2">{t('activity.user')}</p>
                    <p className="font-bold text-gray-900 dark:text-white">{getActorName(selectedLog)}</p>
                  </div>
                </div>

                <div>
                  <p className="label-strong font-outfit mb-3">{t('activity.data')}</p>
                  <pre className="bg-gray-50 dark:bg-black/40 p-6 rounded-[1.5rem] overflow-x-auto text-xs text-gray-700 dark:text-mintcom-green font-mono leading-relaxed border border-gray-200 dark:border-white/5">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-8 border-t border-gray-200 dark:border-white/5">
                <button onClick={() => setSelectedLog(null)} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl tracking-widest text-xs hover:scale-[1.02] transition-transform">
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}




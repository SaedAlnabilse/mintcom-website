import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import {
  Search,
  X,
  Shield,
  UserRound,
  Layers,
} from 'lucide-react';

import api from '../../config/api';
import toast from 'react-hot-toast';
import { exportTable } from '../../utils/export';
import type { ExportFormat } from '../../utils/export';
import { ExportMenu } from '../../components/ExportMenu';
import { SingleSelect } from '../../components/SingleSelect';
import { BusyOverlay } from '../../components/BusyOverlay';
import { DateRangePicker } from '../../components/DateRangePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import { Pagination } from '../../components/ui';
import { usePermissionGuard, checkPermission } from '../../hooks/usePermissionGuard';
import { useAuth } from '../../context/AuthContext';
import { formatInputPlaceholder } from '../../utils/textCase';
import {
  formatMetadataForExport,
  getActionTranslationKey,
  getActorName,
  getMetadataEntries,
} from '../../utils/activityLog';
import { formatInEstablishmentTimezone } from '../../utils/establishmentTime';
import type { ActivityLogEntry, MetadataFormatOptions } from '../../utils/activityLog';
import { ActivityTimeline } from '../../components/dashboard/activity/ActivityTimeline';

type ActivityLog = ActivityLogEntry;

interface ActivityStaffOption {
  id: string;
  label: string;
  email?: string;
  username?: string;
}

/** Sentinel value for the "Me only" user filter. */
const USER_FILTER_ME = '__me__';
/**
 * Owner/account actions are logged without an employeeId (UI shows "Owner").
 * Backend accepts this sentinel as `employeeId = null`.
 */
const USER_FILTER_OWNER = 'owner';

/** Metadata fields shown inline before the rest collapse into "+N more". */
const INLINE_METADATA_LIMIT = 3;

/** Backend action strings offered in the action filter, in menu order. */
const FILTERABLE_ACTIONS = [
  'Added product',
  'Updated product',
  'Deleted product',
  'Archived product',
  'Reactivated product',
  'Removed product image',
  'Archived all products',
  'Added category',
  'Updated category',
  'Deleted category',
  'Archived category',
  'Added attribute group',
  'Updated attribute group',
  'Deleted attribute group',
  'Archived attribute group',
  'Reactivated attribute group',
  'Added sub-attribute',
  'Updated sub-attribute',
  'Deleted sub-attribute',
  'Archived sub-attribute',
  'Reactivated sub-attribute',
  'Added employee',
  'Updated employee',
  'Deactivated employee',
  'Assigned employee to location',
  'Updated employee assignment',
  'Removed employee from location',
  'Added custom role',
  'Updated custom role',
  'Deleted custom role',
  'Signed in',
  'Signed out',
  'Added location',
  'Updated location',
  'Deleted location',
  'Added brand',
  'Updated brand',
  'Deleted brand',
  'Updated account profile',
  'Changed account password',
  'Updated restaurant name',
  'Updated working hours',
  'Updated farewell message',
  'Updated restaurant logo',
  'Updated tax rate',
  'Updated loyalty program',
  'Added discount',
  'Updated discount',
  'Deleted discount',
  'Deactivated discount',
  'Added payment method',
  'Updated payment method',
  'Deleted payment method',
  'Deactivated payment method',
  'Added card type',
  'Updated card type',
  'Deleted card type',
  'Deactivated card type',
];

export function ActivityLogsPage() {
  const { t } = useTranslation();
  const { account, currentEstablishment } = useAuth();
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
  const [resourceFilter, setResourceFilter] = useState('all');
  /** `all` | `__me__` | staff employee id */
  const [userFilter, setUserFilter] = useState<string>('all');
  const [staffOptions, setStaffOptions] = useState<ActivityStaffOption[]>([]);

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

  const myStaffId = useMemo(() => {
    if (!account || staffOptions.length === 0) return null;
    const email = account.email?.trim().toLowerCase();
    const first = account.firstName?.trim().toLowerCase();
    const last = account.lastName?.trim().toLowerCase();

    const byEmail = email
      ? staffOptions.find((s) => s.email?.trim().toLowerCase() === email)
      : undefined;
    if (byEmail) return byEmail.id;

    if (first && last) {
      const byName = staffOptions.find((s) => {
        const label = s.label.trim().toLowerCase();
        return label === `${first} ${last}` || label.startsWith(`${first} ${last}`);
      });
      if (byName) return byName.id;
    }

    return null;
  }, [account, staffOptions]);

  /** Primary account owner (not a secondary admin employee login). */
  const isOwnerAccount = Boolean(account && !account.isSecondaryAdmin);

  /**
   * Resolve who "me" is for the API:
   * - Staff profile match → employee id
   * - Primary owner with no employee row → "owner" (null employeeId logs)
   */
  const myPerformedById = useMemo(() => {
    if (myStaffId) return myStaffId;
    if (isOwnerAccount) return USER_FILTER_OWNER;
    return null;
  }, [myStaffId, isOwnerAccount]);

  const userFilterOptions = useMemo(() => {
    const options: { label: string; value: string }[] = [
      {
        label: t('activity.meOnly', { defaultValue: 'Me only' }),
        value: USER_FILTER_ME,
      },
      {
        label: t('activity.owner', { defaultValue: 'Owner' }),
        value: USER_FILTER_OWNER,
      },
      ...staffOptions.map((s) => ({
        label: s.label,
        value: s.id,
      })),
    ];
    return options;
  }, [staffOptions, t]);

  const resolvedPerformedById = useMemo(() => {
    if (userFilter === 'all') return null;
    if (userFilter === USER_FILTER_ME) return myPerformedById;
    return userFilter;
  }, [userFilter, myPerformedById]);

  const resourceFilterOptions = useMemo(() => [
    { label: t('activity.resources.product', { defaultValue: 'Products' }), value: 'product' },
    { label: t('activity.resources.category', { defaultValue: 'Categories' }), value: 'category' },
    { label: t('activity.resources.employee', { defaultValue: 'Staff' }), value: 'employee' },
    { label: t('activity.resources.discount', { defaultValue: 'Discounts' }), value: 'discount' },
    { label: t('activity.resources.payment_method', { defaultValue: 'Payment Methods' }), value: 'payment_method' },
    { label: t('activity.resources.order', { defaultValue: 'Orders' }), value: 'order' },
    { label: t('activity.resources.settings', { defaultValue: 'Settings' }), value: 'settings' },
    { label: t('activity.resources.attribute', { defaultValue: 'Attributes' }), value: 'attribute' },
    { label: t('activity.resources.role', { defaultValue: 'Roles' }), value: 'role' },
    { label: t('activity.resources.access', { defaultValue: 'Sign-ins' }), value: 'access' },
    { label: t('activity.resources.location', { defaultValue: 'Locations' }), value: 'location' },
    { label: t('activity.resources.brand', { defaultValue: 'Brands' }), value: 'brand' },
    { label: t('activity.resources.account', { defaultValue: 'Account' }), value: 'account' },
  ], [t]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(searchQuery.trim()) ||
      actionFilter !== 'all' ||
      resourceFilter !== 'all' ||
      userFilter !== 'all' ||
      activePreset !== 'last_30_days',
    [searchQuery, actionFilter, resourceFilter, userFilter, activePreset],
  );

  const fetchStaffOptions = useCallback(async () => {
    try {
      const response = await api.get('/api/users');
      const rows = Array.isArray(response.data) ? response.data : [];
      const options: ActivityStaffOption[] = [];

      for (const row of rows as Record<string, unknown>[]) {
        const id = String(row.id || '');
        if (!id) continue;
        const firstName = typeof row.firstName === 'string' ? row.firstName.trim() : '';
        const lastName = typeof row.lastName === 'string' ? row.lastName.trim() : '';
        const name = typeof row.name === 'string' ? row.name.trim() : '';
        const username = typeof row.username === 'string' ? row.username.trim() : '';
        const email = typeof row.email === 'string' ? row.email.trim() : '';
        const fullName = `${firstName} ${lastName}`.trim();
        const label = name || fullName || username || email || id;
        options.push({
          id,
          label,
          email: email || undefined,
          username: username || undefined,
        });
      }

      options.sort((a, b) => a.label.localeCompare(b.label));
      setStaffOptions(options);
    } catch {
      // Non-blocking: user filter still works for "Me only" if staff load fails partially.
      setStaffOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchStaffOptions();
  }, [fetchStaffOptions, currentEstablishment?.id]);

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

  const clearAllFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setResourceFilter('all');
    setUserFilter('all');
    handlePresetChange('last_30_days');
    setPage(1);
  };

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);

      // Secondary admin with no staff profile cannot resolve "me".
      if (userFilter === USER_FILTER_ME && !myPerformedById) {
        setLogs([]);
        setTotalPages(1);
        setTotalLogs(0);
        return;
      }

      const params: Record<string, any> = {
        page,
        limit: 10,
        search: searchQuery,
      };

      if (actionFilter !== 'all') params.action = actionFilter;
      if (resourceFilter !== 'all') params.resource = resourceFilter;

      if (resolvedPerformedById) {
        params.performedById = resolvedPerformedById;
      }

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
  }, [
    page,
    actionFilter,
    resourceFilter,
    dateRange,
    searchQuery,
    userFilter,
    myPerformedById,
    resolvedPerformedById,
    t,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const dateLocale = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';

  const metadataOptions: MetadataFormatOptions = useMemo(
    () => ({
      locale: dateLocale,
      yesLabel: t('common.yes', { defaultValue: 'Yes' }),
      noLabel: t('common.no', { defaultValue: 'No' }),
      timeZone: currentEstablishment?.timezone || undefined,
    }),
    [dateLocale, t, currentEstablishment?.timezone],
  );

  const formatDate = (dateString: string) => {
    return formatInEstablishmentTimezone(dateString, dateLocale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }, currentEstablishment);
  };

  const getActionLabel = (action: string) => {
    const translation = t(`activity.actions.${getActionTranslationKey(action)}`);
    return translation.includes('activity.actions.') ? action : translation;
  };

  const actionFilterOptions = useMemo(
    // getActionLabel only reads `t`, so the list is stable per language.
    () => FILTERABLE_ACTIONS.map((action) => ({ label: getActionLabel(action), value: action })),
    [t],
  );

  const handleExport = (format: ExportFormat) => {
    const logsToExport = Array.isArray(logs) ? logs : [];
    const exportData = logsToExport.map(l => ({
      time: formatDate(l.timestamp),
      user: getActorName(l, t('activity.owner')),
      action: getActionLabel(l.action),
      desc: l.description,
      data: formatMetadataForExport(l.metadata, metadataOptions),
    }));

    if (exportData.length === 0) {
      toast.error(t('dashboard.messages.noData', { defaultValue: 'No data to export' }));
      return;
    }

    return exportTable(format, {
      filename: 'activity_log',
      title: t('activity.title'),
      meta: currentEstablishment?.name ? [{ label: t('common.location'), value: currentEstablishment.name }] : undefined,
      columns: [
        { key: 'time', label: t('activity.time') },
        { key: 'user', label: t('activity.user') },
        { key: 'action', label: t('activity.action') },
        { key: 'desc', label: t('activity.details') },
        { key: 'data', label: t('activity.data', { defaultValue: 'Data' }) },
      ],
      rows: exportData,
    });
  };

  return (
    <div className="space-y-8 pb-10" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Full-screen blocker while logs load, so filters/pagination can't be
          stacked on top of an in-flight request. */}
      <BusyOverlay visible={isLoading} />
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('activity.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('activity.subtitle')}</span>
                        {currentEstablishment?.name && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 text-mintcom-green label-strong font-sans border border-mintcom-green/20">
                                {currentEstablishment.name}
                            </span>
                        )}
                    </p>
        </div>

        <div className="flex items-center gap-3">
          {canExport && (
            <ExportMenu onExport={handleExport} />
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 sm:p-5 shadow-sm space-y-3">
        {/* Top Controls: Search Bar + Date Range Group */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Bar - expands dynamically, never squished */}
          <div className="flex-1 min-w-0 relative group">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              maxLength={255}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder={formatInputPlaceholder(t('activity.searchPlaceholder'), t('common.locale'))}
              className="w-full h-12 ps-11 pe-11 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setPage(1); }}
                aria-label={t('common.clearSearch', 'Clear search')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X size={12} strokeWidth={2.75} />
              </button>
            )}
          </div>

          {/* Date Filter Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Presets Dropdown */}
            <div className="w-full sm:w-44 shrink-0 relative z-[50]">
              <SingleSelect
                value={activePreset === 'custom' ? null : activePreset}
                onChange={(val) => {
                  if (val) handlePresetChange(val);
                }}
                options={localizedDateOptions}
                placeholder={formatInputPlaceholder(t('activity.customRange'), t('common.locale'))}
                showAllOption={false}
                allowClear={false}
                searchable={false}
                className="w-full"
                buttonClassName="!h-12 !rounded-xl"
              />
            </div>

            {/* Custom Date Range Picker */}
            <div className="w-full sm:w-auto shrink-0 relative z-[60]">
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
                align={t('common.locale') === 'ar' ? 'left' : 'right'}
              />
            </div>
          </div>
        </div>

        {/* Secondary Filter Row: Categorical Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* User / actor filter */}
          <div className="min-w-0 relative z-[40]">
            <SingleSelect
              value={userFilter === 'all' ? null : userFilter}
              onChange={(val) => {
                const next = val || 'all';
                if (next === USER_FILTER_ME && !myPerformedById) {
                  toast.error(
                    t('activity.meOnlyUnavailable', {
                      defaultValue: 'Your login is not linked to a staff profile at this location.',
                    }),
                  );
                }
                setUserFilter(next);
                setPage(1);
              }}
              options={userFilterOptions}
              allOptionLabel={t('activity.allUsers', { defaultValue: 'All users' })}
              placeholder={formatInputPlaceholder(
                t('activity.filterByUser', { defaultValue: 'Filter by user' }),
                t('common.locale'),
              )}
              className="w-full"
              buttonClassName="!h-12 !rounded-xl"
            />
          </div>

          {/* Action Filter */}
          <div className="min-w-0 relative z-[30]">
            <SingleSelect
              value={actionFilter === 'all' ? null : actionFilter}
              onChange={(val) => { setActionFilter(val || 'all'); setPage(1); }}
              options={actionFilterOptions}
              allOptionLabel={t('activity.allActions')}
              placeholder={formatInputPlaceholder(t('activity.allActions'), t('common.locale'))}
              searchable={false}
              className="w-full"
              buttonClassName="!h-12 !rounded-xl"
            />
          </div>

          {/* Resource Type Filter */}
          <div className="min-w-0 sm:col-span-2 lg:col-span-1 relative z-[20]">
            <SingleSelect
              value={resourceFilter === 'all' ? null : resourceFilter}
              onChange={(val) => { setResourceFilter(val || 'all'); setPage(1); }}
              options={resourceFilterOptions}
              allOptionLabel={t('activity.allResources', { defaultValue: 'All types' })}
              placeholder={formatInputPlaceholder(t('activity.filterByType', { defaultValue: 'Resource type' }), t('common.locale'))}
              searchable={false}
              className="w-full"
              buttonClassName="!h-12 !rounded-xl"
            />
          </div>
        </div>

        {/* Active filter summary */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-wide">
              <UserRound size={12} />
              {t('activity.activeFilters', { defaultValue: 'Filters' })}
            </span>
            {userFilter !== 'all' && (
              <button
                type="button"
                onClick={() => { setUserFilter('all'); setPage(1); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-mintcom-green/10 text-mintcom-green text-[11px] font-bold border border-mintcom-green/20 hover:bg-mintcom-green/15 transition-colors"
              >
                {userFilter === USER_FILTER_ME
                  ? t('activity.meOnly', { defaultValue: 'Me only' })
                  : userFilter === USER_FILTER_OWNER
                    ? t('activity.owner', { defaultValue: 'Owner' })
                    : staffOptions.find((s) => s.id === userFilter)?.label || t('activity.user')}
                <X size={11} strokeWidth={2.5} />
              </button>
            )}
            {actionFilter !== 'all' && (
              <button
                type="button"
                onClick={() => { setActionFilter('all'); setPage(1); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/20 hover:bg-blue-500/15 transition-colors"
              >
                {getActionLabel(actionFilter)}
                <X size={11} strokeWidth={2.5} />
              </button>
            )}
            {resourceFilter !== 'all' && (
              <button
                type="button"
                onClick={() => { setResourceFilter('all'); setPage(1); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/20 hover:bg-blue-500/15 transition-colors"
              >
                <Layers size={11} />
                {resourceFilterOptions.find(o => o.value === resourceFilter)?.label || resourceFilter}
                <X size={11} strokeWidth={2.5} />
              </button>
            )}
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-[11px] font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-200/80 dark:hover:bg-white/15 transition-colors max-w-[200px]"
              >
                <span className="truncate">“{searchQuery.trim()}”</span>
                <X size={11} strokeWidth={2.5} className="shrink-0" />
              </button>
            )}
            {activePreset !== 'last_30_days' && (
              <button
                type="button"
                onClick={() => handlePresetChange('last_30_days')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
              >
                {activePreset === 'custom'
                  ? t('activity.customRange')
                  : t(`common.datePeriods.${activePreset}`, { defaultValue: activePreset })}
                <X size={11} strokeWidth={2.5} />
              </button>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="ms-auto text-[11px] font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {t('common.clearAll', { defaultValue: 'Clear all' })}
            </button>
          </div>
        )}
      </div>

      {/* Main Logs Area — grouped timeline instead of a 5-column table, so the
          description and the metadata each get their own line rather than being
          squeezed (and cut mid-word) into one cramped row. */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col min-h-[350px]">
        <ActivityTimeline
          logs={logs}
          isLoading={isLoading}
          searchQuery={searchQuery}
          dateLocale={dateLocale}
          metadataOptions={metadataOptions}
          getActionLabel={getActionLabel}
          onSelect={setSelectedLog}
        />

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
                    <p className="label-strong font-sans text-mintcom-green">{selectedLog.action ? getActionLabel(selectedLog.action) : ''}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="label-strong font-sans mb-2">{t('activity.time')}</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatDate(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <p className="label-strong font-sans mb-2">{t('activity.user')}</p>
                    <p className="font-bold text-gray-900 dark:text-white">{getActorName(selectedLog, t('activity.owner'))}</p>
                  </div>
                </div>

                <div>
                  <p className="label-strong font-sans mb-2">{t('activity.details')}</p>
                  <p className="text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300 break-words">
                    {selectedLog.description}
                  </p>
                </div>

                <div>
                  <p className="label-strong font-sans mb-3">{t('activity.data')}</p>
                  {(() => {
                    // Identifiers stay in this view (support needs them) but sort
                    // last and render in mono so they read as references.
                    const detailEntries = getMetadataEntries(selectedLog.metadata, metadataOptions);
                    if (detailEntries.length === 0) {
                      return (
                        <p className="text-sm font-bold text-gray-400">{t('activity.noData')}</p>
                      );
                    }
                    return (
                      <dl className="rounded-2xl border border-gray-200 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                        {detailEntries.map((entry) => (
                          <div
                            key={entry.key}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 px-5 py-3 bg-gray-50/60 dark:bg-white/[0.02]"
                          >
                            <dt className="text-[11px] font-black uppercase tracking-wider text-gray-400 self-center">
                              {entry.label}
                            </dt>
                            <dd
                              className={`sm:col-span-2 text-sm break-words ${
                                entry.isIdentifier
                                  ? 'font-mono text-xs text-gray-500 dark:text-gray-400'
                                  : 'font-bold text-gray-900 dark:text-white'
                              }`}
                            >
                              {entry.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    );
                  })()}
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




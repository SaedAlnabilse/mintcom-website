import { useEffect, useMemo, useState } from 'react';
import {
  formatInEstablishmentTimezone,
  isTodayInTimezone,
  isYesterdayInTimezone,
  resolveEstablishmentTimeZone,
} from '../../utils/establishmentTime';
import { useAuth } from '../../context/AuthContext';
import {
  AlertCircle,
  BellOff,
  Info,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useBackofficeAlerts } from '../../hooks/useBackofficeAlerts';
import type {
  BackofficeAlert,
  BackofficeAlertCounts,
  BackofficeAlertScope,
} from '../../services/backofficeAlertsApi';
import { AlertRow } from './AlertRow';
import {
  isAlertKindInCategory,
  isCashAlertKind,
  isStockAlertKind,
  isTrialAlert,
  isUpdateAlertKind,
  resolveAlertDeepLink,
  type AlertCategory,
} from './alertPresentation';

export interface BackofficeAlertLocation {
  id: string;
  name: string;
  slug?: string;
  currency?: string;
}

export interface BackofficeAlertsViewProps {
  scope: BackofficeAlertScope;
  establishmentId?: string;
  establishmentIds?: readonly string[];
  locations?: readonly BackofficeAlertLocation[];
  feedTitle?: string;
}

type AlertTab = 'all' | AlertCategory;
type FlatAlertCounts = Omit<BackofficeAlertCounts, 'byEstablishment'>;

interface DisplayStats {
  total: number;
  unread: number;
  cash: number;
  stock: number;
  refunds: number;
  updates: number;
}

const statsFromCounts = (counts?: FlatAlertCounts | null): DisplayStats | null => {
  if (!counts) return null;
  return {
    total: counts.total,
    unread: counts.unread,
    cash: counts.cashShortages + counts.cashOverages + (counts.cashAlerts || 0),
    stock: counts.stockCritical + counts.stockWarnings,
    refunds: counts.refunds,
    updates: counts.updates || 0,
  };
};

const statsFromAlerts = (alerts: BackofficeAlert[]): DisplayStats => ({
  total: alerts.length,
  unread: alerts.filter((alert) => !alert.isRead).length,
  cash: alerts.filter((alert) => isCashAlertKind(alert.alertKind)).length,
  stock: alerts.filter((alert) => isStockAlertKind(alert.alertKind)).length,
  refunds: alerts.filter((alert) => alert.alertKind === 'refund').length,
  updates: alerts.filter((alert) => isUpdateAlertKind(alert.alertKind)).length,
});

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      message?: unknown;
      response?: { data?: { message?: unknown } | string };
    };
    const responseData = candidate.response?.data;
    if (typeof responseData === 'string' && responseData.trim()) return responseData;
    if (
      typeof responseData === 'object' &&
      responseData !== null &&
      typeof responseData.message === 'string'
    ) {
      return responseData.message;
    }
    if (typeof candidate.message === 'string' && candidate.message.trim()) {
      return candidate.message;
    }
  }
  return fallback;
};

export function BackofficeAlertsView({
  scope,
  establishmentId,
  establishmentIds,
  locations = [],
  feedTitle,
}: BackofficeAlertsViewProps) {
  const { t, i18n } = useTranslation();
  const { currentEstablishment } = useAuth();
  const establishmentTz = resolveEstablishmentTimeZone(currentEstablishment);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AlertTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('all');

  const {
    alerts,
    counts,
    total,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    refresh,
    retry,
    loadMore,
    markRead,
    markAllRead,
    dismiss,
  } = useBackofficeAlerts({
    scope,
    establishmentId,
    establishmentIds,
    enabled: true,
    mode: 'feed',
  });

  const locale = i18n.resolvedLanguage || i18n.language || 'en';
  const isMultiLocation = scope === 'owner' || scope === 'brand';

  const locationById = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  );
  const establishmentSlugById = useMemo(
    () =>
      Object.fromEntries(
        locations
          .filter((location) => Boolean(location.slug?.trim()))
          .map((location) => [location.id, location.slug!.trim()]),
      ),
    [locations],
  );

  const filterLocations = useMemo(() => {
    if (!isMultiLocation) return [];

    const ids = new Set<string>(Object.keys(counts?.byEstablishment || {}));
    alerts.forEach((alert) => {
      const id = alert.establishmentId || alert.establishment?.id;
      if (id) ids.add(id);
    });

    return Array.from(ids)
      .map((id) => {
        const provided = locationById.get(id);
        const fromAlert = alerts.find(
          (alert) => (alert.establishmentId || alert.establishment?.id) === id,
        )?.establishment;
        return {
          id,
          name:
            provided?.name ||
            fromAlert?.name ||
            t('notifications.filters.unknownLocation'),
          slug: provided?.slug,
          currency: provided?.currency || fromAlert?.currency,
        };
      })
      .sort((first, second) => first.name.localeCompare(second.name, locale));
  }, [alerts, counts?.byEstablishment, isMultiLocation, locale, locationById, t]);

  useEffect(() => {
    if (
      selectedLocationId !== 'all' &&
      !filterLocations.some((location) => location.id === selectedLocationId)
    ) {
      setSelectedLocationId('all');
    }
  }, [filterLocations, selectedLocationId]);

  const selectedAlerts = useMemo(
    () =>
      selectedLocationId === 'all'
        ? alerts
        : alerts.filter(
            (alert) =>
              (alert.establishmentId || alert.establishment?.id) === selectedLocationId,
          ),
    [alerts, selectedLocationId],
  );

  const stats = useMemo(() => {
    const serverStats =
      selectedLocationId === 'all'
        ? statsFromCounts(counts)
        : statsFromCounts(counts?.byEstablishment?.[selectedLocationId]);
    if (!serverStats) return statsFromAlerts(selectedAlerts);

    // Older responses may not include `updates`; preserve an accurate loaded fallback.
    if (
      selectedLocationId === 'all'
        ? counts?.updates === undefined
        : counts?.byEstablishment?.[selectedLocationId]?.updates === undefined
    ) {
      return {
        ...serverStats,
        updates: selectedAlerts.filter((alert) => isUpdateAlertKind(alert.alertKind)).length,
      };
    }
    return serverStats;
  }, [counts, selectedAlerts, selectedLocationId]);

  const filteredAlerts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase(locale);
    return selectedAlerts
      .filter((alert) => {
        const matchesTab =
          activeTab === 'all' || isAlertKindInCategory(alert.alertKind, activeTab);
        if (!matchesTab) return false;

        const employeeFullName = [
          alert.employee?.firstName,
          alert.employee?.lastName,
        ]
          .filter(Boolean)
          .join(' ');
        const searchable = [
          alert.title,
          alert.message,
          alert.establishment?.name,
          alert.employeeName,
          employeeFullName,
          alert.employee?.username,
          alert.item?.name,
          alert.rawMaterial?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase(locale);
        return !query || searchable.includes(query);
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      );
  }, [activeTab, locale, searchQuery, selectedAlerts]);

  const groupedAlerts = useMemo(() => {
    const groups = new Map<string, { label: string; alerts: BackofficeAlert[] }>();
    filteredAlerts.forEach((alert) => {
      const date = new Date(alert.createdAt);
      const valid = Number.isFinite(date.getTime());
      const key = valid
        ? formatInEstablishmentTimezone(date, 'en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }, establishmentTz)
        : 'unknown';
      if (!groups.has(key)) {
        const label = !valid
          ? t('notifications.time.unknownDate')
          : isTodayInTimezone(date, establishmentTz)
            ? t('notifications.time.today')
            : isYesterdayInTimezone(date, establishmentTz)
              ? t('notifications.time.yesterday')
              : formatInEstablishmentTimezone(date, locale, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }, establishmentTz);
        groups.set(key, { label, alerts: [] });
      }
      groups.get(key)!.alerts.push(alert);
    });
    return Array.from(groups.entries()).map(([key, group]) => ({ key, ...group }));
  }, [filteredAlerts, locale, t, establishmentTz]);

  const tabs: Array<{ id: AlertTab; count: number }> = [
    { id: 'all', count: stats.total },
    { id: 'cash', count: stats.cash },
    { id: 'stock', count: stats.stock },
    { id: 'refunds', count: stats.refunds },
    { id: 'updates', count: stats.updates },
  ];

  const filteredServerTotal =
    activeTab === 'all'
      ? stats.total
      : activeTab === 'cash'
        ? stats.cash
        : activeTab === 'stock'
          ? stats.stock
          : activeTab === 'refunds'
            ? stats.refunds
            : stats.updates;
  const hasClientFilter =
    activeTab !== 'all' || Boolean(searchQuery.trim()) || selectedLocationId !== 'all';
  const showFilteredProgress =
    hasClientFilter && alerts.length < total && filteredAlerts.length < filteredServerTotal;
  const trialAlertsPresent = alerts.some((alert) => isTrialAlert(alert));

  // Counts cover the complete server-side feed while the client initially has
  // only its first page. If a selected category promises more rows than are
  // loaded, keep paging before presenting a contradictory empty state.
  useEffect(() => {
    if (!showFilteredProgress || !hasMore || isLoadingMore || isLoading) return;
    void loadMore();
  }, [hasMore, isLoading, isLoadingMore, loadMore, showFilteredProgress]);

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllRead(
        selectedLocationId === 'all' ? undefined : selectedLocationId,
      );
      if (result.updated > 0) {
        toast.success(t('notifications.messages.markedAllRead', { count: result.updated }));
      } else if (stats.unread > 0) {
        toast(t('notifications.trial.noneClearable'));
      }
    } catch (mutationError) {
      toast.error(
        getErrorMessage(mutationError, t('notifications.errors.markReadFailed')),
      );
    }
  };

  const handleDismiss = async (alert: BackofficeAlert) => {
    try {
      const result = await dismiss(alert);
      if (result.blocked) {
        toast.error(result.message || t('notifications.errors.dismissBlocked'));
      }
    } catch (mutationError) {
      toast.error(
        getErrorMessage(mutationError, t('notifications.errors.dismissFailed')),
      );
    }
  };

  const deepLinkFor = (alert: BackofficeAlert) =>
    resolveAlertDeepLink(
      {
        ...alert,
        establishmentId: alert.establishmentId || alert.establishment?.id,
      },
      scope,
      { establishmentSlugById },
    );

  const handleActivate = (alert: BackofficeAlert, path: string) => {
    if (!alert.isRead && !isTrialAlert(alert)) {
      void markRead(alert).catch((mutationError) => {
        toast.error(
          getErrorMessage(mutationError, t('notifications.errors.markReadFailed')),
        );
      });
    }
    navigate(path);
  };

  const emptyKey = `notifications.empty.${activeTab}`;

  return (
    <section className="w-full space-y-5 pb-10 sm:space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t('notifications.title')}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            {feedTitle
              ? t(`notifications.subtitle.${scope}`, { name: feedTitle })
              : t(`notifications.subtitle.${scope}`)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isRefreshing}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-600 transition hover:border-mintcom-green hover:text-emerald-700 disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-[#0D0D0D] dark:text-gray-300 dark:hover:text-mintcom-green"
            aria-label={t('notifications.actions.refresh')}
          >
            <RefreshCw size={17} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            disabled={stats.unread === 0}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-mintcom-green px-4 text-sm font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('notifications.actions.markAllRead')}
          </button>
        </div>
      </header>

      {trialAlertsPresent && (
        <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Info size={15} className="shrink-0 text-gray-400" aria-hidden="true" />
          {t('notifications.trial.notice')}
        </p>
      )}

      <div className="space-y-3">
        <label className="relative block max-w-xl">
          <span className="sr-only">{t('notifications.filters.searchLabel')}</span>
          <Search
            size={17}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('notifications.filters.searchPlaceholder')}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white ps-9 pe-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-mintcom-green focus:ring-2 focus:ring-mintcom-green/20 dark:border-white/10 dark:bg-black/20 dark:text-white"
          />
        </label>

        <div
          className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px scrollbar-none dark:border-white/10"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-mintcom-green text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {t(`notifications.tabs.${tab.id}`)}
              <span
                className={`rounded-full px-1.5 text-[11px] font-bold ${
                  activeTab === tab.id
                    ? 'bg-mintcom-green/15 text-emerald-700 dark:text-mintcom-green'
                    : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {isMultiLocation && filterLocations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedLocationId('all')}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                selectedLocationId === 'all'
                  ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 dark:border-white/10 dark:bg-black/20 dark:text-gray-300 dark:hover:border-white/30'
              }`}
            >
              {t('notifications.actions.allLocations')}
            </button>
            {filterLocations.map((location) => {
              const locationCount =
                counts?.byEstablishment?.[location.id]?.total ??
                alerts.filter(
                  (alert) =>
                    (alert.establishmentId || alert.establishment?.id) === location.id,
                ).length;
              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => setSelectedLocationId(location.id)}
                  className={`max-w-full truncate rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                    selectedLocationId === location.id
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 dark:border-white/10 dark:bg-black/20 dark:text-gray-300 dark:hover:border-white/30'
                  }`}
                >
                  {location.name} · {locationCount}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && alerts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <span>{t('notifications.errors.loadFailed')}</span>
          <button type="button" onClick={() => void retry()} className="font-black underline">
            {t('notifications.actions.retry')}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4" aria-label={t('common.loading')}>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-[#0D0D0D]"
            />
          ))}
        </div>
      ) : error && alerts.length === 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <AlertCircle className="mx-auto text-red-500" size={30} />
          <h2 className="mt-3 font-black text-red-800 dark:text-red-200">
            {t('notifications.errors.loadFailed')}
          </h2>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => void retry()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700"
          >
            {t('notifications.actions.retry')}
          </button>
        </div>
      ) : groupedAlerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-[#0D0D0D]">
          <BellOff className="mx-auto text-gray-400" size={34} />
          <h2 className="mt-4 text-lg font-black text-gray-900 dark:text-white">
            {t(emptyKey)}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('notifications.empty.subtitle')}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedAlerts.map((group) => (
            <section key={group.key} aria-labelledby={`alert-day-${group.key}`}>
              <div className="mb-2 flex items-center gap-3 px-1">
                <h2
                  id={`alert-day-${group.key}`}
                  className="shrink-0 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {group.label}
                </h2>
                <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#0D0D0D]">
                {group.alerts.map((alert) => {
                  const deepLink = deepLinkFor(alert);
                  return (
                    <AlertRow
                      key={alert.id}
                      alert={alert}
                      onActivate={
                        deepLink ? () => handleActivate(alert, deepLink) : undefined
                      }
                      onDismiss={handleDismiss}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {(hasMore || showFilteredProgress) && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:flex-row">
          {showFilteredProgress && (
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t('notifications.showingOf', {
                loaded: filteredAlerts.length,
                total: filteredServerTotal,
              })}
            </span>
          )}
          {hasMore && (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={isLoadingMore}
              className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-700 transition hover:border-mintcom-green hover:text-emerald-700 disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-[#0D0D0D] dark:text-gray-200 dark:hover:text-mintcom-green"
            >
              {isLoadingMore && <Loader2 size={16} className="animate-spin" />}
              {t('notifications.actions.loadMore')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default BackofficeAlertsView;

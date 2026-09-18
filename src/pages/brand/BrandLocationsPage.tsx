import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

import {
    Store,
    MoreVertical,
    Eye,
    X,
    Trash2,
    Plus
} from 'lucide-react';
import { biIcon } from '../../components/ui/BiIcon';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { getBusinessTypeIcon } from '../../utils/businessTypeIcons';
import { EmptyState, Pagination, PageHeader, Badge, FilterBar, StatCard, StatCardGrid, filterSelectButtonClass, filterSelectActiveClass, filterSelectInactiveClass, filterBoxActiveClass, filterBoxInactiveClass, ListFilterBar, SelectInput } from '../../components/ui';
import { SingleSelect } from '../../components/SingleSelect';
import { DateRangePicker } from '../../components/DateRangePicker';
import { CustomTimePicker } from '../../components/CustomTimePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import { LinkLocationModal } from '../../components/LinkLocationModal';
import { SectionLoader } from '../../components/LoadingState';
import { formatBusinessTypeLabel } from '../../utils/businessTypeLabel';
import { formatInputPlaceholder } from '../../utils/textCase';
import { buildBrandDateParams } from '../../utils/brandDateParams';
import { StatValue } from '../../components/ui/StatValue';

interface LocationStats {
    id: string;
    name: string;
    type: string;
    currency: string;
    subscriptionStatus: string;
    employeeCount: number;
    orderCount: number;
    itemCount: number;
    totalRevenue?: number;
    establishmentLoginId?: string;
}

type SortOption = 'name' | 'revenue' | 'orders' | 'employees';
type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE' | 'TRIAL';
type DateRangePreset = DatePeriod;

export function BrandLocationsPage() {
    const { t } = useTranslation();
    const { brandId: paramBrandId } = useParams<{ brandId: string }>();
    const context = useOutletContext<{ brand: any }>() || {};
    const brandId = context.brand?.id || paramBrandId;
    const { setCurrentEstablishment } = useAuth();

    const [locations, setLocations] = useState<LocationStats[]>([]);
    const [statsData, setStatsData] = useState<any>(null);
    // Currency the brand aggregates are reported in (from the API, derived from
    // the brand's locations) — the totals column is not USD.
    const [baseCurrency, setBaseCurrency] = useState<string>('USD');
    const [brandName, setBrandName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const initialDateRange = useMemo(() => calculateDateRange('this_week'), []);
    const [selectedDateRange, setSelectedDateRange] = useState<DateRangePreset>('this_week');
    const [startDate, setStartDate] = useState<string>(formatDateForInput(initialDateRange.start));
    const [endDate, setEndDate] = useState<string>(formatDateForInput(initialDateRange.end));
    const [startTime, setStartTime] = useState<string>('00:00');
    const [endTime, setEndTime] = useState<string>('23:59');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [securityModal, setSecurityModal] = useState({
        isOpen: false,
        targetId: '',
        targetName: ''
    });

    // Handle click outside for active menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };

        if (activeMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenu]);

    // Link Location Modal state
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [allBrands, setAllBrands] = useState<any[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const hasLoadedOnceRef = useRef(false);

    const setQuickDate = (range: DateRangePreset) => {
        setSelectedDateRange(range);
        const { start, end } = calculateDateRange(range);
        setStartDate(formatDateForInput(start));
        setEndDate(formatDateForInput(end));
        setStartTime('00:00');
        setEndTime('23:59');
    };

    const localizedDateOptions = useMemo(() =>
        DATE_PERIOD_OPTIONS.map(opt => ({
            ...opt,
            label: t(`common.datePeriods.${opt.value}`)
        })), [t]);

    const fetchBrands = useCallback(async () => {
        try {
            const response = await api.get('/api/brands');
            setAllBrands(response.data || []);
        } catch (err) {
            console.error('Failed to fetch brands:', err);
        }
    }, []);

    const fetchLocations = useCallback(async () => {
        try {
            if (hasLoadedOnceRef.current) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            const params = buildBrandDateParams({ startDate, endDate, startTime, endTime });

            // Fetch brand details
            const brandResponse = await api.get(`/api/brands/${brandId}`);

            // Try to fetch stats, but don't block if it fails
            let statsResponse = { data: { stats: null, locationPerformance: [] } };
            try {
                statsResponse = await api.get(`/api/brands/${brandId}/dashboard-stats`, { params });
            } catch (statsErr) {
                console.warn('Failed to fetch dashboard stats:', statsErr);
            }

            setBrandName(brandResponse.data?.name || t('brand.dashboard.title'));
            setStatsData(statsResponse.data?.stats);
            setBaseCurrency(
                ((statsResponse.data as any)?.baseCurrency || 'USD').toUpperCase(),
            );

            const establishmentsData = brandResponse.data?.establishments || [];
            const locationPerformance = statsResponse.data?.locationPerformance || [];

            // Create a map of performance data for easy lookup
            const performanceMap = new Map(
                locationPerformance.map((lp: any) => [lp.id, lp])
            );

            if (establishmentsData) {
                const mappedLocations = establishmentsData.map((loc: any) => {
                    const stats = performanceMap.get(loc.id) || {} as any;
                    return {
                        ...loc,
                        type: loc.type || t('onboarding.step1.businessTypes.restaurant'),
                        currency: loc.currency?.toUpperCase() || 'USD',
                        subscriptionStatus: loc.subscriptionStatus || 'ACTIVE',
                        employeeCount: stats.employees || 0,
                        orderCount: stats.orders || 0,
                        itemCount: loc.itemCount || loc._count?.items || 0,
                        totalRevenue: stats.revenue || 0
                    };
                });
                setLocations(mappedLocations);
            }
            
            // Refresh brands list to identify available ones
            fetchBrands();
        } catch (err: any) {
            console.error('Failed to fetch locations:', err);
            toast.error(`${t('brand.dashboard.failedToLoad')}: ${err.message || t('common.error')}`);
        } finally {
            hasLoadedOnceRef.current = true;
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [brandId, endDate, endTime, startDate, startTime, t, fetchBrands]);

    const prevBrandIdRef = useRef<string | undefined>(brandId as string | undefined);
    useEffect(() => {
        if (!brandId) return;
        const isBrandSwitch = prevBrandIdRef.current !== brandId;
        if (isBrandSwitch) hasLoadedOnceRef.current = false;
        prevBrandIdRef.current = brandId as string | undefined;
        fetchLocations();
    }, [fetchLocations, brandId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, typeFilter, selectedDateRange, startDate, endDate, startTime, endTime]);

    // Get unique types for filter
    const locationTypes = useMemo(() => {
        const types = [...new Set(locations.map(loc => loc.type))];
        return types;
    }, [locations]);

    // Filtered and sorted locations
    const filteredLocations = useMemo(() => {
        let result = [...locations];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(loc =>
                loc.name.toLowerCase().includes(query) ||
                loc.type.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter(loc => loc.subscriptionStatus === statusFilter);
        }

        // Apply type filter
        if (typeFilter !== 'all') {
            result = result.filter(loc => loc.type === typeFilter);
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'revenue':
                    comparison = (a.totalRevenue || 0) - (b.totalRevenue || 0);
                    break;
                case 'orders':
                    comparison = a.orderCount - b.orderCount;
                    break;
                case 'employees':
                    comparison = a.employeeCount - b.employeeCount;
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [locations, searchQuery, statusFilter, typeFilter, sortBy, sortOrder]);

    const totalPages = Math.ceil(filteredLocations.length / ITEMS_PER_PAGE);
    const paginatedLocations = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredLocations.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredLocations, currentPage]);

    // Stats — render — when statsData absent (no fallback reduce: that double-counts shared staff and masks 0)
    const stats = useMemo(() => {
        return {
            totalLocations: locations.length,
            activeLocations: locations.filter(l => l.subscriptionStatus === 'ACTIVE').length,
            totalRevenue: statsData?.totalRevenue ?? null,
            totalEmployees: statsData?.totalEmployees ?? null,
            totalOrders: statsData?.totalOrders ?? null,
        };
    }, [locations, statsData]);

    const handleLocationClick = (loc: LocationStats) => {
        const establishment = {
            id: loc.id,
            name: loc.name,
            type: loc.type,
            currency: loc.currency,
            subscriptionStatus: loc.subscriptionStatus || 'ACTIVE'
        };

        setCurrentEstablishment(establishment);
        localStorage.setItem('selectedEstablishmentId', loc.id);
        const slug = loc.establishmentLoginId || loc.id;
        window.open(`/dashboard/${slug}`, '_blank');
    };

    const getStatusTone = (status: string): 'green' | 'red' | 'amber' | 'gray' => {
        switch (status) {
            case 'ACTIVE':
                return 'green';
            case 'INACTIVE':
                return 'red';
            case 'TRIAL':
                return 'amber';
            default:
                return 'gray';
        }
    };



    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setTypeFilter('all');
        setSortBy('name');
        setSortOrder('asc');
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all';
    const isFilterOnlyEmptyState = !searchQuery.trim() && (statusFilter !== 'all' || typeFilter !== 'all');
    const hasFilters = statusFilter !== 'all' || typeFilter !== 'all';

    if (isLoading) {
        return <SectionLoader message={t('owner.brands.loading')} />;
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <PageHeader
                title={t('brand.menu.locations')}
                subtitle={
                    <>
                        <span>{t('brand.dashboard.manageLocationsDesc')}</span>
                        {brandName && (
                            <Badge>{brandName}</Badge>
                        )}
                    </>
                }
                actions={
                    <>
                    <FilterBar>
                            <div className="flex-none w-full sm:w-[160px]">
                                <SingleSelect
                                    value={selectedDateRange === 'custom' ? null : selectedDateRange}
                                    onChange={(val) => setQuickDate(val as DateRangePreset || 'today')}
                                    options={localizedDateOptions}
                                    showAllOption={false}
                                    searchable={false}
                                    placeholder={formatInputPlaceholder(t('owner.overview.selectPeriod'), t('common.locale'))}
                                    className="w-full"
                                    buttonClassName={`${filterSelectButtonClass} ${selectedDateRange !== 'custom' ? filterSelectActiveClass : filterSelectInactiveClass}`}
                                />
                            </div>

                            {(() => {
                                const isTimeFiltered = startTime !== '00:00' || endTime !== '23:59';

                                return (
                                    <>
                                        <div className="flex-none w-full sm:w-[200px] lg:w-[240px] relative z-[60]">
                                            <DateRangePicker
                                                startDate={startDate}
                                                endDate={endDate}
                                                onRangeChange={(startDateValue, endDateValue) => {
                                                    setStartDate(startDateValue);
                                                    setEndDate(endDateValue);
                                                    setSelectedDateRange('custom');
                                                }}
                                                onClear={() => setQuickDate('today')}
                                                isActive={selectedDateRange === 'custom'}
                                                align="left"
                                            />
                                        </div>

                                        <div className="flex-none w-auto min-w-[155px] sm:min-w-[180px] relative z-[55]">
                                            <div className={`flex flex-col justify-center px-4 h-12 rounded-lg border transition-colors ${isTimeFiltered ? filterBoxActiveClass : filterBoxInactiveClass}`}>
                                                <div className="flex items-center gap-2 justify-between relative">
                                                    <CustomTimePicker
                                                        value={startTime}
                                                        onChange={(val) => { setStartTime(val); }}
                                                        className="w-[85px] sm:w-[95px]"
                                                        showIcon={true}
                                                        isActive={isTimeFiltered}
                                                    />
                                                    <span className={`text-xs font-semibold transition-colors flex-shrink-0 ${isTimeFiltered ? 'text-emerald-700/60 dark:text-mintcom-green/60' : 'text-stone-300 dark:text-zinc-700'}`}>-</span>
                                                    <CustomTimePicker
                                                        value={endTime}
                                                        onChange={(val) => { setEndTime(val); }}
                                                        className="w-[85px] sm:w-[95px]"
                                                        showIcon={true}
                                                        align="right"
                                                        isActive={isTimeFiltered}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                    </FilterBar>
                    </>
                }
                className="relative z-50"
            />

            {/* Stats Grid */}
            <StatCardGrid
                columns={5}
                className={`transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}
            >
                {[
                    { label: t('owner.locations.total'), value: stats.totalLocations, icon: biIcon('bi-geo-alt'), isCurrency: false },
                    { label: t('owner.locations.active'), value: stats.activeLocations, icon: biIcon('bi-check-circle'), isCurrency: false },
                    { label: t('brand.dashboard.totalRevenue'), value: stats.totalRevenue, icon: biIcon('bi-wallet2'), isCurrency: true },
                    { label: t('owner.menu.employees'), value: stats.totalEmployees, icon: biIcon('bi-people'), isCurrency: false },
                    { label: t('brand.dashboard.orders'), value: stats.totalOrders, icon: biIcon('bi-receipt-cutoff'), isCurrency: false },
                ].map((stat, i) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value ?? '—'}
                        currency={stat.isCurrency && stat.value != null ? baseCurrency : null}
                        isInteger={!stat.isCurrency}
                        icon={stat.icon}
                        delay={i * 0.05}
                    />
                ))}
            </StatCardGrid>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-mintcom-green text-black font-semibold text-sm hover:bg-mintcom-green/90 active:bg-mintcom-green/80 transition-colors flex-shrink-0 w-full sm:w-auto justify-center"
                >
                    <Plus size={16} strokeWidth={3} />
                    <span>{t('owner.overview.addLocation')}</span>
                </button>

                <ListFilterBar
                    searchValue={searchQuery}
                    onSearchChange={(e) => setSearchQuery(e.target.value)}
                    onSearchClear={() => setSearchQuery('')}
                    searchPlaceholder={formatInputPlaceholder(t('owner.locations.searchPlaceholder'), t('common.locale'))}
                >
                    {/* Status Filter */}
                    <div className="w-full sm:w-40">
                        <SelectInput
                            value={statusFilter === 'all' ? null : statusFilter}
                            onChange={(val) => setStatusFilter((val as StatusFilter) || 'all')}
                            options={[
                                { label: t('common.active'), value: 'ACTIVE' },
                                { label: t('paymentMethods.messages.notActive'), value: 'INACTIVE' },
                                { label: t('owner.locations.trial'), value: 'TRIAL' },
                            ]}
                            allOptionLabel={t('owner.locations.allStatuses')}
                            placeholder={t('owner.locations.allStatuses')}
                            searchable={false}
                        />
                    </div>
                    {/* Type Filter */}
                    {locationTypes.length > 1 && (
                        <div className="w-full sm:w-40">
                            <SelectInput
                                value={typeFilter === 'all' ? null : typeFilter}
                                onChange={(val) => setTypeFilter(val || 'all')}
                                options={locationTypes.map(type => ({ label: type, value: type }))}
                                allOptionLabel={t('owner.locations.allTypes')}
                                placeholder={t('owner.locations.allTypes')}
                                searchable={false}
                            />
                        </div>
                    )}
                    {/* Sort */}
                    <div className="w-full sm:w-52">
                        <SelectInput
                            value={sortBy}
                            onChange={(val) => setSortBy((val as SortOption) || 'name')}
                            options={[
                                { label: t('common.sortByName'), value: 'name' },
                                { label: t('common.sortByRevenue'), value: 'revenue' },
                                { label: t('common.sortByOrders'), value: 'orders' },
                                { label: t('common.sortByStaff'), value: 'employees' },
                            ]}
                            showAllOption={false}
                            searchable={false}
                        />
                    </div>
                    {/* Clear Filters */}
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-mintcom-red/10 text-mintcom-red text-xs font-bold tracking-wide hover:bg-mintcom-red/20 transition-all whitespace-nowrap"
                        >
                            <X size={14} />
                            {t('attributes.filters.reset')}
                        </button>
                    )}
                </ListFilterBar>
            </div>

            {/* Locations Display */}
            {filteredLocations.length === 0 ? (
                <EmptyState
                    icon={Store}
                    title={
                        isFilterOnlyEmptyState
                            ? t('common.noFilteredResults')
                            : searchQuery.trim()
                                ? t('common.noResults')
                                : t('brand.dashboard.noLocations')
                    }
                    description={
                        isFilterOnlyEmptyState
                            ? t('common.noFilteredResultsDesc')
                            : searchQuery.trim()
                                ? t('common.noMatchingResults', { entity: 'locations', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' })
                                : t('brand.dashboard.addLocationsDesc')
                    }
                    action={
                        hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="px-6 py-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 text-sm font-bold hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                            >
                                {t('attributes.filters.reset')}
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsLinkModalOpen(true)}
                                className="px-4 py-2.5 rounded-lg bg-mintcom-green text-black font-semibold text-sm hover:bg-mintcom-green/90 active:bg-mintcom-green/80 transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} />
                                {t('owner.overview.addLocation')}
                            </button>
                        )
                    }
                />
            ) : (
                <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    {/* List View */}
                    <div className={`transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-stone-50/60 dark:bg-zinc-800/40 border-b border-stone-200 dark:border-zinc-800 table-header-row">
                            <div className="col-span-3">{t('common.location')}</div>
                            <div className="col-span-2 text-center">{t('common.status.label')}</div>
                            <div className="col-span-2 text-center">{t('brand.dashboard.revenue')}</div>
                            <div className="col-span-1 text-center">{t('brand.dashboard.orders')}</div>
                            <div className="col-span-1 text-center">{t('brand.dashboard.staff')}</div>
                            <div className="col-span-1 text-center">{t('dashboard.menu.products')}</div>
                            <div className="col-span-2 text-center">{t('common.actions')}</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                            {paginatedLocations.map((loc) => {
                                const Icon = getBusinessTypeIcon(loc.type);
                                return (
                                    <div
                                        key={loc.id}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-stone-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group items-center"
                                        onClick={() => handleLocationClick(loc)}
                                    >
                                        {/* Location Info */}
                                        <div className="col-span-3 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-400 dark:text-zinc-500 group-hover:text-mintcom-green transition-colors">
                                                <Icon size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 group-hover:text-mintcom-green transition-colors truncate" title={loc.name}>
                                                    {loc.name}
                                                </h3>
                                                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5 truncate">{formatBusinessTypeLabel(loc.type) || t('onboarding.step1.businessTypes.restaurant')} - {loc.currency ? loc.currency.toUpperCase() : 'USD'}</p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-2 flex items-center justify-center">
                                            <Badge tone={getStatusTone(loc.subscriptionStatus)}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${loc.subscriptionStatus === 'ACTIVE' ? 'bg-mintcom-green' : loc.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                {loc.subscriptionStatus === 'ACTIVE' ? t('common.active') :
                                                 loc.subscriptionStatus === 'INACTIVE' ? t('paymentMethods.messages.notActive') :
                                                 loc.subscriptionStatus === 'TRIAL' ? t('owner.locations.trial') :
                                                 loc.subscriptionStatus}
                                            </Badge>
                                        </div>

                                        {/* Revenue */}
                                        <div className="col-span-2 flex items-center justify-center">
                                            <StatValue 
                                                value={loc.totalRevenue || 0} 
                                                currency={baseCurrency}
                                                className="text-sm"
                                            />
                                        </div>

                                        {/* Orders */}
                                        <div className="col-span-1 flex items-center justify-center">
                                            <StatValue 
                                                value={loc.orderCount} 
                                                className="text-sm"
                                                isInteger={true}
                                            />
                                        </div>

                                        {/* Staff */}
                                        <div className="col-span-1 flex items-center justify-center">
                                            <StatValue 
                                                value={loc.employeeCount} 
                                                className="text-sm"
                                                isInteger={true}
                                            />
                                        </div>


                                        {/* Products */}
                                        <div className="col-span-1 flex items-center justify-center">
                                            <StatValue 
                                                value={loc.itemCount} 
                                                className="text-sm"
                                                isInteger={true}
                                            />
                                        </div>
                                        {/* Actions */}
                                        <div className="col-span-2 flex items-center justify-center relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === loc.id ? null : loc.id);
                                                }}
                                                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {activeMenu === loc.id && (
                                                <div 
                                                    ref={menuRef}
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 w-48 bg-white dark:bg-zinc-800 rounded-xl border border-stone-200 dark:border-zinc-700 shadow-md z-50 overflow-hidden"
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleLocationClick(loc);
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-sm font-medium text-stone-700 dark:text-zinc-300 hover:bg-stone-50/80 dark:hover:bg-zinc-700 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Eye size={16} />
                                                        {t('brand.dashboard.viewDashboard')}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSecurityModal({
                                                                    isOpen: true,
                                                                    targetId: loc.id,
                                                                    targetName: loc.name
                                                                });
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                            {t('brand.dashboard.dissolveLocation')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        variant="footer"
                        totalItems={filteredLocations.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                </div>
            )}

            <SecurityVerificationModal
                isOpen={securityModal.isOpen}
                onClose={() => setSecurityModal({ ...securityModal, isOpen: false })}
                onSuccess={fetchLocations}
                targetId={securityModal.targetId}
                targetName={securityModal.targetName}
                mode="dissolve-establishment"
            />

            <LinkLocationModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                brandId={brandId as string}
                onSuccess={() => {
                    fetchLocations();
                    fetchBrands();
                }}
                existingBrands={allBrands}
            />
        </div >
    );
}












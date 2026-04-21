import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

import {
    Store,
    Users,
    Search,
    ShoppingBag,
    DollarSign,
    Activity,
    MoreVertical,
    Eye,
    X,
    Trash2,
    Plus
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { CustomSelect } from '../../components/CustomSelect';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { getBusinessTypeIcon } from '../../utils/businessTypeIcons';
import { Pagination } from '../../components/ui';
import { SingleSelect } from '../../components/SingleSelect';
import { DateRangePicker } from '../../components/DateRangePicker';
import { CustomTimePicker } from '../../components/CustomTimePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import { LinkLocationModal } from '../../components/LinkLocationModal';

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
    const [securityModal, setSecurityModal] = useState({
        isOpen: false,
        targetId: '',
        targetName: ''
    });

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

            const params: Record<string, string> = {
                timeRange: 'custom',
                startDate: `${startDate}T${startTime}:00`,
                endDate: `${endDate}T${endTime}:00`,
            };

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

    useEffect(() => {
        if (brandId) {
            hasLoadedOnceRef.current = false;
            fetchLocations();
        }
    }, [brandId, fetchLocations]);

    useEffect(() => {
        if (brandId && hasLoadedOnceRef.current) {
            fetchLocations();
        }
    }, [brandId, fetchLocations]);

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

    // Stats calculations
    const stats = useMemo(() => {
        return {
            totalLocations: locations.length,
            activeLocations: locations.filter(l => l.subscriptionStatus === 'ACTIVE').length,
            totalRevenue: statsData?.totalRevenue || locations.reduce((sum, l) => sum + (l.totalRevenue || 0), 0),
            // Use unique employee count from backend to avoid double counting shared employees
            totalEmployees: statsData?.totalEmployees || locations.reduce((sum, l) => sum + l.employeeCount, 0),
            totalOrders: statsData?.totalOrders || locations.reduce((sum, l) => sum + l.orderCount, 0),
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-paymint-green/ text-paymint-green border-paymint-green/';
            case 'INACTIVE':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'TRIAL':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(t('common.language') === 'Arabic' ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setTypeFilter('all');
        setSortBy('name');
        setSortOrder('asc');
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all';
    const hasFilters = statusFilter !== 'all' || typeFilter !== 'all';

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-paymint-green/20 rounded-full" />
                    <div className="w-16 h-16 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
                </div>
                <p className="text-sm font-bold text-gray-400 tracking-widest">{t('owner.brands.loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-50">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('brand.menu.locations')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('brand.dashboard.manageLocationsDesc')}</span>
                        {brandName && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                                {brandName}
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3 relative z-50">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[20px] shadow-sm shadow-indigo-500/5 dark:shadow-black/20 border border-gray-100 dark:border-white/[0.05] p-1.5">
                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 xl:gap-0 h-full">
                            <div className={`flex-none w-[160px] rounded-xl border transition-all ${selectedDateRange !== 'custom' ? 'bg-paymint-green/5 border-paymint-green ring-1 ring-paymint-green shadow-lg shadow-paymint-green/10' : 'border-transparent'}`}>
                                <SingleSelect
                                    value={selectedDateRange === 'custom' ? null : selectedDateRange}
                                    onChange={(val) => setQuickDate(val as DateRangePreset || 'today')}
                                    options={DATE_PERIOD_OPTIONS}
                                    showAllOption={false}
                                    placeholder={t('owner.overview.selectPeriod')}
                                    className="w-full"
                                    buttonClassName={`!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10 !rounded-xl !p-2.5 !h-full !text-xs !font-bold ${selectedDateRange !== 'custom' ? '!text-paymint-green' : ''}`}
                                />
                            </div>

                            <div className="hidden xl:block w-px h-8 bg-gray-100 dark:bg-white/10 mx-3" />

                            {(() => {
                                const isTimeFiltered = startTime !== '00:00' || endTime !== '23:59';

                                return (
                                    <div className="flex-1 flex flex-col md:flex-row gap-4 items-center">
                                        <div className="flex-none min-w-[200px] sm:min-w-[240px] relative z-[60]">
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

                                        <div className="hidden md:block w-px h-6 bg-gray-100 dark:bg-white/10" />

                                        <div className="flex-none w-auto min-w-[155px] sm:min-w-[180px] relative z-[55]">
                                            <div className={`flex flex-col justify-center px-3 h-12 rounded-xl border transition-all shadow-sm ${isTimeFiltered
                                                ? 'bg-paymint-green/5 border-paymint-green ring-2 ring-paymint-green shadow-lg shadow-paymint-green/10'
                                                : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-white/10 hover:border-paymint-green/50'
                                                }`}>
                                                <div className="flex items-center gap-2 justify-between relative">
                                                    <CustomTimePicker
                                                        value={startTime}
                                                        onChange={(val) => { setStartTime(val); }}
                                                        className="w-[85px] sm:w-[95px]"
                                                        showIcon={true}
                                                        isActive={isTimeFiltered}
                                                    />
                                                    <span className={`text-xs font-bold transition-colors flex-shrink-0 ${isTimeFiltered ? 'text-[#7CC39F]/50' : 'text-gray-300 dark:text-white/10'}`}>-</span>
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
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Add Location Button */}
                    <button
                        onClick={() => setIsLinkModalOpen(true)}
                        className="flex items-center gap-2 px-6 rounded-2xl bg-paymint-green text-black font-black text-xs tracking-widest hover:bg-[#68B390] transition-all shadow-sm active:scale-95 h-[52px] flex-shrink-0"
                    >
                        <Plus size={20} strokeWidth={3} />
                        <span>{t('owner.overview.addLocation')}</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            {/* Stats Grid */}
            <div className={`grid grid-cols-2 lg:grid-cols-5 gap-4 transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
                {[
                    { label: t('owner.locations.total'), value: stats.totalLocations, icon: Store, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: t('owner.locations.active'), value: stats.activeLocations, icon: Activity, color: 'text-paymint-green', bg: 'bg-paymint-green/' },
                    { label: t('brand.dashboard.totalRevenue'), value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: t('owner.menu.employees'), value: stats.totalEmployees, icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { label: t('brand.dashboard.orders'), value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="group relative p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300`}>
                                    <stat.icon size={20} />
                                </div>
                            </div>
                            <p className="dashboard-card-label mb-1">{stat.label}</p>
                            <p className="dashboard-card-value">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm transition-opacity duration-200 ${isRefreshing ? 'opacity-85' : 'opacity-100'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input maxLength={255}
                            type="text"
                            placeholder={t('owner.locations.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-11 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:outline-none h-[52px] shadow-sm transition-all"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            aria-label={t('common.clearSearch', 'Clear search')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                          >
                            <X size={12} strokeWidth={2.75} />
                          </button>
                        )}
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Status Filter */}
                        <div className="w-40">
                            <CustomSelect
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val as StatusFilter)}
                                options={[
                                    { label: t('owner.locations.allStatuses'), value: 'all' },
                                    { label: t('common.active'), value: 'ACTIVE' },
                                    { label: t('paymentMethods.messages.notActive'), value: 'INACTIVE' },
                                    { label: t('owner.locations.trial'), value: 'TRIAL' },
                                ]}
                            />
                        </div>

                        {/* Type Filter */}
                        {locationTypes.length > 1 && (
                            <div className="w-40">
                                <CustomSelect
                                    value={typeFilter}
                                    onChange={(val) => setTypeFilter(val as string)}
                                    options={[
                                        { label: t('owner.locations.allTypes'), value: 'all' },
                                        ...locationTypes.map(type => ({ label: type, value: type }))
                                    ]}
                                />
                            </div>
                        )}

                        {/* Sort */}
                        <div className="w-52">
                            <CustomSelect
                                value={sortBy}
                                onChange={(val) => setSortBy(val as SortOption)}
                                options={[
                                    { label: t('common.sortByName'), value: 'name' },
                                    { label: t('common.sortByRevenue'), value: 'revenue' },
                                    { label: t('common.sortByOrders'), value: 'orders' },
                                    { label: t('common.sortByStaff'), value: 'employees' },
                                ]}
                            />
                        </div>

                        {/* Clear Filters */}
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-paymint-red/10 text-paymint-red text-xs font-bold tracking-wide hover:bg-paymint-red/20 transition-all"
                            >
                                <X size={14} />
                                {t('attributes.filters.reset')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Locations Display */}
            {filteredLocations.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Store size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{searchQuery.trim() ? t('common.noResults') : t('owner.locations.noLocations')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {searchQuery.trim()
                            ? t('common.noMatchingResults', { entity: 'locations', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' })
                            : hasActiveFilters
                                ? t('brand.dashboard.adjustFilters')
                                : t('brand.dashboard.addLocationsDesc')}
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-6">
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 text-sm font-bold hover:bg-gray-200 transition-all"
                            >
                                {t('attributes.filters.reset')}
                            </button>
                        )}
                        <button
                            onClick={() => setIsLinkModalOpen(true)}
                            className="px-6 py-2 rounded-xl bg-paymint-green text-black text-sm font-bold hover:bg-[#68B390] transition-all flex items-center gap-2"
                        >
                            <Plus size={16} />
                            {t('owner.overview.addLocation')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                    {/* List View */}
                    <div className={`transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 dashboard-card-meta tracking-wide">
                            <div className="col-span-3">{t('common.location')}</div>
                            <div className="col-span-2 text-center">{t('common.status.label')}</div>
                            <div className="col-span-2 text-center">{t('brand.dashboard.revenue')}</div>
                            <div className="col-span-1 text-center">{t('brand.dashboard.orders')}</div>
                            <div className="col-span-1 text-center">{t('brand.dashboard.staff')}</div>
                            <div className="col-span-1 text-center">{t('dashboard.menu.products')}</div>
                            <div className="col-span-2 text-center">{t('common.actions')}</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {paginatedLocations.map((loc) => {
                                const Icon = getBusinessTypeIcon(loc.type);
                                return (
                                    <div
                                        key={loc.id}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group items-center"
                                        onClick={() => handleLocationClick(loc)}
                                    >
                                        {/* Location Info */}
                                        <div className="col-span-3 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-paymint-green transition-colors">
                                                <Icon size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors truncate" title={loc.name}>
                                                    {loc.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5 truncate">{loc.type ? loc.type.charAt(0).toUpperCase() + loc.type.slice(1).toLowerCase() : t('onboarding.step1.businessTypes.restaurant')} - {loc.currency ? loc.currency.toUpperCase() : 'USD'}</p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-2 flex items-center justify-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wider border ${getStatusColor(loc.subscriptionStatus)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${loc.subscriptionStatus === 'ACTIVE' ? 'bg-paymint-green' : loc.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                {loc.subscriptionStatus === 'ACTIVE' ? t('common.active') :
                                                 loc.subscriptionStatus === 'INACTIVE' ? t('paymentMethods.messages.notActive') :
                                                 loc.subscriptionStatus === 'TRIAL' ? t('owner.locations.trial') :
                                                 loc.subscriptionStatus}
                                            </span>
                                        </div>

                                        {/* Revenue */}
                                        <div className="col-span-2 flex items-center justify-center">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(loc.totalRevenue || 0)}
                                            </span>
                                        </div>

                                        {/* Orders */}
                                        <div className="col-span-1 flex items-center justify-center">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{loc.orderCount}</span>
                                        </div>

                                        {/* Staff */}
                                        <div className="col-span-1 flex items-center justify-center">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{loc.employeeCount}</span>
                                        </div>


                                        {/* Products */}
                                        <div className="col-span-1 flex items-center justify-center">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{loc.itemCount}</span>
                                        </div>
                                        {/* Actions */}
                                        <div className="col-span-2 flex items-center justify-center relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === loc.id ? null : loc.id);
                                                }}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {activeMenu === loc.id && (
                                                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleLocationClick(loc);
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
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
                onSuccess={fetchLocations}
                existingBrands={allBrands}
            />
        </div >
    );
}











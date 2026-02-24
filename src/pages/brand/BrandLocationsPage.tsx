import { useCallback, useEffect, useMemo, useState } from 'react';
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
    Grid3X3,
    List,
    ExternalLink,
    MoreVertical,
    Eye,
    X,
    Trash2
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { CustomSelect } from '../../components/CustomSelect';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { getBusinessTypeIcon } from '../../utils/businessTypeIcons';
import { Pagination } from '../../components/ui';

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

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'revenue' | 'orders' | 'employees';
type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE' | 'TRIAL';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
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

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchLocations = useCallback(async () => {
        try {
            setIsLoading(true);

            // Fetch brand details
            const brandResponse = await api.get(`/api/brands/${brandId}`);

            // Try to fetch stats, but don't block if it fails
            let statsResponse = { data: { stats: null, locationPerformance: [] } };
            try {
                statsResponse = await api.get(`/api/brands/${brandId}/dashboard-stats`);
            } catch (statsErr) {
                console.warn('Failed to fetch dashboard stats:', statsErr);
            }

            setBrandName(brandResponse.data?.name || t('brand.dashboard.title'));
            setStatsData(statsResponse.data?.stats);

            const establishments = brandResponse.data?.establishments || [];
            const locationPerformance = statsResponse.data?.locationPerformance || [];

            // Create a map of performance data for easy lookup
            const performanceMap = new Map(
                locationPerformance.map((lp: any) => [lp.id, lp])
            );

            if (establishments) {
                const mappedLocations = establishments.map((loc: any) => {
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
        } catch (err: any) {
            console.error('Failed to fetch locations:', err);
            toast.error(`${t('brand.dashboard.failedToLoad')}: ${err.message || t('common.error')}`);
        } finally {
            setIsLoading(false);
        }
    }, [brandId, t]);

    useEffect(() => {
        if (brandId) {
            fetchLocations();
        }
    }, [brandId, fetchLocations]);

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
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
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
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                            {t('owner.brands.badge')}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('brand.menu.locations')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
                        {t('brand.dashboard.manageLocationsDesc')} {brandName}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                </div>
            </div>

            {/* Stats Grid */}
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: t('owner.locations.total'), value: stats.totalLocations, icon: Store, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: t('owner.locations.active'), value: stats.activeLocations, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
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
                            <p className="text-xs font-bold text-gray-400 tracking-wide mb-1">{stat.label}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('owner.locations.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-paymint-green/10 focus:border-paymint-green/50 dark:focus:border-paymint-green/50 focus:bg-white dark:focus:bg-white/10 transition-all h-[52px] shadow-sm focus:shadow-lg"
                        />
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
                        <div className="w-40">
                            <CustomSelect
                                value={sortBy}
                                onChange={(val) => setSortBy(val as SortOption)}
                                options={[
                                    { label: t('common.sortByName'), value: 'name' },
                                    { label: t('owner.overview.totalRevenue'), value: 'revenue' },
                                    { label: t('brand.dashboard.orders'), value: 'orders' },
                                    { label: t('brand.dashboard.staff'), value: 'employees' },
                                ]}
                            />
                        </div>



                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-1 h-[52px]">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Grid3X3 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
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

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <span className="text-xs font-bold text-gray-400 tracking-wide">{t('owner.staff.badge')}:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                            {searchQuery && (
                                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-400">
                                    {t('common.search')}: "{searchQuery}"
                                </span>
                            )}
                            {statusFilter !== 'all' && (
                                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-400">
                                    {t('owner.locations.status')}: {statusFilter}
                                </span>
                            )}
                            {typeFilter !== 'all' && (
                                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-400">
                                    {t('owner.locations.type')}: {typeFilter}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-medium text-gray-400 ml-auto">
                            {filteredLocations.length} {t('common.of')} {locations.length} {t('brand.dashboard.locations')}
                        </span>
                    </div>
                )}
            </div>

            {/* Locations Display */}
            {filteredLocations.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Store size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{t('owner.locations.noLocations')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {hasActiveFilters ? t('brand.dashboard.adjustFilters') : t('brand.dashboard.addLocationsDesc')}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 px-6 py-2 rounded-xl bg-paymint-green text-black text-sm font-bold hover:bg-emerald-400 transition-all"
                        >
                            {t('attributes.filters.reset')}
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedLocations.map((loc) => {
                        const Icon = getBusinessTypeIcon(loc.type);
                        return (
                            <div
                                key={loc.id}
                                className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 p-6 cursor-pointer transition-all shadow-sm hover:shadow-lg overflow-hidden"
                            >
                                {/* Hover gradient */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Header */}
                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-500 group-hover:text-paymint-green group-hover:border-paymint-green/30 transition-all">
                                            <Icon size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">
                                                {loc.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium text-gray-500">{loc.type ? loc.type.charAt(0).toUpperCase() + loc.type.slice(1).toLowerCase() : t('onboarding.step1.businessTypes.restaurant')}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                                <span className="text-xs font-medium text-gray-500">{loc.currency ? loc.currency.toUpperCase() : 'USD'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenu(activeMenu === loc.id ? null : loc.id);
                                            }}
                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeMenu === loc.id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLocationClick(loc);
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

                                {/* Status Badge */}
                                <div className="mb-6">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide border ${getStatusColor(loc.subscriptionStatus)}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${loc.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500' : loc.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                        {loc.subscriptionStatus === 'ACTIVE' ? t('common.active') :
                                         loc.subscriptionStatus === 'INACTIVE' ? t('paymentMethods.messages.notActive') :
                                         loc.subscriptionStatus === 'TRIAL' ? t('owner.locations.trial') :
                                         loc.subscriptionStatus}
                                    </span>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                                        <p className="text-xs font-bold text-gray-400 tracking-wide mb-1">{t('brand.dashboard.revenue')}</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(loc.totalRevenue || 0)}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                                        <p className="text-xs font-bold text-gray-400 tracking-wide mb-1">{t('brand.dashboard.orders')}</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{loc.orderCount}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                                        <p className="text-xs font-bold text-gray-400 tracking-wide mb-1">{t('brand.dashboard.staff')}</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{loc.employeeCount}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                                        <p className="text-xs font-bold text-gray-400 tracking-wide mb-1">{t('dashboard.menu.products')}</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{loc.itemCount}</p>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => handleLocationClick(loc)}
                                    className="w-full py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold tracking-wide hover:bg-paymint-green hover:text-black transition-all flex items-center justify-center gap-2 group/btn border border-gray-200 dark:border-white/5 hover:border-paymint-green"
                                >
                                    <span>{t('brand.dashboard.openDashboard')}</span>
                                    <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List View */
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-visible shadow-sm">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 text-xs font-bold text-gray-500 tracking-wide">
                        <div className="col-span-4">{t('common.location')}</div>
                        <div className="col-span-2">{t('common.status.label')}</div>
                        <div className="col-span-2 text-right">{t('brand.dashboard.revenue')}</div>
                        <div className="col-span-1 text-right">{t('brand.dashboard.orders')}</div>
                        <div className="col-span-1 text-right">{t('brand.dashboard.staff')}</div>
                        <div className="col-span-2 text-right">{t('common.actions')}</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {paginatedLocations.map((loc) => {
                            const Icon = getBusinessTypeIcon(loc.type);
                            return (
                                <div
                                    key={loc.id}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                    onClick={() => handleLocationClick(loc)}
                                >
                                    {/* Location Info */}
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-paymint-green transition-colors">
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">
                                                {loc.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{loc.type ? loc.type.charAt(0).toUpperCase() + loc.type.slice(1).toLowerCase() : t('onboarding.step1.businessTypes.restaurant')} - {loc.currency ? loc.currency.toUpperCase() : 'USD'}</p>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 flex items-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide border ${getStatusColor(loc.subscriptionStatus)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${loc.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500' : loc.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            {loc.subscriptionStatus === 'ACTIVE' ? t('common.active') :
                                             loc.subscriptionStatus === 'INACTIVE' ? t('paymentMethods.messages.notActive') :
                                             loc.subscriptionStatus === 'TRIAL' ? t('owner.locations.trial') :
                                             loc.subscriptionStatus}
                                        </span>
                                    </div>

                                    {/* Revenue */}
                                    <div className="col-span-2 flex items-center justify-end">
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(loc.totalRevenue || 0)}
                                        </span>
                                    </div>

                                    {/* Orders */}
                                    <div className="col-span-1 flex items-center justify-end">
                                        <span className="font-bold text-gray-900 dark:text-white">{loc.orderCount}</span>
                                    </div>

                                    {/* Staff */}
                                    <div className="col-span-1 flex items-center justify-end">
                                        <span className="font-bold text-gray-900 dark:text-white">{loc.employeeCount}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex items-center justify-end relative">
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
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <SecurityVerificationModal
                isOpen={securityModal.isOpen}
                onClose={() => setSecurityModal({ ...securityModal, isOpen: false })}
                onSuccess={fetchLocations}
                targetId={securityModal.targetId}
                targetName={securityModal.targetName}
                mode="dissolve-establishment"
            />
        </div >
    );
}

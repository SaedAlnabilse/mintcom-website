import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Store,
    Users,
    RefreshCw,
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
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'revenue' | 'orders' | 'employees';
type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE' | 'TRIAL';

export function BrandLocationsPage() {
    const { brandId } = useParams<{ brandId: string }>();
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

    useEffect(() => {
        if (brandId) {
            fetchLocations();
        }
    }, [brandId]);

    // Close menu when clicking outside or scrolling
    useEffect(() => {
        if (!activeMenu) return;

        const handleClick = () => setActiveMenu(null);
        const handleScroll = () => setActiveMenu(null);

        document.addEventListener('click', handleClick);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('click', handleClick);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [activeMenu]);

    const fetchLocations = async () => {
        try {
            setIsLoading(true);

            // Fetch both brand details and dashboard stats in parallel
            const [brandResponse, statsResponse] = await Promise.all([
                api.get(`/api/brands/${brandId}`),
                api.get(`/api/brands/${brandId}/dashboard-stats`)
            ]);

            setBrandName(brandResponse.data?.name || 'Brand');
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
                        type: loc.type || 'Restaurant',
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
        } catch (err) {
            console.error('Failed to fetch locations:', err);
            toast.error('Failed to load locations');
        } finally {
            setIsLoading(false);
        }
    };

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
        window.open('/dashboard', '_blank');
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
        return new Intl.NumberFormat('en-US', {
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
                <p className="text-sm font-bold text-gray-400 tracking-widest">Loading Locations...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                            Fleet Hub
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Locations</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Manage and monitor all locations under {brandName}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLocations}
                        className="p-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Locations', value: stats.totalLocations, icon: Store, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Active', value: stats.activeLocations, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Employees', value: stats.totalEmployees, icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { label: 'Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon size={20} />
                                </div>
                            </div>
                            <p className="text-xs font-bold text-gray-400 tracking-wide mb-1">{stat.label}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        </div>
                    </motion.div>
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
                            placeholder="Search locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
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
                                    { label: 'All Status', value: 'all' },
                                    { label: 'Active', value: 'ACTIVE' },
                                    { label: 'Inactive', value: 'INACTIVE' },
                                    { label: 'Trial', value: 'TRIAL' },
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
                                        { label: 'All Types', value: 'all' },
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
                                    { label: 'Sort by Name', value: 'name' },
                                    { label: 'Sort by Revenue', value: 'revenue' },
                                    { label: 'Sort by Orders', value: 'orders' },
                                    { label: 'Sort by Employees', value: 'employees' },
                                ]}
                            />
                        </div>



                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Grid3X3 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
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
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <span className="text-xs font-bold text-gray-400 tracking-wide">Active filters:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                            {searchQuery && (
                                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-400">
                                    Search: "{searchQuery}"
                                </span>
                            )}
                            {statusFilter !== 'all' && (
                                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-400">
                                    Status: {statusFilter}
                                </span>
                            )}
                            {typeFilter !== 'all' && (
                                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-400">
                                    Type: {typeFilter}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-medium text-gray-400 ml-auto">
                            {filteredLocations.length} of {locations.length} locations
                        </span>
                    </div>
                )}
            </div>

            {/* Locations Display */}
            {filteredLocations.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Store size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">No locations found</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {hasActiveFilters ? 'Try adjusting your filters' : 'Add locations to your brand to see them here'}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 px-6 py-2 rounded-xl bg-paymint-green text-black text-sm font-bold hover:bg-emerald-400 transition-all"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredLocations.map((loc, index) => (
                            <motion.div
                                key={loc.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.03 }}
                                className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 p-6 cursor-pointer transition-all shadow-sm hover:shadow-lg overflow-hidden"
                            >
                                {/* Hover gradient */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Header */}
                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-500 group-hover:text-paymint-green group-hover:border-paymint-green/30 transition-all">
                                            <Store size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">
                                                {loc.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium text-gray-500">{loc.type ? loc.type.charAt(0).toUpperCase() + loc.type.slice(1).toLowerCase() : 'Restaurant'}</span>
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

                                        <AnimatePresence>
                                            {activeMenu === loc.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleLocationClick(loc);
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Eye size={16} />
                                                        View Dashboard
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
                                                        Dissolve Location
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mb-6">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide border ${getStatusColor(loc.subscriptionStatus)}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${loc.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500' : loc.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                        {loc.subscriptionStatus ? loc.subscriptionStatus.charAt(0).toUpperCase() + loc.subscriptionStatus.slice(1).toLowerCase() : ''}
                                    </span>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                                        <p className="text-xs font-bold text-gray-400 tracking-wide mb-1">Revenue</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(loc.totalRevenue || 0)}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                                        <p className="text-xs font-bold text-gray-400 tracking-wide mb-1">Orders</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{loc.orderCount}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                                        <p className="text-xs font-bold text-gray-400 tracking-wide mb-1">Staff</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{loc.employeeCount}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                                        <p className="text-xs font-bold text-gray-400 tracking-wide mb-1">Products</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{loc.itemCount}</p>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => handleLocationClick(loc)}
                                    className="w-full py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold tracking-wide hover:bg-paymint-green hover:text-black transition-all flex items-center justify-center gap-2 group/btn border border-gray-200 dark:border-white/5 hover:border-paymint-green"
                                >
                                    <span>Open Dashboard</span>
                                    <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                /* List View */
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-visible shadow-sm">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 text-xs font-bold text-gray-500 tracking-wide">
                        <div className="col-span-4">Location</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-right">Revenue</div>
                        <div className="col-span-1 text-right">Orders</div>
                        <div className="col-span-1 text-right">Staff</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredLocations.map((loc, index) => (
                                <motion.div
                                    key={loc.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                    onClick={() => handleLocationClick(loc)}
                                >
                                    {/* Location Info */}
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-paymint-green transition-colors">
                                            <Store size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">
                                                {loc.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{loc.type ? loc.type.charAt(0).toUpperCase() + loc.type.slice(1).toLowerCase() : 'Restaurant'} - {loc.currency ? loc.currency.toUpperCase() : 'USD'}</p>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 flex items-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide border ${getStatusColor(loc.subscriptionStatus)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${loc.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500' : loc.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            {loc.subscriptionStatus ? loc.subscriptionStatus.charAt(0).toUpperCase() + loc.subscriptionStatus.slice(1).toLowerCase() : ''}
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

                                        <AnimatePresence>
                                            {activeMenu === loc.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, x: 10 }}
                                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, x: 10 }}
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
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
                                                        View Dashboard
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
                                                        Dissolve Location
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Results Summary */}
            <div className="text-center">
                <p className="text-sm text-gray-500">
                    Showing <span className="font-bold text-gray-900 dark:text-white">{filteredLocations.length}</span> of{' '}
                    <span className="font-bold text-gray-900 dark:text-white">{locations.length}</span> locations
                </p>
            </div>

            <SecurityVerificationModal
                isOpen={securityModal.isOpen}
                onClose={() => setSecurityModal({ ...securityModal, isOpen: false })}
                onSuccess={fetchLocations}
                targetId={securityModal.targetId}
                targetName={securityModal.targetName}
                mode="dissolve-establishment"
            />
        </div>
    );
}

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
    Plus,
    Store,
    Search,
    DollarSign,
    Zap,
    Building2,
    Grid3X3,
    MoreVertical,
    ExternalLink,
    Settings,
    Eye,
    List,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CustomSelect } from '../../components/CustomSelect';
import { Pagination } from '../../components/ui';
import { getBusinessTypeIcon } from '../../utils/businessTypeIcons';
import { formatInputPlaceholder } from '../../utils/textCase';

type ViewMode = 'grid' | 'list';
const ITEMS_PER_PAGE = 10;

export function OwnerEstablishmentsPage() {
    const { t } = useTranslation();

    const STATUS_OPTIONS = [
        { label: t('owner.locations.allStatuses'), value: 'all' },
        { label: t('common.active'), value: 'ACTIVE' },
        { label: t('owner.locations.trial'), value: 'TRIAL' },
        { label: t('owner.locations.canceled'), value: 'CANCELED' },
        { label: t('owner.locations.expired'), value: 'EXPIRED' }
    ];

    const TYPE_OPTIONS = [
        { label: t('owner.locations.allTypes'), value: 'all' },
        { label: t('onboarding.step1.businessTypes.restaurant'), value: 'RESTAURANT' },
        { label: t('onboarding.step1.businessTypes.cafe'), value: 'CAFE' },
        { label: t('onboarding.step1.businessTypes.retail'), value: 'RETAIL' }
    ];

    const navigate = useNavigate();
    const { account, establishments, setCurrentEstablishment } = useAuth();
    const [searchParams] = useSearchParams();
    const highlightId = searchParams.get('highlight');
    const launchSetupForHighlightedLocation = searchParams.get('setup') === '1';

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

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

    const filteredEstablishments = useMemo(() => {
        return establishments.filter(est => {
            const matchesSearch = est.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                est.type?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || est.subscriptionStatus === statusFilter;
            const matchesType = typeFilter === 'all' || est.type?.toUpperCase() === typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [establishments, searchQuery, statusFilter, typeFilter]);

    // Reset to first page when filtering
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, typeFilter]);

    const paginatedEstablishments = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEstablishments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredEstablishments, currentPage]);

    const totalPages = Math.ceil(filteredEstablishments.length / ITEMS_PER_PAGE);

    const handleEstablishmentClick = (establishment: any) => {
        setCurrentEstablishment(establishment);
        localStorage.setItem('selectedEstablishmentId', establishment.id);
        const slug = establishment.establishmentLoginId && establishment.establishmentLoginId.trim().length > 0 
            ? establishment.establishmentLoginId 
            : establishment.id;
        const shouldLaunchSetup = launchSetupForHighlightedLocation || establishment.id === highlightId;

        if (shouldLaunchSetup) {
            const welcomeTargets = new Set<string>(
                [establishment.id, establishment.establishmentLoginId, slug].filter(Boolean)
            );

            welcomeTargets.forEach((target) => {
                localStorage.setItem(`paymint.dashboard.welcome.pending.${target}`, 'true');
                localStorage.removeItem(`paymint.dashboard.setup.dismissed.${target}`);
                localStorage.removeItem(`paymint.dashboard.setup.dismissed.v3.${account?.id || 'anonymous'}.${target}`);
                localStorage.removeItem(`paymint.dashboard.setup.dismissed.v3.anonymous.${target}`);
                localStorage.removeItem(`paymint.dashboard.setup.dismissed.v6.${account?.id || 'anonymous'}.${target}`);
                localStorage.removeItem(`paymint.dashboard.setup.dismissed.v6.anonymous.${target}`);
                sessionStorage.removeItem(`paymint.dashboard.setup.session.dismissed.v4.${account?.id || 'anonymous'}.${target}`);
                sessionStorage.removeItem(`paymint.dashboard.setup.session.dismissed.v4.anonymous.${target}`);
                sessionStorage.removeItem(`paymint.dashboard.setup.session.dismissed.v5.${account?.id || 'anonymous'}.${target}`);
                sessionStorage.removeItem(`paymint.dashboard.setup.session.dismissed.v5.anonymous.${target}`);
                sessionStorage.removeItem(`paymint.dashboard.setup.session.dismissed.v6.${account?.id || 'anonymous'}.${target}`);
                sessionStorage.removeItem(`paymint.dashboard.setup.session.dismissed.v6.anonymous.${target}`);
            });
        }

        window.open(`/dashboard/${slug}${shouldLaunchSetup ? '?setup=1' : ''}`, '_blank');
    };

    const handleAddEstablishment = () => {
        navigate('/onboarding');
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
                return 'bg-paymint-green/10 text-paymint-green border-paymint-green/20';
            case 'TRIAL':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'CANCELED':
            case 'EXPIRED':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const formatCreatedDate = (dateString?: string) => {
        if (!dateString) return '-';

        return new Date(dateString).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Auto-scroll to highlighted item
    useEffect(() => {
        if (highlightId && filteredEstablishments.some(e => e.id === highlightId)) {
            const element = document.getElementById(`establishment-${highlightId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightId, filteredEstablishments]);


    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('owner.locations.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
                        {t('owner.locations.subtitle')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => navigate('/owner/brands')}
                        className="px-5 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <Building2 size={18} className="text-purple-500" />
                        <span>{t('owner.overview.brands')}</span>
                    </button>

                    <button
                        onClick={handleAddEstablishment}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-paymint-green text-black font-black text-xs tracking-widest hover:bg-[#68B390] transition-all shadow-sm active:scale-95 flex-shrink-0 justify-center"
                    >
                        <Plus size={20} strokeWidth={3} />
                        <span>{t('owner.overview.addLocation')}</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    className="group relative p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center transition-transform duration-300">
                            <Store size={24} />
                        </div>
                        <div>
                            <p className="dashboard-stat-title">{t('owner.locations.total')}</p>
                            <p className="dashboard-card-value text-xl">{establishments.length}</p>
                        </div>
                    </div>
                </div>

                <div
                    className="group relative p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-paymint-green/10 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center transition-transform duration-300">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="dashboard-stat-title">{t('owner.locations.active')}</p>
                            <p className="dashboard-card-value text-xl">
                                {establishments.filter(e => e.subscriptionStatus === 'ACTIVE').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="group relative p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center transition-transform duration-300">
                            <Settings size={24} />
                        </div>
                        <div>
                            <p className="dashboard-stat-title">{t('owner.locations.trial')}</p>
                            <p className="dashboard-card-value text-xl">
                                {establishments.filter(e => e.subscriptionStatus === 'TRIAL').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input maxLength={255}
                            type="text"
                            placeholder={formatInputPlaceholder(t('owner.locations.searchPlaceholder'), t('common.locale'))}
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

                    {/* Filter Controls */}
                    <div className="flex items-center gap-3 flex-wrap lg:ml-auto">
                        <div className="w-44">
                            <CustomSelect
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(String(val))}
                                options={STATUS_OPTIONS}
                            />
                        </div>
                        <div className="w-44">
                            <CustomSelect
                                value={typeFilter}
                                onChange={(val) => setTypeFilter(String(val))}
                                options={TYPE_OPTIONS}
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
                    </div>
                </div>


            </div>

            {/* Establishments Grid */}
            {filteredEstablishments.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Store size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{searchQuery.trim() ? t('common.noResults') : t('owner.locations.noLocations')}</p>
                    <p className="text-sm font-bold text-gray-500 mt-1">
                        {searchQuery.trim() ? t('common.noMatchingResults', { entity: 'locations', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' }) : t('owner.locations.addFirstLocation')}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {paginatedEstablishments.map((est) => {
                            const Icon = getBusinessTypeIcon(est.type);
                            return (
                                <div
                                    key={est.id}
                                    id={`establishment-${est.id}`}
                                    className={`group relative bg-white dark:bg-[#1E293B] rounded-2xl border p-6 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer ${est.id === highlightId
                                        ? 'border-paymint-green ring-2 ring-paymint-green/50 shadow-xl shadow-paymint-green/20'
                                        : 'border-gray-200 dark:border-white/5 hover:border-blue-500/30'
                                        }`}
                                    onClick={() => handleEstablishmentClick(est)}
                                >
                                    {/* Hover gradient */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    {est.id === highlightId && (
                                        <div className="absolute top-0 right-0 p-2">
                                            <span className="bg-paymint-green text-black text-xs font-black px-2 py-1 rounded-bl-xl rounded-tr-xl tracking-widest shadow-sm">{t('owner.locations.new')}</span>
                                        </div>
                                    )}

                                    {/* Content Container */}
                                    <div className="relative z-10">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                                                    <Icon size={28} />
                                                </div>
                                                <div>                                                <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors truncate max-w-[180px]">
                                                    {est.name}
                                                </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-bold text-gray-500">{est.type ? est.type.charAt(0).toUpperCase() + est.type.slice(1).toLowerCase() : t('owner.locations.standard')}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                                        <span className="text-xs font-bold text-gray-500">{est.currency?.toUpperCase() || 'JOD'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenu(activeMenu === est.id ? null : est.id);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {activeMenu === est.id && (
                                                    <div
                                                        className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                                    >
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEstablishmentClick(est);
                                                                }}
                                                                className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Eye size={16} />
                                                                {t('owner.locations.enter')}
                                                            </button>
                                                            <button
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Settings size={16} />
                                                                {t('common.settings')}
                                                            </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mb-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black tracking-wider border ${getStatusColor(est.subscriptionStatus)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${est.subscriptionStatus === 'ACTIVE' ? 'bg-paymint-green' :
                                                    est.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' :
                                                        'bg-red-500'
                                                    }`} />
                                                {est.subscriptionStatus ? t(`owner.locations.${est.subscriptionStatus.toLowerCase()}`) : ''}
                                            </span>
                                        </div>

                                        {/* Quick Stats */}
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5 group-hover:border-blue-500/10 transition-colors">
                                                <div className="flex items-center gap-2 mb-1 text-gray-400">
                                                    <DollarSign size={12} />
                                                    <p className="text-xs font-bold tracking-wide">{t('owner.locations.currency')}</p>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{est.currency?.toUpperCase() || 'JOD'}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5 group-hover:border-blue-500/10 transition-colors">
                                                <div className="flex items-center gap-2 mb-1 text-gray-400">
                                                    <Zap size={12} />
                                                    <p className="text-xs font-bold tracking-wide">{t('owner.locations.status')}</p>
                                                </div>
                                                <p className="text-sm font-bold text-paymint-green">{t('owner.locations.online')}</p>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEstablishmentClick(est);
                                            }}
                                            className="w-full py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold tracking-wide hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn border border-gray-200 dark:border-white/5 hover:border-blue-500 shadow-sm"
                                        >
                                            <span>{t('owner.locations.open')}</span>
                                            <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={filteredEstablishments.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                </div>
            ) : (
                /* List View */
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                        {paginatedEstablishments.map((est) => {
                            const Icon = getBusinessTypeIcon(est.type);
                            return (
                                <div
                                    key={est.id}
                                    className={`p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${est.id === highlightId ? 'bg-paymint-green/5' : ''}`}
                                    onClick={() => handleEstablishmentClick(est)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold tracking-tight text-gray-900 dark:text-white text-sm">{est.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">{est.type ? est.type.charAt(0).toUpperCase() + est.type.slice(1).toLowerCase() : t('owner.locations.standard')}</span>
                                                    {est.id === highlightId && (
                                                        <span className="text-xs text-paymint-green font-bold tracking-wider">{t('owner.locations.new')}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === est.id ? null : est.id);
                                                }}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {activeMenu === est.id && (
                                                <div
                                                    className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                                >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEstablishmentClick(est);
                                                            }}
                                                            className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                                                        >
                                                            <Eye size={14} /> {t('owner.locations.view')}
                                                        </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wider border ${getStatusColor(est.subscriptionStatus)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${est.subscriptionStatus === 'ACTIVE' ? 'bg-paymint-green' : est.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            {est.subscriptionStatus ? t(`owner.locations.${est.subscriptionStatus.toLowerCase()}`) : ''}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{est.currency?.toUpperCase() || 'JOD'}</span>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                        {t('owner.brands.created')}: <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCreatedDate(est.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 table-header-row items-center">
                        <div className="col-span-3 flex items-center gap-4">
                            <div className="w-10" />
                            <span>{t('owner.locations.title')}</span>
                        </div>
                        <div className="col-span-2 text-center flex justify-center">{t('owner.locations.type')}</div>
                        <div className="col-span-2 text-center flex justify-center">{t('owner.locations.status')}</div>
                        <div className="col-span-1 text-center flex justify-center">{t('owner.locations.currency')}</div>
                        <div className="col-span-2 text-center flex justify-center">{t('owner.brands.created')}</div>
                        <div className="col-span-2 text-center flex justify-center">{t('owner.locations.actions')}</div>
                    </div>

                    {/* Desktop Table Body */}
                    <div className="hidden md:block divide-y divide-gray-100 dark:divide-white/5">
                        {paginatedEstablishments.map((est) => {
                            const Icon = getBusinessTypeIcon(est.type);
                            return (
                                <div
                                    key={est.id}
                                    id={`establishment-${est.id}`}
                                    className={`grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group items-center ${est.id === highlightId
                                        ? 'bg-paymint-green/5 ring-1 ring-paymint-green inset-0 z-10'
                                        : ''
                                        }`}
                                    onClick={() => handleEstablishmentClick(est)}
                                >
                                    {/* Info */}
                                    <div className="col-span-3 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-paymint-green transition-colors">
                                            <Icon size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors truncate" title={est.name}>
                                                {est.name}
                                            </h3>
                                            {est.id === highlightId && (
                                                <span className="text-xs text-paymint-green font-bold tracking-wider">{t('owner.locations.new')}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Type */}
                                    <div className="col-span-2 flex items-center justify-center text-center">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white text-center">
                                            {est.type ? est.type.charAt(0).toUpperCase() + est.type.slice(1).toLowerCase() : t('owner.locations.standard')}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 flex items-center justify-center text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wider border ${getStatusColor(est.subscriptionStatus)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${est.subscriptionStatus === 'ACTIVE' ? 'bg-paymint-green' :
                                                est.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' :
                                                    'bg-red-500'
                                                }`} />
                                            {est.subscriptionStatus ? t(`owner.locations.${est.subscriptionStatus.toLowerCase()}`) : ''}
                                        </span>
                                    </div>

                                    {/* Currency */}
                                    <div className="col-span-1 flex items-center justify-center text-center">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white text-center">
                                            {est.currency?.toUpperCase() || 'JOD'}
                                        </span>
                                    </div>


                                    {/* Created */}
                                    <div className="col-span-2 flex items-center justify-center text-center">
                                        <span className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                            {formatCreatedDate(est.createdAt)}
                                        </span>
                                    </div>
                                    {/* Actions */}
                                    <div className="col-span-2 flex items-center justify-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEstablishmentClick(est);
                                            }}
                                            className="px-4 py-2 rounded-lg bg-paymint-green text-black text-xs font-bold tracking-wide hover:bg-[#68B390] transition-all flex items-center gap-2"
                                        >
                                            {t('owner.locations.enter')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        variant="footer"
                        totalItems={filteredEstablishments.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                </div>
            )}
        </div>
    );
}






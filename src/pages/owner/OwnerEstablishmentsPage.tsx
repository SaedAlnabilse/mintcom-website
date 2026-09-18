import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
    Plus,
    Store,
    DollarSign,
    Zap,
    Building2,
    MoreVertical,
    ExternalLink,
    Settings,
    Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, Pagination, PageHeader, ListFilterBar, SelectInput, StatCard, StatCardGrid, primaryButtonInlineClass, primaryButtonClass } from '../../components/ui';
import { getBusinessTypeIcon } from '../../utils/businessTypeIcons';
import { formatBusinessTypeLabel } from '../../utils/businessTypeLabel';
import { formatInputPlaceholder } from '../../utils/textCase';
import { BiIcon } from '../../components/ui/BiIcon';

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
    const { establishments, setCurrentEstablishment } = useAuth();
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
    const hasSearch = searchQuery.trim().length > 0;
    const hasActiveFilters = hasSearch || statusFilter !== 'all' || typeFilter !== 'all';
    const hasOnlyFilters = !hasSearch && (statusFilter !== 'all' || typeFilter !== 'all');

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setTypeFilter('all');
    };

    const handleEstablishmentClick = (establishment: any) => {
        setCurrentEstablishment(establishment);
        localStorage.setItem('selectedEstablishmentId', establishment.id);
        const slug = establishment.establishmentLoginId && establishment.establishmentLoginId.trim().length > 0 
            ? establishment.establishmentLoginId 
            : establishment.id;
        const shouldLaunchSetup = launchSetupForHighlightedLocation || establishment.id === highlightId;

        window.open(`/dashboard/${slug}${shouldLaunchSetup ? '?setup=1' : ''}`, '_blank');
    };

    const handleAddEstablishment = () => {
        navigate('/onboarding?new=1');
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
                return 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20';
            case 'TRIAL':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'CANCELED':
            case 'EXPIRED':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-stone-500/10 text-stone-500 border-stone-500/20';
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
        <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <PageHeader
                title={t('owner.locations.title')}
                subtitle={t('owner.locations.subtitle')}
                actions={
                    <>
                    <button
                        onClick={() => navigate('/owner/brands')}
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                        <Building2 size={15} className="text-stone-500 dark:text-zinc-400" />
                        <span>{t('owner.overview.brands')}</span>
                    </button>

                    <button
                        onClick={handleAddEstablishment}
                        className={primaryButtonInlineClass}
                    >
                        <Plus size={15} strokeWidth={2} />
                        <span>{t('owner.overview.addLocation')}</span>
                    </button>
                    </>
                }
            />

            {/* Stats Grid — quiet support style */}
            <StatCardGrid columns={3}>
                <StatCard
                    label={t('owner.locations.total')}
                    value={establishments.length}
                    isInteger={true}
                    icon={<BiIcon icon="bi-geo-alt" />}
                    iconTone="green"
                />
                <StatCard
                    label={t('owner.locations.active')}
                    value={establishments.filter(e => e.subscriptionStatus === 'ACTIVE').length}
                    isInteger={true}
                    icon={<BiIcon icon="bi-check-circle" />}
                    iconTone="green"
                />
                <StatCard
                    label={t('owner.locations.trial')}
                    value={establishments.filter(e => e.subscriptionStatus === 'TRIAL').length}
                    isInteger={true}
                    icon={<BiIcon icon="bi-hourglass-split" />}
                    iconTone="green"
                />
            </StatCardGrid>

            {/* Filters Bar */}
            <ListFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                onSearchClear={() => setSearchQuery('')}
                searchPlaceholder={formatInputPlaceholder(t('owner.locations.searchPlaceholder'), t('common.locale'))}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            >
                <div className="w-full sm:w-44">
                    <SelectInput
                        value={statusFilter === 'all' ? null : statusFilter}
                        onChange={(val) => setStatusFilter(val || 'all')}
                        options={STATUS_OPTIONS.filter((opt) => opt.value !== 'all')}
                        allOptionLabel={t('owner.locations.allStatuses')}
                        placeholder={t('owner.locations.allStatuses')}
                        searchable={false}
                    />
                </div>
                <div className="w-full sm:w-44">
                    <SelectInput
                        value={typeFilter === 'all' ? null : typeFilter}
                        onChange={(val) => setTypeFilter(val || 'all')}
                        options={TYPE_OPTIONS.filter((opt) => opt.value !== 'all')}
                        allOptionLabel={t('owner.locations.allTypes')}
                        placeholder={t('owner.locations.allTypes')}
                        searchable={false}
                    />
                </div>
            </ListFilterBar>

            {/* Establishments Grid */}
            {filteredEstablishments.length === 0 ? (
                <EmptyState
                    icon={Store}
                    title={
                        hasSearch
                            ? t('common.noResults')
                            : hasOnlyFilters
                                ? t('common.noFilteredResults')
                                : t('owner.locations.noLocations')
                    }
                    description={
                        hasSearch
                            ? t('common.noMatchingResults', { entity: 'locations', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' })
                            : hasOnlyFilters
                                ? t('common.noFilteredResultsDesc')
                                : t('owner.locations.addFirstLocation')
                    }
                    action={
                        hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="mt-6 px-6 py-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-500 text-[13px] font-semibold hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                            >
                                {t('attributes.filters.reset')}
                            </button>
                        ) : undefined
                    }
                />
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {paginatedEstablishments.map((est) => {
                            const Icon = getBusinessTypeIcon(est.type);
                            return (
                                <div
                                    key={est.id}
                                    id={`establishment-${est.id}`}
                                     className={`group relative bg-white dark:bg-zinc-900/60 rounded-2xl border p-5 shadow-sm hover:border-stone-300 dark:hover:border-zinc-700 transition-colors cursor-pointer ${est.id === highlightId
                                         ? 'border-mintcom-green ring-1 ring-mintcom-green/40'
                                         : 'border-stone-200 dark:border-zinc-800'
                                         }`}
                                    onClick={() => handleEstablishmentClick(est)}
                                >
                                    {/* Hover gradient */}
                                    
                                    {est.id === highlightId && (
                                        <div className="absolute top-0 right-0 p-2">
                                            <span className="bg-mintcom-green text-black text-xs font-black px-2 py-1 rounded-bl-xl rounded-tr-xl tracking-widest shadow-sm">{t('owner.locations.new')}</span>
                                        </div>
                                    )}

                                    {/* Content Container */}
                                    <div className="relative z-10">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center transition-transform">
                                                    <Icon size={28} />
                                                </div>
                                                <div>                                                                                                 <h3 className="font-barlow text-[17px] font-bold tracking-tight text-stone-900 dark:text-zinc-100 truncate max-w-[180px]">
                                                    {est.name}
                                                </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                         <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">{formatBusinessTypeLabel(est.type) || t('owner.locations.standard')}</span>
                                                         <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-zinc-600" />
                                                         <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">{est.currency?.toUpperCase() || 'JOD'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenu(activeMenu === est.id ? null : est.id);
                                                    }}
                                                     className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 transition-colors"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {activeMenu === est.id && (
                                                     <div
                                                         className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900/60 rounded-xl border border-stone-200 dark:border-zinc-800 shadow-sm z-50 overflow-hidden"
                                                     >
                                                             <button
                                                                 onClick={(e) => {
                                                                     e.stopPropagation();
                                                                     handleEstablishmentClick(est);
                                                                 }}
                                                                 className="w-full px-4 py-2.5 text-left text-sm font-semibold text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800/60 flex items-center gap-2.5 transition-colors"
                                                             >
                                                                 <Eye size={14} />
                                                                 {t('owner.locations.enter')}
                                                             </button>
                                                             <button
                                                                 onClick={(e) => e.stopPropagation()}
                                                                 className="w-full px-4 py-2.5 text-left text-sm font-semibold text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800/60 flex items-center gap-2.5 transition-colors"
                                                             >
                                                                 <Settings size={14} />
                                                                 {t('common.settings')}
                                                             </button>
                                                     </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mb-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black tracking-wider border ${getStatusColor(est.subscriptionStatus)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${est.subscriptionStatus === 'ACTIVE' ? 'bg-mintcom-green' :
                                                    est.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' :
                                                        'bg-red-500'
                                                    }`} />
                                                {est.subscriptionStatus ? t(`owner.locations.${est.subscriptionStatus.toLowerCase()}`) : ''}
                                            </span>
                                        </div>

                                        {/* Quick Stats */}
                                         <div className="grid grid-cols-2 gap-2 mb-5">
                                             <div className="p-3 rounded-xl border border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
                                                 <div className="flex items-center gap-1.5 mb-1 text-stone-400">
                                                     <DollarSign size={12} />
                                                     <p className="text-[11px] font-semibold tracking-wide uppercase">{t('owner.locations.currency')}</p>
                                                 </div>
                                                 <p className="font-barlow text-[15px] font-bold text-stone-900 dark:text-zinc-100">{est.currency?.toUpperCase() || 'JOD'}</p>
                                             </div>
                                             <div className="p-3 rounded-xl border border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
                                                 <div className="flex items-center gap-1.5 mb-1 text-stone-400">
                                                     <Zap size={12} />
                                                     <p className="text-[11px] font-semibold tracking-wide uppercase">{t('owner.locations.status')}</p>
                                                 </div>
                                                 <p className="font-barlow text-[15px] font-bold text-stone-500 dark:text-zinc-400">{t('owner.locations.online')}</p>
                                             </div>
                                         </div>

                                         {/* Action Button */}
                                         <button
                                             onClick={(e) => {
                                                 e.stopPropagation();
                                                 handleEstablishmentClick(est);
                                             }}
                                             className={`${primaryButtonClass} group/btn`}
                                         >
                                             <span>{t('owner.locations.open')}</span>
                                             <ExternalLink size={14} className="shrink-0" />
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
                <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-stone-100 dark:divide-zinc-800">
                        {paginatedEstablishments.map((est) => {
                            const Icon = getBusinessTypeIcon(est.type);
                            return (
                                <div
                                    key={est.id}
                                    className={`p-4 hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer ${est.id === highlightId ? 'bg-mintcom-green/5' : ''}`}
                                    onClick={() => handleEstablishmentClick(est)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300">
                                                <Icon size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-barlow font-bold text-stone-900 dark:text-zinc-100 text-[15px]">{est.name}</h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400">{formatBusinessTypeLabel(est.type) || t('owner.locations.standard')}</span>
                                                    {est.id === highlightId && (
                                                        <span className="text-[11px] font-semibold text-mintcom-green">{t('owner.locations.new')}</span>
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
                                                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {activeMenu === est.id && (
                                                <div
                                                    className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-zinc-900/60 rounded-xl border border-stone-200 dark:border-zinc-800 shadow-sm z-50 overflow-hidden"
                                                >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEstablishmentClick(est);
                                                            }}
                                                            className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800/60 flex items-center gap-2 transition-colors"
                                                        >
                                                            <Eye size={14} /> {t('owner.locations.view')}
                                                        </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getStatusColor(est.subscriptionStatus)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${est.subscriptionStatus === 'ACTIVE' ? 'bg-mintcom-green' : est.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            {est.subscriptionStatus ? t(`owner.locations.${est.subscriptionStatus.toLowerCase()}`) : ''}
                                        </span>
                                        <span className="text-[13px] font-bold text-stone-900 dark:text-zinc-100">{est.currency?.toUpperCase() || 'JOD'}</span>
                                    </div>
                                    <div className="mt-3 text-[11px] text-stone-500 dark:text-zinc-400">
                                        {t('owner.brands.created')}: <span className="font-semibold text-stone-700 dark:text-zinc-200">{formatCreatedDate(est.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3.5 bg-stone-50 dark:bg-zinc-900/40 border-b border-stone-200 dark:border-zinc-800 table-header-row items-center">
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
                    <div className="hidden md:block divide-y divide-stone-100 dark:divide-zinc-800">
                        {paginatedEstablishments.map((est) => {
                            const Icon = getBusinessTypeIcon(est.type);
                            return (
                                <div
                                    key={est.id}
                                    id={`establishment-${est.id}`}
                                    className={`grid grid-cols-12 gap-4 px-5 py-4 hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group items-center ${est.id === highlightId
                                        ? 'bg-mintcom-green/5 ring-1 ring-mintcom-green/30 inset-0 z-10'
                                        : ''
                                        }`}
                                    onClick={() => handleEstablishmentClick(est)}
                                >
                                    {/* Info */}
                                    <div className="col-span-3 flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 shrink-0">
                                            <Icon size={17} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-barlow text-[15px] font-bold tracking-tight text-stone-900 dark:text-zinc-100 truncate" title={est.name}>
                                                {est.name}
                                            </h3>
                                            {est.id === highlightId && (
                                                <span className="text-[11px] font-semibold text-mintcom-green">{t('owner.locations.new')}</span>
                                            )}
                                        </div>
                                    </div>

                                     {/* Type */}
                                     <div className="col-span-2 flex items-center justify-center text-center">
                                         <span className="text-[13px] font-semibold text-stone-700 dark:text-zinc-200 text-center">
                                             {formatBusinessTypeLabel(est.type) || t('owner.locations.standard')}
                                         </span>
                                     </div>

                                     {/* Status */}
                                     <div className="col-span-2 flex items-center justify-center text-center">
                                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getStatusColor(est.subscriptionStatus)}`}>
                                             <span className={`w-1.5 h-1.5 rounded-full ${est.subscriptionStatus === 'ACTIVE' ? 'bg-mintcom-green' :
                                                 est.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' :
                                                     'bg-red-500'
                                                 }`} />
                                             {est.subscriptionStatus ? t(`owner.locations.${est.subscriptionStatus.toLowerCase()}`) : ''}
                                         </span>
                                     </div>

                                     {/* Currency */}
                                     <div className="col-span-1 flex items-center justify-center text-center">
                                         <span className="text-[13px] font-bold text-stone-900 dark:text-zinc-100 text-center">
                                             {est.currency?.toUpperCase() || 'JOD'}
                                         </span>
                                     </div>


                                     {/* Created */}
                                     <div className="col-span-2 flex items-center justify-center text-center">
                                         <span className="text-[13px] text-stone-500 dark:text-zinc-400 text-center">
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
                                             className={primaryButtonInlineClass}
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




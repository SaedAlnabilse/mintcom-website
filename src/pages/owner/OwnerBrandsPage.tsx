import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Building2,
    Search,
    Link2,
    Loader2,
    Store,
    Hash,
    Lock,
    ChevronRight,
    ChevronLeft,
    Shield,
    Check,
    Plus,
    Calendar,
    ExternalLink,
    MoreVertical,
    Eye,
    EyeOff,
    Trash2,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { useAuth } from '../../context/AuthContext';
import { CustomSelect } from '../../components/CustomSelect';
import { getBusinessTypeIcon } from '../../utils/businessTypeIcons';
import { Pagination } from '../../components/ui';

interface Brand {
    id: string;
    name: string;
    logo?: string;
    establishmentLoginId: string;
    establishmentCount: number;
    establishments: {
        id: string;
        name: string;
        type: string;
        currency: string;
    }[];
    createdAt: string;
}

interface EmployeeForMerging {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    establishmentId: string;
    establishmentName: string;
    [key: string]: any;
}

interface EstablishmentEmployees {
    establishmentId: string;
    establishmentName: string;
    employees: EmployeeForMerging[];
}

type SortOption = 'name' | 'date' | 'locations';

type BrandFormData = {
    name: string;
    establishmentLoginId: string;
    establishmentPassword?: string;
};

const BRAND_LOGIN_ID_MIN_LENGTH = 4;
const BRAND_LOGIN_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

export function OwnerBrandsPage() {
    const { t } = useTranslation();
    const { establishments, refreshEstablishments } = useAuth();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEstablishments, setSelectedEstablishments] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortOrder] = useState<'asc' | 'desc'>('asc');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Wizard state
    const [wizardStep, setWizardStep] = useState(1);
    const [employeesForMerging, setEmployeesForMerging] = useState<EstablishmentEmployees[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [error, setError] = useState('');
    const [loginIdCheckState, setLoginIdCheckState] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [loginIdCheckMessage, setLoginIdCheckMessage] = useState('');
    const loginIdCheckRequestRef = useRef(0);
    const [showPassword, setShowPassword] = useState(false);
    const [securityModal, setSecurityModal] = useState<{
        isOpen: boolean,
        targetId: string,
        targetName: string,
        mode: 'dissolve-brand'
    }>({
        isOpen: false,
        targetId: '',
        targetName: '',
        mode: 'dissolve-brand'
    });



    const createBrandSchemaObj = useMemo(() => z.object({
        name: z.string().min(2, t('owner.brands.validation.nameMin')),
        establishmentLoginId: z.string()
            .min(4, t('owner.brands.validation.loginIdMin'))
            .regex(/^[a-zA-Z0-9_-]+$/, t('owner.brands.validation.loginIdRegex')),
        establishmentPassword: z.string().min(6, t('owner.brands.validation.passwordMin')),
    }), [t]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        trigger,
        clearErrors,
        setError: setFieldError,
        getValues,
    } = useForm<z.infer<typeof createBrandSchemaObj>>({
        resolver: zodResolver(createBrandSchemaObj)
    });

    const resetLoginIdCheckState = useCallback(() => {
        loginIdCheckRequestRef.current += 1;
        setLoginIdCheckState('idle');
        setLoginIdCheckMessage('');
    }, []);

    const validateEstablishmentLoginIdAvailability = useCallback(async ({ silentNetworkError = false }: { silentNetworkError?: boolean } = {}) => {
        const rawLoginId = (getValues('establishmentLoginId') || '').trim();

        if (!rawLoginId || rawLoginId.length < BRAND_LOGIN_ID_MIN_LENGTH || !BRAND_LOGIN_ID_REGEX.test(rawLoginId)) {
            resetLoginIdCheckState();
            return false;
        }

        const requestId = loginIdCheckRequestRef.current + 1;
        loginIdCheckRequestRef.current = requestId;
        setLoginIdCheckState('checking');
        setLoginIdCheckMessage('');

        try {
            const response = await api.get('/api/brands/availability/establishment-login-id', {
                params: { establishmentLoginId: rawLoginId },
            });

            if (loginIdCheckRequestRef.current !== requestId) {
                return false;
            }

            const message = response.data?.message || (response.data?.available
                ? t('owner.brands.validation.loginIdAvailable', { defaultValue: 'This Login ID is available.' })
                : t('owner.brands.validation.loginIdTakenHint', { defaultValue: 'It must be unique across all locations and brands.' }));

            if (!response.data?.available) {
                setLoginIdCheckState('taken');
                setLoginIdCheckMessage(message);
                setFieldError('establishmentLoginId', { type: 'server', message });
                return false;
            }

            clearErrors('establishmentLoginId');
            setLoginIdCheckState('available');
            setLoginIdCheckMessage(message);
            return true;
        } catch (availabilityError: any) {
            if (loginIdCheckRequestRef.current !== requestId) {
                return false;
            }

            resetLoginIdCheckState();
            const message = availabilityError.response?.data?.message || t('owner.brands.validation.loginIdCheckFailed', {
                defaultValue: 'Could not verify this Login ID right now. Please try again.',
            });

            if (!silentNetworkError) {
                setError(message);
            }

            return false;
        }
    }, [clearErrors, getValues, resetLoginIdCheckState, setFieldError, t]);

    const establishmentLoginIdField = register('establishmentLoginId', {
        onChange: () => {
            setError('');
            resetLoginIdCheckState();
            if (errors.establishmentLoginId?.type === 'server') {
                clearErrors('establishmentLoginId');
            }
        },
        onBlur: () => {
            void validateEstablishmentLoginIdAvailability({ silentNetworkError: true });
        },
    });

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

    // Filtered and sorted brands
    const filteredBrands = useMemo(() => {
        let result = [...brands];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(brand =>
                brand.name.toLowerCase().includes(query) ||
                brand.establishmentLoginId.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            // Pin the top brand to the very top
            if (a.id === 'cmkek5eme0001vjjqvfm3wjwa') return -1;
            if (b.id === 'cmkek5eme0001vjjqvfm3wjwa') return 1;

            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'date':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'locations':
                    comparison = a.establishmentCount - b.establishmentCount;
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [brands, searchQuery, sortBy, sortOrder]);

    const totalPages = Math.ceil(filteredBrands.length / ITEMS_PER_PAGE);

    const paginatedBrands = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredBrands.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredBrands, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy]);

    // Stats
    const stats = useMemo(() => {
        return {
            totalBrands: brands.length,
            totalMerged: brands.reduce((acc, b) => acc + b.establishmentCount, 0),
            availableNodes: establishments.filter(
                (est: any) => !brands.some(brand => brand.establishments.some(e => e.id === est.id))
            ).length,
        };
    }, [brands, establishments]);

    const fetchBrands = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/brands');
            setBrands(response.data);
        } catch (error) {
            console.error('Failed to fetch brands:', error);
            toast.error(t('owner.brands.failedToLoad'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const fetchEmployeesForMerging = async (establishmentIds: string[]) => {
        if (establishmentIds.length === 0) {
            setEmployeesForMerging([]);
            return;
        }

        try {
            setLoadingEmployees(true);
            const response = await api.post('/api/brands/employees-for-merging', {
                establishmentIds,
            });

            if (response.data) {
                const sanitizedData = response.data.map((group: any) => ({
                    ...group,
                    employees: group.employees.map((emp: any) => {
                        const realId = emp.employeeId || emp.id || emp._id || emp.userId;
                        return {
                            ...emp,
                            employeeId: realId,
                            id: realId || `temp-${Math.random().toString(36).substr(2, 9)}`
                        };
                    })
                }));
                setEmployeesForMerging(sanitizedData);
            }
        } catch (err) {
            console.error('Failed to fetch employees:', err);
            setEmployeesForMerging([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const availableEstablishments = establishments.filter(
        (est: any) => !brands.some(brand => brand.establishments.some(e => e.id === est.id))
    );

    const toggleEstablishment = (estId: string) => {
        setSelectedEstablishments(prev =>
            prev.includes(estId)
                ? prev.filter(id => id !== estId)
                : [...prev, estId]
        );
    };

    const toggleEmployee = (employeeId: string) => {
        if (!employeeId) return;
        setSelectedEmployees((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const selectAllFromEstablishment = (estEmployees: EstablishmentEmployees, select: boolean) => {
        const validEmployees = estEmployees.employees.filter(e => e.employeeId);
        const employeeIds = validEmployees.map(e => e.employeeId);

        if (select) {
            setSelectedEmployees(prev => [...new Set([...prev, ...employeeIds])]);
        } else {
            setSelectedEmployees(prev => prev.filter(id => !employeeIds.includes(id)));
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role?.toUpperCase()) {
            case 'MANAGER':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'CASHIER':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'WAITER':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'ADMIN':
                return 'bg-paymint-green/10 text-paymint-green border-paymint-green/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const handleNextStep = async () => {
        if (wizardStep === 1) {
            const isValid = await trigger(['name', 'establishmentLoginId', 'establishmentPassword']);
            if (!isValid) {
                return;
            }

            const isLoginIdAvailable = await validateEstablishmentLoginIdAvailability();
            if (!isLoginIdAvailable) {
                return;
            }

            setWizardStep(2);
            setError('');
        } else if (wizardStep === 2) {
            if (selectedEstablishments.length < 2) {
                setError(t('owner.brands.wizard.selectMinLocations'));
                return;
            }
            setError('');
            await fetchEmployeesForMerging(selectedEstablishments);
            setWizardStep(3);
        }
    };

    const handlePrevStep = () => {
        if (wizardStep > 1) {
            setWizardStep(wizardStep - 1);
            setError('');
        }
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setWizardStep(1);
        setSelectedEstablishments([]);
        setSelectedEmployees([]);
        setEmployeesForMerging([]);
        setError('');
        resetLoginIdCheckState();
        clearErrors('establishmentLoginId');
        reset();
    };

    const onCreateBrand = async (data: BrandFormData) => {
        if (selectedEstablishments.length < 2) {
            setError(t('owner.brands.wizard.selectMinLocations'));
            return;
        }

        setIsCreating(true);
        try {
            await api.post('/api/brands', {
                ...data,
                establishmentIds: selectedEstablishments,
                mergeEmployeeIds: selectedEmployees,
            });
            toast.success(t('owner.brands.wizard.createSuccess'));
            handleCloseModal();
            fetchBrands();
            refreshEstablishments();
        } catch (error: any) {
            const message = error.response?.data?.message || t('owner.brands.wizard.createFailed');
            toast.error(message);

            if (typeof message === 'string' && message.toLowerCase().includes('establishment id')) {
                setWizardStep(1);
                setFieldError('establishmentLoginId', { type: 'server', message });
                setLoginIdCheckState('taken');
                setLoginIdCheckMessage(message);
                setError('');
            } else {
                setError(message);
            }
        } finally {
            setIsCreating(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(t('common.language') === 'Arabic' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const hasActiveFilters = searchQuery.trim().length > 0;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] lg:min-h-[400px] space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-paymint-green/20 rounded-full" />
                    <div className="w-16 h-16 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
                </div>
                <p className="text-sm font-bold text-gray-400 tracking-widest">{t('owner.brands.loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('owner.brands.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
                        {t('owner.brands.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {availableEstablishments.length >= 2 && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-[#68B390] transition-all shadow-sm"
                        >
                            <Plus size={18} />
                            <span>{t('owner.brands.createBrand')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: t('owner.brands.activeBrands'), value: stats.totalBrands, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: t('owner.brands.linkedLocations'), value: stats.totalMerged, icon: Link2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: t('owner.brands.availableLocations'), value: stats.availableNodes, icon: Store, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
                        <div className="relative z-10 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300`}>
                                <stat.icon size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 capitalize truncate">{stat.label}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[300px]">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder={t('owner.brands.searchPlaceholder')}
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
                        {/* Sort */}
                        <div className="w-52">
                            <CustomSelect
                                value={sortBy}
                                onChange={(val) => setSortBy(val as SortOption)}
                                options={[
                                    { label: t('common.sortByName'), value: 'name' },
                                    { label: t('common.sortByDate'), value: 'date' },
                                    { label: t('common.sortByLocations'), value: 'locations' },
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Brands Display */}
            {filteredBrands.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Building2 size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {hasActiveFilters ? t('common.noResults') : t('owner.brands.noBrands')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {hasActiveFilters ? t('common.noMatchingResults', { entity: 'brands', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' }) : t('owner.brands.createBrandHint')}
                    </p>
                    {!hasActiveFilters && availableEstablishments.length >= 2 && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-6 px-6 py-3 bg-paymint-green text-black font-bold rounded-xl hover:bg-[#68B390] transition-all shadow-sm flex items-center gap-2 mx-auto"
                        >
                            <Link2 size={18} />
                            {t('owner.brands.createFirstBrand')}
                        </button>
                    )}
                </div>
            ) : (
                /* Grid View (Box View) */
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {paginatedBrands.map((brand) => (
                            <div
                                key={brand.id}
                                className={`group relative bg-white dark:bg-[#1E293B] rounded-2xl border p-6 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${brand.id === 'cmkek5eme0001vjjqvfm3wjwa'
                                    ? 'border-paymint-green bg-paymint-green/[0.02]'
                                    : 'border-gray-200 dark:border-white/5 hover:border-purple-500/30'
                                    }`}
                            >
                                {/* Hover gradient */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                <Building2 size={28} className="text-purple-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">
                                                        {brand.name}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded bg-paymint-green/10 text-paymint-green label-strong">
                                                        {t('common.status.active')}
                                                    </span>
                                                    <span className="dashboard-card-label">
                                                        {t('owner.brands.locationsCount', { count: brand.establishmentCount })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === brand.id ? null : brand.id);
                                                }}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {activeMenu === brand.id && (
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const slug = brand.establishmentLoginId || brand.id;
                                                            window.open(`/brand/${slug}`, '_blank');
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Eye size={16} />
                                                        {t('owner.brands.viewDashboard')}
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenu(null);
                                                            setSecurityModal({
                                                                isOpen: true,
                                                                targetId: brand.id,
                                                                targetName: brand.name,
                                                                mode: 'dissolve-brand'
                                                            });
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                        {t('owner.brands.deleteBrand')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                                        <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl group-hover:border-purple-500/10 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Hash size={14} className="text-purple-500" />
                                                <span className="dashboard-card-label">{t('owner.brands.loginId')}</span>
                                            </div>
                                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white truncate">
                                                {brand.establishmentLoginId}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl group-hover:border-purple-500/10 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar size={14} className="text-blue-500" />
                                                <span className="dashboard-card-label">{t('owner.brands.created')}</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                {formatDate(brand.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Locations */}
                                    <div className="space-y-3 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <span className="dashboard-card-label">{t('owner.brands.locations')}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {brand.establishments.slice(0, 4).map((est) => {
                                                const Icon = getBusinessTypeIcon(est.type);
                                                return (
                                                    <div key={est.id} className="px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-lg flex items-center gap-2 hover:border-purple-500/30 transition-all">
                                                        <Icon size={12} className="text-gray-400" />
                                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{est.name}</span>
                                                    </div>
                                                )
                                            })}
                                            {brand.establishments.length > 4 && (
                                                <div className="px-3 py-2 bg-gray-100 dark:bg-white/5 rounded-lg">
                                                    <span className="dashboard-card-meta">
                                                        +{brand.establishments.length - 4} {t('common.more')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                        <button
                                            onClick={() => {
                                              const slug = brand.establishmentLoginId || brand.id;
                                              window.open(`/brand/${slug}`, '_blank');
                                            }}
                                            className="flex-1 py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 label-strong hover:bg-purple-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn border border-gray-200 dark:border-white/5 hover:border-purple-500 shadow-sm"
                                        >
                                            <span>{t('owner.brands.openDashboard')}</span>
                                            <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Results Summary and Pagination */}
                    <div className="space-y-6 pt-10 border-t border-gray-100 dark:border-white/5">
                        {filteredBrands.length > 0 && (
                            <div className="text-center">
                                <p className="text-base font-bold text-gray-400 tracking-widest flex items-center justify-center">
                                    <span className="font-normal text-sm tracking-normal mr-2">Showing</span>
                                    <span className="text-gray-900 dark:text-white">
                                        {Math.min((currentPage * ITEMS_PER_PAGE), filteredBrands.length)}
                                    </span>
                                    <span className="lowercase font-normal text-sm tracking-normal mx-2">of</span>
                                    <span className="text-gray-900 dark:text-white">{filteredBrands.length}</span>
                                    <span className="lowercase font-normal text-sm tracking-normal ml-2">brands</span>
                                </p>
                            </div>
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                            className="max-w-md mx-auto"
                        />
                    </div>
                </>
            )}

            {/* Create Brand Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 popup-surface flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0a] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10"
                        >
                            {/* Modal Content */}
                            <div className="flex flex-col max-h-[85vh]">
                                {/* Header */}
                                <div className="px-6 pt-6 pb-2 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-sans font-bold text-gray-900 dark:text-white leading-tight">{t('owner.brands.createBrandTitle')}</h2>
                                            <p className="text-xs font-sans font-medium text-gray-500 max-w-[180px] leading-snug">{t('owner.brands.createBrandSubtitle')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 pt-1">
                                        <div className="flex items-center gap-1.5">
                                            {[1, 2, 3].map((step) => (
                                                <div
                                                    key={step}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${wizardStep === step ? 'w-6 bg-paymint-green' : 'w-1.5 bg-gray-200 dark:bg-white/10'}`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={wizardStep === 1 ? handleCloseModal : handlePrevStep}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Wizard Body */}
                                <div className="flex-1 overflow-y-auto px-6 py-2">
                                    {wizardStep === 1 && (
                                        <div className="space-y-4 py-2">
                                            <div className="space-y-1.5">
                                                <label className="text-[13px] font-sans font-bold text-gray-500 ml-0.5">{t('owner.brands.brandName')}</label>
                                                <div className="relative group">
                                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={18} />
                                                    <input
                                                        {...register('name')}
                                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl text-sm font-sans font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/30 transition-all"
                                                        placeholder={t('owner.brands.brandNamePlaceholder')}
                                                    />
                                                </div>
                                                {errors.name && <p className="text-[#ef4444] text-[11px] mt-1 font-bold ml-0.5">{errors.name.message}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[13px] font-sans font-bold text-gray-500 ml-0.5">{t('owner.brands.adminLoginId')}</label>
                                                <div className="relative group">
                                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={18} />
                                                    <input
                                                        {...establishmentLoginIdField}
                                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl text-sm font-sans font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/30 transition-all"
                                                        placeholder={t('owner.brands.adminLoginIdPlaceholder')}
                                                    />
                                                </div>
                                                <p className="text-[11px] font-sans font-medium text-gray-400 mt-1 ml-0.5 leading-relaxed">
                                                    {t('owner.brands.adminLoginIdHint')} {t('owner.brands.validation.loginIdTakenHint', { defaultValue: 'It must be unique across all locations and brands.' })}
                                                </p>
                                                {loginIdCheckState === 'checking' && (
                                                    <p className="mt-1 text-[11px] font-bold text-gray-500 flex items-center gap-1.5 ml-0.5">
                                                        <Loader2 size={10} className="animate-spin" />
                                                        {t('owner.brands.validation.loginIdChecking', { defaultValue: 'Checking availability...' })}
                                                    </p>
                                                )}
                                                {loginIdCheckState === 'available' && !errors.establishmentLoginId && (
                                                    <p className="mt-1 text-[11px] font-bold text-paymint-green flex items-center gap-1.5 ml-0.5">
                                                        <Check size={10} />
                                                        {loginIdCheckMessage || t('owner.brands.validation.loginIdAvailable', { defaultValue: 'This Login ID is available.' })}
                                                    </p>
                                                )}
                                                {errors.establishmentLoginId && <p className="text-[#ef4444] text-[11px] mt-1 font-bold ml-0.5">{errors.establishmentLoginId.message}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[13px] font-sans font-bold text-gray-500 ml-0.5">{t('owner.brands.adminPassword')}</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={18} />
                                                    <input
                                                        {...register('establishmentPassword')}
                                                        type={showPassword ? "text" : "password"}
                                                        className="w-full pl-11 pr-11 py-3 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl text-sm font-sans font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/30 transition-all"
                                                        placeholder="********"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                                {errors.establishmentPassword && <p className="text-[#ef4444] text-[11px] mt-1 font-bold ml-0.5">{errors.establishmentPassword.message}</p>}
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 2 && (
                                        <div className="space-y-4 py-2">
                                            <div className="flex items-center justify-between gap-4">
                                                <h3 className="text-lg font-sans font-bold text-gray-900 dark:text-white leading-tight">
                                                    {t('owner.brands.selectLocationsToLink')}
                                                </h3>
                                                <span className="flex-shrink-0 text-[11px] font-sans font-bold text-paymint-green bg-paymint-green/10 px-2.5 py-1 rounded-full">
                                                    {t('owner.brands.selectedCount', { count: selectedEstablishments.length })}
                                                </span>
                                            </div>

                                            <div className="space-y-2.5">
                                                {availableEstablishments.map((est: any) => {
                                                    const Icon = getBusinessTypeIcon(est.type);
                                                    const isSelected = selectedEstablishments.includes(est.id);
                                                    return (
                                                        <button
                                                            key={est.id}
                                                            type="button"
                                                            onClick={() => toggleEstablishment(est.id)}
                                                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${isSelected
                                                                ? 'border-paymint-green bg-paymint-green/5'
                                                                : 'border-gray-50 dark:border-white/5 bg-white dark:bg-black/10 hover:border-paymint-green/20'
                                                                }`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-paymint-green text-black' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}>
                                                                <Icon size={20} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[13px] font-sans font-bold text-gray-900 dark:text-white truncate">{est.name || est.establishmentName}</p>
                                                                <p className="text-[10px] font-sans font-bold text-gray-400 tracking-wider uppercase mt-0.5">{est.type || t('owner.brands.location')}</p>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-paymint-green border-paymint-green' : 'border-gray-200 dark:border-white/10'}`}>
                                                                {isSelected && <Check size={12} className="text-black" strokeWidth={4} />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 3 && (
                                        <div className="space-y-4 py-2">
                                            <div className="bg-paymint-green/5 border border-paymint-green/10 rounded-2xl p-3 flex gap-3">
                                                <Shield className="text-paymint-green shrink-0" size={18} />
                                                <p className="text-[11px] font-sans font-medium text-gray-500 leading-relaxed">
                                                    {t('owner.brands.wizard.finalStepDesc')}
                                                </p>
                                            </div>

                                            {loadingEmployees ? (
                                                <div className="flex flex-col items-center justify-center py-8">
                                                    <Loader2 className="animate-spin text-paymint-green mb-3" size={28} />
                                                    <p className="text-xs font-sans font-bold text-gray-500">{t('owner.brands.wizard.scanningEmployees')}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {employeesForMerging.map((group) => (group.employees.length > 0 && (
                                                        <div key={group.establishmentId} className="space-y-3">
                                                            <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-[#0a0a0a] z-10 py-1">
                                                                <h4 className="text-[12px] font-sans font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                                    <Store size={14} className="text-paymint-green" />
                                                                    {group.establishmentName}
                                                                </h4>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const allSelected = group.employees.every(e => selectedEmployees.includes(e.employeeId));
                                                                        selectAllFromEstablishment(group, !allSelected);
                                                                    }}
                                                                    className="text-[10px] font-sans font-bold text-paymint-green hover:underline"
                                                                >
                                                                    {group.employees.every(e => selectedEmployees.includes(e.employeeId)) ? t('owner.brands.wizard.deselectAll') : t('owner.brands.wizard.selectAll')}
                                                                </button>
                                                            </div>

                                                            <div className="space-y-2">
                                                                {group.employees.map((emp) => {
                                                                    const isSelected = selectedEmployees.includes(emp.employeeId);
                                                                    return (
                                                                        <button
                                                                            key={`${group.establishmentId}-${emp.employeeId}`}
                                                                            type="button"
                                                                            onClick={() => toggleEmployee(emp.employeeId)}
                                                                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${isSelected
                                                                                ? 'border-paymint-green bg-paymint-green/5'
                                                                                : 'border-gray-50 dark:border-white/5 bg-white dark:bg-black/10 hover:border-paymint-green/20'
                                                                                }`}
                                                                        >
                                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-sans font-bold transition-all ${isSelected ? 'bg-paymint-green text-black' : 'bg-gray-50 dark:bg-white/5 text-gray-500'}`}>
                                                                                {emp.firstName[0].toUpperCase()}{emp.lastName[0].toUpperCase()}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-[13px] font-sans font-bold text-gray-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</p>
                                                                                <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-sans font-bold uppercase border ${getRoleBadgeColor(emp.role)}`}>
                                                                                    {emp.role}
                                                                                </span>
                                                                            </div>
                                                                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-paymint-green border-paymint-green' : 'border-gray-200 dark:border-white/10'}`}>
                                                                                {isSelected && <Check size={12} className="text-black" strokeWidth={4} />}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-6 pt-2 pb-6">
                                    <div className="w-full">
                                        {error && (
                                            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[12px] font-sans font-bold text-center">
                                                {error}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between gap-4">
                                            <button
                                                type="button"
                                                onClick={wizardStep === 1 ? handleCloseModal : handlePrevStep}
                                                className="px-4 py-3 rounded-xl text-sm font-sans font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                                            >
                                                {wizardStep === 1 ? t('common.cancel') : t('common.back')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={wizardStep === 3 ? handleSubmit(onCreateBrand) : handleNextStep}
                                                disabled={isCreating}
                                                className="flex-1 max-w-[180px] py-3 rounded-xl bg-paymint-green text-black font-sans font-bold text-sm hover:bg-paymint-green/90 transition-all shadow-lg shadow-paymint-green/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                            {isCreating ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    {t('common.creating')}
                                                </>
                                            ) : (
                                                <>
                                                    {wizardStep === 3 ? t('owner.brands.createBrand') : t('common.continue')}
                                                    <ChevronRight size={18} />
                                                </>
                                            )}
                                        </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Security Verification Modal */}
            <SecurityVerificationModal
                isOpen={securityModal.isOpen}
                onClose={() => setSecurityModal({ ...securityModal, isOpen: false })}
                onSuccess={() => {
                    fetchBrands();
                    refreshEstablishments();
                }}
                targetId={securityModal.targetId}
                targetName={securityModal.targetName}
                mode={securityModal.mode}
            />
        </div>
    );
}

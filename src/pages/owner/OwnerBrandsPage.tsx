import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Building2,
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
    AlertTriangle
} from 'lucide-react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { BusyOverlay } from '../../components/BusyOverlay';
import { useAuth } from '../../context/AuthContext';
import { getBusinessTypeIcon } from '../../utils/businessTypeIcons';
import { EmptyState, Pagination, Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton, ModalSubmitButton, ModalCloseButton, PageHeader, ListFilterBar, SelectInput, StatCard, StatCardGrid, primaryButtonInlineClass, primaryButtonClass } from '../../components/ui';
import { SectionLoader } from '../../components/LoadingState';
import { formatInputPlaceholder, formatInputLabel } from '../../utils/textCase';
import { getPersonInitials, getPersonDisplayName } from '../../utils/personName';
import { getPasswordSchema } from '../../utils/validation';
import { biIcon } from '../../components/ui/BiIcon';

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
    const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
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
        establishmentPassword: getPasswordSchema(t),
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
                headers: { 'X-Skip-Establishment-Header': 'true' },
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

    const filteredBrands = useMemo(() => {
        let result = [...brands];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(brand =>
                brand.name.toLowerCase().includes(query) ||
                brand.establishmentLoginId.toLowerCase().includes(query)
            );
        }

        result.sort((a, b) => {
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
                return 'bg-stone-500/10 text-stone-600 dark:text-zinc-300 border-stone-500/20';
            case 'CASHIER':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'WAITER':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'ADMIN':
                return 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20';
            default:
                return 'bg-stone-500/10 text-stone-500 border-stone-500/20';
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
            <SectionLoader
                message={t('owner.brands.loading')}
                minHeightClassName="min-h-[300px] lg:min-h-[400px]"
            />
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            {/* Full-screen blocker while data loads, so no second action can
                be stacked on an in-flight request. */}
            <BusyOverlay visible={isLoading} />
            {/* Header */}
            <PageHeader
                title={t('owner.brands.title')}
                subtitle={t('owner.brands.subtitle')}
                actions={
                    <>
                    <button
                        onClick={() => {
                            if (availableEstablishments.length < 2) {
                                setShowDisclaimerModal(true);
                            } else {
                                setShowCreateModal(true);
                            }
                        }}
                        className={`${primaryButtonInlineClass} w-full justify-center sm:w-auto`}
                    >
                        <Plus size={15} strokeWidth={2} className="shrink-0" />
                        <span className="truncate">{t('owner.brands.createBrand')}</span>
                    </button>
                    </>
                }
            />

            {/* Stats Grid */}
            <StatCardGrid columns={3}>
                {[
                    { label: t('owner.brands.activeBrands'), value: brands.length, icon: biIcon('bi-collection') },
                    { label: t('owner.brands.linkedLocations'), value: brands.reduce((acc, b) => acc + b.establishmentCount, 0), icon: biIcon('bi-diagram-3') },
                    { label: t('owner.brands.availableLocations'), value: availableEstablishments.length, icon: biIcon('bi-geo-alt') },
                ].map((stat, i) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        isInteger={true}
                        icon={stat.icon}
                        iconTone="green"
                        delay={i * 0.05}
                    />
                ))}
            </StatCardGrid>

            {/* Filters Bar */}
            <ListFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                onSearchClear={() => setSearchQuery('')}
                searchPlaceholder={formatInputPlaceholder(t('owner.brands.searchPlaceholder'), t('common.locale'))}
            >
                {/* Sort */}
                <div className="w-full sm:w-52">
                    <SelectInput
                        value={sortBy}
                        onChange={(val) => setSortBy((val as SortOption) || 'name')}
                        options={[
                            { label: t('common.sortByName'), value: 'name' },
                            { label: t('common.sortByDate'), value: 'date' },
                            { label: t('common.sortByLocations'), value: 'locations' },
                        ]}
                        showAllOption={false}
                        searchable={false}
                    />
                </div>
            </ListFilterBar>

            {/* Brands Display */}
            {filteredBrands.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title={hasActiveFilters ? t('common.noResults') : t('owner.brands.noBrands')}
                    description={hasActiveFilters ? t('common.noMatchingResults', { entity: 'brands', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' }) : t('owner.brands.createBrandHint')}
                    action={
                        !hasActiveFilters ? (
                            <button
                                onClick={() => {
                                    if (availableEstablishments.length < 2) {
                                        setShowDisclaimerModal(true);
                                    } else {
                                        setShowCreateModal(true);
                                    }
                                }}
                                className={`${primaryButtonInlineClass} mx-auto mt-6`}
                            >
                                <Link2 size={18} />
                                {t('owner.brands.createFirstBrand')}
                            </button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="p-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {paginatedBrands.map((brand) => (
                                <div
                                    key={brand.id}
                                    className={`group relative bg-white dark:bg-zinc-900/60 rounded-2xl border p-5 shadow-sm transition-colors overflow-hidden ${brand.id === 'cmkek5eme0001vjjqvfm3wjwa'
                                        ? 'border-mintcom-green bg-mintcom-green/[0.02]'
                                        : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="relative z-10">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                                                    <Building2 size={19} strokeWidth={1.75} />
                                                </span>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-barlow text-[17px] font-bold tracking-tight text-stone-900 dark:text-zinc-100">
                                                            {brand.name}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded bg-mintcom-green/10 text-mintcom-green label-strong">
                                                            {t('common.status.active')}
                                                        </span>
                                                        <div className="dashboard-card-label flex items-center gap-1">
                                                            {t('owner.brands.locationsCount', { count: brand.establishmentCount })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenu(brand.id === activeMenu ? null : brand.id);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 transition-colors"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {activeMenu === brand.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900/60 rounded-xl border border-stone-200 dark:border-zinc-800 shadow-xl z-50 overflow-hidden">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const slug = brand.establishmentLoginId || brand.id;
                                                                window.open(`/brand/${slug}`, '_blank');
                                                            }}
                                                            className="w-full px-4 py-3 text-left text-sm font-medium text-stone-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 flex items-center gap-3 transition-colors"
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
                                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4 mb-6 relative z-10">
                                            <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Hash size={14} className="text-stone-400" />
                                                    <span className="dashboard-card-label">{t('owner.brands.loginId')}</span>
                                                </div>
                                                <p className="text-sm font-mono font-bold text-stone-900 dark:text-zinc-100 truncate">
                                                    {brand.establishmentLoginId}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar size={14} className="text-stone-400" />
                                                    <span className="dashboard-card-label">{t('owner.brands.created')}</span>
                                                </div>
                                                <p className="text-sm font-bold text-stone-900 dark:text-zinc-100">
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
                                                        <div key={est.id} className="px-3 py-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-lg flex items-center gap-2 hover:border-stone-300 dark:hover:border-zinc-700 transition-colors">
                                                            <Icon size={12} className="text-stone-400" />
                                                            <span className="text-xs font-bold text-stone-600 dark:text-stone-400 truncate max-w-[100px]">{est.name}</span>
                                                        </div>
                                                    )
                                                })}
                                                {brand.establishments.length > 4 && (
                                                    <div className="px-3 py-2 bg-stone-100 dark:bg-zinc-800 rounded-lg">
                                                        <span className="dashboard-card-meta">
                                                            +{brand.establishments.length - 4} {t('common.more')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="mt-6 pt-6 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between">
                                            <button
                                                onClick={() => {
                                                    const slug = brand.establishmentLoginId || brand.id;
                                                    window.open(`/brand/${slug}`, '_blank');
                                                }}
                                                className={`${primaryButtonClass} flex-1`}
                                            >
                                                <span>{t('owner.brands.openDashboard')}</span>
                                                <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                        variant="footer"
                        totalItems={filteredBrands.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                </div>
            )}

            {/* Create Brand Modal */}
            <Modal isOpen={showCreateModal} onClose={handleCloseModal} size="lg">
                <ModalHeader
                    title={t('owner.brands.createBrandTitle')}
                    subtitle={t('owner.brands.createBrandSubtitle')}
                    icon={<Building2 size={24} />}
                    onClose={handleCloseModal}
                />

                <ModalBody>
                    {/* Wizard progress + back */}
                    <div className="flex items-center justify-end gap-4 mb-4">
                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3].map((step) => (
                                <div
                                    key={step}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${wizardStep === step ? 'w-8 bg-mintcom-green' : 'w-2 bg-stone-200 dark:bg-zinc-800'}`}
                                />
                            ))}
                        </div>
                        {wizardStep > 1 && (
                            <button
                                onClick={handlePrevStep}
                                className="p-1.5 hover:bg-stone-100 dark:hover:bg-zinc-700 rounded-lg text-stone-400 transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                    </div>
                                        {wizardStep === 1 && (
                                        <div className="space-y-6 py-2">
                                            <div className="space-y-2">
                                                <label className="text-[15px] font-sans font-normal text-stone-500 ml-1">{formatInputLabel(t('owner.brands.brandName'), t('common.locale'))}</label>
                                                <div className="relative group">
                                                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors" size={20} />
                                                    <input maxLength={255}
                                                        {...register('name')}
                                                        className="w-full pl-14 pr-5 py-4.5 bg-white dark:bg-zinc-900/60 border border-transparent focus:border-mintcom-green/30 rounded-2xl text-[15px] font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 transition-all h-[60px]"
                                                        placeholder={formatInputPlaceholder(t('owner.brands.brandNamePlaceholder'), t('common.locale'))}
                                                    />
                                                </div>
                                                {errors.name && <p className="text-red-500 text-[12px] mt-1 font-bold ml-1">{errors.name.message}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[15px] font-sans font-normal text-stone-500 ml-1">{formatInputLabel(t('owner.brands.adminLoginId'), t('common.locale'))}</label>
                                                <div className="relative group">
                                                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors" size={20} />
                                                    <input maxLength={255}
                                                        {...establishmentLoginIdField}
                                                        className="w-full pl-14 pr-5 py-4.5 bg-white dark:bg-zinc-900/60 border border-transparent focus:border-mintcom-green/30 rounded-2xl text-[15px] font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 transition-all h-[60px]"
                                                        placeholder={formatInputPlaceholder(t('owner.brands.adminLoginIdPlaceholder'), t('common.locale'))}
                                                    />
                                                </div>
                                                <p className="text-[12px] font-sans font-medium text-stone-400 mt-2 ml-1 leading-relaxed opacity-80">
                                                    {t('owner.brands.adminLoginIdHint')}
                                                </p>
                                                {loginIdCheckState === 'checking' && (
                                                    <p className="mt-1 text-[12px] font-bold text-stone-500 flex items-center gap-1.5 ml-1">
                                                        <Loader2 size={12} className="animate-spin" />
                                                        {t('owner.brands.validation.loginIdChecking', { defaultValue: 'Checking availability...' })}
                                                    </p>
                                                )}
                                                {loginIdCheckState === 'available' && !errors.establishmentLoginId && (
                                                    <p className="mt-1 text-[12px] font-bold text-mintcom-green flex items-center gap-1.5 ml-1">
                                                        <Check size={12} />
                                                        {loginIdCheckMessage}
                                                    </p>
                                                )}
                                                {errors.establishmentLoginId && <p className="text-red-500 text-[12px] mt-1 font-bold ml-1">{errors.establishmentLoginId.message}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[15px] font-sans font-normal text-stone-500 ml-1">{formatInputLabel(t('owner.brands.adminPassword'), t('common.locale'))}</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors" size={20} />
                                                    <input maxLength={255}
                                                        {...register('establishmentPassword')}
                                                        type={showPassword ? "text" : "password"}
                                                        className="w-full pl-14 pr-14 py-4.5 bg-white dark:bg-zinc-900/60 border border-transparent focus:border-mintcom-green/30 rounded-2xl text-[15px] font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 transition-all h-[60px]"
                                                        placeholder={formatInputPlaceholder("********", t('common.locale'))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1"
                                                    >
                                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                                {errors.establishmentPassword && <p className="text-red-500 text-[12px] mt-1 font-bold ml-1">{errors.establishmentPassword.message}</p>}
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 2 && (
                                        <div className="space-y-6 py-2">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-sans font-bold text-stone-900 dark:text-zinc-100 leading-tight">
                                                        {t('owner.brands.selectLocationsToLink')}
                                                    </h3>
                                                    <p className="text-sm text-stone-500 font-sans font-medium">
                                                        (These are the unlinked locations to add, any locations not listed here are already included in other brand groups)
                                                    </p>
                                                </div>
                                                <span className="flex-shrink-0 text-[13px] font-sans font-bold text-mintcom-green bg-mintcom-green/10 px-3 py-1.5 rounded-full">
                                                    {t('owner.brands.selectedCount', { count: selectedEstablishments.length })}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {availableEstablishments.map((est: any) => {
                                                    const Icon = getBusinessTypeIcon(est.type);
                                                    const isSelected = selectedEstablishments.includes(est.id);
                                                    return (
                                                        <button
                                                            key={est.id}
                                                            type="button"
                                                            onClick={() => toggleEstablishment(est.id)}
                                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${isSelected
                                                                ? 'border-mintcom-green bg-mintcom-green/5'
                                                                : 'border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-mintcom-green/20'
                                                                }`}
                                                        >
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-mintcom-green text-black' : 'bg-white dark:bg-zinc-800 text-stone-400'}`}>
                                                                <Icon size={24} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[15px] font-sans font-bold text-stone-900 dark:text-zinc-100 truncate">{est.name || est.establishmentName}</p>
                                                                <p className="text-[11px] font-sans font-bold text-stone-400 tracking-wider uppercase mt-0.5">{est.type || t('owner.brands.location')}</p>
                                                            </div>
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-mintcom-green border-mintcom-green' : 'border-stone-300 dark:border-zinc-800'}`}>
                                                                {isSelected && <Check size={14} className="text-black" strokeWidth={4} />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 3 && (
                                        <div className="space-y-6 py-2">
                                            <div className="bg-mintcom-green/5 border border-mintcom-green/10 rounded-2xl p-5 flex gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center shrink-0">
                                                    <Shield className="text-mintcom-green" size={20} />
                                                </div>
                                                <p className="text-[13px] font-sans font-medium text-stone-500 leading-relaxed">
                                                    {t('owner.brands.wizard.finalStepDesc')}
                                                </p>
                                            </div>

                                            {loadingEmployees ? (
                                                <div className="flex flex-col items-center justify-center py-12">
                                                    <Loader2 className="animate-spin text-mintcom-green mb-4" size={32} />
                                                    <p className="text-[15px] font-sans font-bold text-stone-500">{t('owner.brands.wizard.scanningEmployees')}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-8">
                                                    {employeesForMerging.map((group) => (group.employees.length > 0 && (
                                                        <div key={group.establishmentId} className="space-y-4">
                                                            <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900/60 z-10 py-2">
                                                                <h4 className="text-[14px] font-sans font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-xl bg-mintcom-green/10 flex items-center justify-center">
                                                                        <Store size={16} className="text-mintcom-green" />
                                                                    </div>
                                                                    {group.establishmentName}
                                                                </h4>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const allSelected = group.employees.every(e => selectedEmployees.includes(e.employeeId));
                                                                        selectAllFromEstablishment(group, !allSelected);
                                                                    }}
                                                                    className="text-[12px] font-sans font-bold text-mintcom-green hover:underline px-2 py-1"
                                                                >
                                                                    {group.employees.every(e => selectedEmployees.includes(e.employeeId)) ? t('owner.brands.wizard.deselectAll') : t('owner.brands.wizard.selectAll')}
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-3">
                                                                {group.employees.map((emp) => {
                                                                    const isSelected = selectedEmployees.includes(emp.employeeId);
                                                                    return (
                                                                        <button
                                                                            key={`${group.establishmentId}-${emp.employeeId}`}
                                                                            type="button"
                                                                            onClick={() => toggleEmployee(emp.employeeId)}
                                                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${isSelected
                                                                                ? 'border-mintcom-green bg-mintcom-green/5'
                                                                                : 'border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-mintcom-green/20'
                                                                                }`}
                                                                        >
                                                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[14px] font-sans font-bold transition-all ${isSelected ? 'bg-mintcom-green text-black' : 'bg-stone-100 dark:bg-zinc-800 text-stone-500'}`}>
                                                                                {getPersonInitials(emp)}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-[15px] font-sans font-bold text-stone-900 dark:text-zinc-100 truncate">{getPersonDisplayName(emp, t('common.unknown'))}</p>
                                                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-sans font-bold uppercase border ${getRoleBadgeColor(emp.role)}`}>
                                                                                    {emp.role}
                                                                                </span>
                                                                            </div>
                                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-mintcom-green border-mintcom-green' : 'border-stone-200 dark:border-zinc-800'}`}>
                                                                                {isSelected && <Check size={14} className="text-black" strokeWidth={4} />}
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

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] font-sans font-bold text-center">
                            {error}
                        </div>
                    )}
                </ModalBody>

                <ModalFooter>
                    <ModalCancelButton onClick={wizardStep === 1 ? handleCloseModal : handlePrevStep}>
                        {wizardStep === 1 ? t('common.cancel') : t('common.back')}
                    </ModalCancelButton>
                    <ModalSubmitButton
                        type="button"
                        onClick={wizardStep === 3 ? handleSubmit(onCreateBrand) : handleNextStep}
                        disabled={isCreating}
                    >
                        {isCreating ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                {t('common.creating')}
                            </>
                        ) : (
                            <>
                                <span>{wizardStep === 3 ? t('owner.brands.createBrand') : t('common.continue')}</span>
                                <ChevronRight size={18} strokeWidth={3} />
                            </>
                        )}
                    </ModalSubmitButton>
                </ModalFooter>
            </Modal>
            
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

            {/* Disclaimer Modal */}
            <Modal isOpen={showDisclaimerModal} onClose={() => setShowDisclaimerModal(false)} size="sm">
                <ModalCloseButton onClose={() => setShowDisclaimerModal(false)} autoPositionAbsolute />
                <ModalBody>
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm">
                            <AlertTriangle size={40} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-sans font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                                {t('owner.brands.disclaimerTitle')}
                            </h2>
                            <p className="text-[15px] font-sans font-medium text-stone-500">
                                {establishments.length < 2
                                    ? t('owner.brands.disclaimerNotEnoughLocations')
                                    : t('owner.brands.disclaimerSubtitle')
                                }
                            </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-900/60 rounded-2xl p-6 border border-stone-100 dark:border-zinc-800">
                            <p className="text-[14px] font-sans font-medium text-stone-600 dark:text-stone-400 leading-relaxed">
                                {establishments.length < 2
                                    ? t('owner.brands.disclaimerNoLocations')
                                    : t('owner.brands.disclaimerDesc')
                                }
                            </p>
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <ModalSubmitButton type="button" onClick={() => setShowDisclaimerModal(false)}>
                        {t('owner.brands.disclaimerAction')}
                    </ModalSubmitButton>
                </ModalFooter>
            </Modal>
        </div>
    );
}

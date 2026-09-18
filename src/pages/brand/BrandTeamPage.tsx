import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
    Users,
    MapPin,
    UserPlus,
    Mail,
    AtSign,
    Edit2,
    Trash2,
    X,
    MoreVertical,
    AlertTriangle
} from 'lucide-react';
import { biIcon } from '../../components/ui/BiIcon';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { EmployeeFormModal } from '../../components/forms/EmployeeFormModal';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, Pagination, Modal, ModalBody, ModalFooter, ModalCancelButton, ModalCloseButton, PageHeader, Badge, ListFilterBar, SelectInput, StatCard, StatCardGrid, primaryButtonInlineClass } from '../../components/ui';
import { AppStrings } from '../../constants/AppStrings';
import { SectionLoader } from '../../components/LoadingState';
import { formatInputPlaceholder } from '../../utils/textCase';
import { StatValue } from '../../components/ui/StatValue';
import { StepUpVerifier } from '../../components/StepUpVerifier';
import { reauthHeaders } from '../../services/stepUp';

interface Employee {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string | null;
    emailVerified?: boolean;
    phone?: string;
    isActive: boolean;
    createdAt?: string;
    establishments: {
        id: string;
        name: string;
        role: string;
    }[];
}

type ViewMode = 'grid' | 'list';
type RoleFilter = 'all' | 'ADMIN' | 'CASHIER';
type SortOption = 'name' | 'role' | 'locations';
// Employees can be created without a name; fall back to the username.
const getDisplayName = (emp: { firstName?: string; lastName?: string; username?: string }) =>
    `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username || '';

const getDisplayInitial = (emp: { firstName?: string; username?: string }) =>
    (emp.firstName?.trim()?.charAt(0) || emp.username?.trim()?.charAt(0) || '?').toUpperCase();

const MAX_EMPLOYEES_PER_ACCOUNT = 50;
const EMPLOYEE_LIMIT_POPUP_MESSAGE =
    `Maximum is ${MAX_EMPLOYEES_PER_ACCOUNT} employees.\n` +
    `To add more than ${MAX_EMPLOYEES_PER_ACCOUNT} employees, contact Mintcom support at info@mintcompos.com with your account email. Never send your password to support.`;

export default function BrandTeamPage() {
    const { t } = useTranslation();
    const { brandId: paramBrandId } = useParams<{ brandId: string }>();
    const context = useOutletContext<{ brand: any }>() || {};
    const brandId = context.brand?.id || paramBrandId;
    const { establishments } = useAuth();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [brandName, setBrandName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [locationFilter, setLocationFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const fetchBrandInfo = useCallback(async () => {
        try {
            const response = await api.get(`/api/brands/${brandId}`);
            setBrandName(response.data?.name || t('brand.dashboard.title'));
        } catch (err) {
            console.error('Failed to fetch brand info:', err);
        }
    }, [brandId, t]);

    const fetchEmployees = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const response = await api.get(`/api/brands/${brandId}/employees`);
            const nextEmployees: Employee[] = response.data || [];
            setEmployees(nextEmployees);
            setEditingEmployee((current) => {
                if (!current?.id) return current;
                const refreshed = nextEmployees.find((emp) => emp.id === current.id);
                return refreshed || current;
            });
        } catch (err) {
            console.error('Failed to fetch employees:', err);
            toast.error(t('owner.staff.syncError'));
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [brandId, t]);

    useEffect(() => {
        if (brandId) {
            fetchEmployees();
            fetchBrandInfo();
        }
    }, [brandId, fetchEmployees, fetchBrandInfo]);

    const handleEmployeeSubmit = async (data: any) => {
        try {
            if (!editingEmployee && employees.length >= MAX_EMPLOYEES_PER_ACCOUNT) {
                window.alert(EMPLOYEE_LIMIT_POPUP_MESSAGE);
                return;
            }
            if (editingEmployee) {
                await api.put(`/api/accounts/employees/${editingEmployee.id}`, data);
                toast.success(t('common.success'));
            } else {
                await api.post('/api/accounts/employees', data);
                toast.success(t('common.success'));
            }
            setIsFormModalOpen(false);
            setEditingEmployee(null);
            fetchEmployees();
        } catch (error: any) {
            const backendMessage = error?.response?.data?.message;
            if (
                typeof backendMessage === 'string' &&
                backendMessage.toLowerCase().includes('maximum is 50 employees')
            ) {
                window.alert(backendMessage);
                throw error;
            }
            toast.error(error.response?.data?.message || t('common.error'));
            throw error; // Re-throw to let the modal know it failed
        }
    };

    const handleEditEmployee = async (emp: Employee) => {
        try {
            const response = await api.get('/api/accounts/all-employees');
            const allEmployees = Array.isArray(response.data) ? response.data : [];
            const fullEmployee = allEmployees.find((entry: any) => entry.id === emp.id || entry.username === emp.username);
            setEditingEmployee((fullEmployee || emp) as Employee);
            setIsFormModalOpen(true);
        } catch (error) {
            console.error('Failed to load full employee record for editing:', error);
            toast.error(t('owner.staff.syncError'));
        } finally {
            setActiveMenu(null);
        }
    };

    const handleAddEmployee = () => {
        if (employees.length >= MAX_EMPLOYEES_PER_ACCOUNT) {
            window.alert(EMPLOYEE_LIMIT_POPUP_MESSAGE);
            return;
        }
        setEditingEmployee(null);
        setIsFormModalOpen(true);
    };

    const openDeleteModal = (emp: Employee) => {
        setEmployeeToDelete(emp);
        setDeleteError('');
        setDeleteModalOpen(true);
        setActiveMenu(null);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setEmployeeToDelete(null);
        setDeleteError('');
    };

    /**
     * Runs once StepUpVerifier has produced a single-use reauth token. The
     * proof already establishes the owner is present, so no credential travels
     * with the request itself.
     */
    const confirmDelete = async (reauthToken: string) => {
        if (!employeeToDelete) return;

        setIsDeleting(true);
        setDeleteError('');

        try {
            await api.delete(`/api/brands/${brandId}/employees/${employeeToDelete.id}/brand-access`, {
                headers: reauthHeaders(reauthToken)
            });
            toast.success(t('brand.team.removeAccessSuccess', 'Brand access removed'));
            closeDeleteModal();
            fetchEmployees();
        } catch (error: any) {
            setDeleteError(error.response?.data?.message || t('owner.staff.incorrectPassword'));
        } finally {
            setIsDeleting(false);
        }
    };

    // Get unique locations for filter
    const locations = useMemo(() => {
        const locSet = new Map<string, string>();
        employees.forEach(emp => {
            emp.establishments.forEach(est => {
                locSet.set(est.id, est.name);
            });
        });
        return Array.from(locSet.entries()).map(([id, name]) => ({ id, name }));
    }, [employees]);

    // Filtered and sorted employees
    const filteredEmployees = useMemo(() => {
        let result = [...employees];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(emp =>
                emp.firstName.toLowerCase().includes(query) ||
                emp.lastName.toLowerCase().includes(query) ||
                emp.username.toLowerCase().includes(query) ||
                emp.email?.toLowerCase().includes(query)
            );
        }

        // Apply role filter
        if (roleFilter !== 'all') {
            result = result.filter(emp =>
                emp.establishments.some(est => est.role === roleFilter)
            );
        }

        // Apply location filter
        if (locationFilter !== 'all') {
            result = result.filter(emp =>
                emp.establishments.some(est => est.id === locationFilter)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name': {
                    comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                    break;
                }
                case 'role': {
                    const roleA = a.establishments[0]?.role || '';
                    const roleB = b.establishments[0]?.role || '';
                    comparison = roleA.localeCompare(roleB);
                    break;
                }
                case 'locations': {
                    comparison = a.establishments.length - b.establishments.length;
                    break;
                }
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [employees, searchQuery, roleFilter, locationFilter, sortBy, sortOrder]);

    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredEmployees, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter, locationFilter, sortBy, sortOrder]);

    // Stats calculations
    const stats = useMemo(() => {
        return {
            total: employees.length,
            users: employees.filter(e => e.establishments.some(est => est.role !== 'ADMIN')).length,
            admins: employees.filter(e => e.establishments.some(est => est.role === 'ADMIN')).length,
        };
    }, [employees]);

    const getRoleDisplay = (role: string) => {
        // Map all roles to Admin or User
        return role.toUpperCase() === 'ADMIN' ? t('staff.roles.admin') : t('staff.roles.user');
    };

    const getRoleBadgeTone = (role: string): 'green' | 'blue' => {
        if (role.toUpperCase() === 'ADMIN') {
            return 'green';
        }
        return 'blue';
    };

    const clearFilters = () => {
        setSearchQuery('');
        setRoleFilter('all');
        setLocationFilter('all');
        setSortBy('name');
        setSortOrder('asc');
    };

    const hasSearch = searchQuery.trim().length > 0;
    const hasActiveFilters = hasSearch || roleFilter !== 'all' || locationFilter !== 'all';
    const hasOnlyFilters = !hasSearch && (roleFilter !== 'all' || locationFilter !== 'all');
    const hasFilters = roleFilter !== 'all' || locationFilter !== 'all';

    if (isLoading) {
        return <SectionLoader message={t('owner.staff.loading')} />;
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <PageHeader
                title={t('owner.staff.title')}
                subtitle={
                    <>
                        <span>{t('owner.staff.subtitle')}</span>
                        {brandName && (
                            <Badge>{brandName}</Badge>
                        )}
                    </>
                }
                actions={
                    <>
                    <button
                        onClick={handleAddEmployee}
                        className={primaryButtonInlineClass}
                    >
                        <UserPlus size={18} strokeWidth={2.5} />
                        <span>{t('staff.newEmployee')}</span>
                    </button>
                    </>
                }
            />

            {/* Stats Grid */}
            <StatCardGrid columns={3}>
                {[
                    { label: t('owner.staff.totalUsers'), value: stats.total, icon: biIcon('bi-people') },
                    { label: t('staff.roles.user'), value: stats.users, icon: biIcon('bi-person-check') },
                    { label: t('owner.staff.admins'), value: stats.admins, icon: biIcon('bi-shield-check') },
                ].map((stat, i) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        delay={i * 0.05}
                    />
                ))}
            </StatCardGrid>

            {/* Filters Bar */}
            <ListFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                onSearchClear={() => setSearchQuery('')}
                searchPlaceholder={formatInputPlaceholder(t('owner.staff.searchPlaceholder'), t('common.locale'))}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            >
                {/* Role Filter */}
                <div className="w-full sm:w-36">
                    <SelectInput
                        value={roleFilter === 'all' ? null : roleFilter}
                        onChange={(val) => setRoleFilter((val as RoleFilter) || 'all')}
                        options={[
                            { label: t('staff.roles.admin'), value: 'ADMIN' },
                            { label: t('staff.roles.user'), value: 'CASHIER' },
                        ]}
                        allOptionLabel={t('owner.staff.allRoles')}
                        placeholder={t('owner.staff.allRoles')}
                        searchable={false}
                    />
                </div>
                {/* Location Filter */}
                {locations.length > 1 && (
                    <div className="w-full sm:w-44">
                        <SelectInput
                            value={locationFilter === 'all' ? null : locationFilter}
                            onChange={(val) => setLocationFilter(val || 'all')}
                            options={[
                                ...locations.map(loc => ({ label: loc.name, value: loc.id }))
                            ]}
                            allOptionLabel={t('owner.staff.allLocations')}
                            placeholder={t('owner.staff.allLocations')}
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
                            { label: t('common.sortByRole'), value: 'role' },
                            { label: t('common.sortByLocations'), value: 'locations' },
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

            {/* Team Display */}
                        {filteredEmployees.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                title={hasSearch ? t('common.noResults') : hasOnlyFilters ? t('common.noFilteredResults') : t('owner.staff.noStaffFound')}
                                description={
                                    hasSearch
                                        ? t('common.noMatchingResults', { entity: 'staff', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' })
                                        : hasOnlyFilters
                                            ? t('common.noFilteredResultsDesc')
                                            : t('owner.staff.addStaffDesc')
                                }
                                action={
                                    hasActiveFilters ? (
                                        <button
                                            onClick={clearFilters}
                                            className={`${primaryButtonInlineClass} mt-4`}
                                        >
                                            {t('attributes.filters.reset')}
                                        </button>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                {viewMode === 'grid' ? (
                                    /* Grid View */
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                                        {paginatedEmployees.map((emp) => (
                                            <div
                                                key={emp.id}
                                                className="group relative bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 hover:border-mintcom-green/50 p-6 transition-all shadow-sm hover:shadow-lg overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-mintcom-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                                {/* Header */}
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 flex items-center justify-center relative flex-shrink-0">
                                                            <span className="text-stone-900 dark:text-zinc-100 font-bold text-xl">
                                                                {getDisplayInitial(emp)}
                                                            </span>
                                                            {emp.isActive && (
                                                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-mintcom-green rounded-full border-2 border-white dark:border-zinc-900" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100 leading-tight">
                                                                {getDisplayName(emp)}
                                                            </h3>
                                                            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                                                                <AtSign size={12} />
                                                                {emp.username}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveMenu(activeMenu === emp.id ? null : emp.id);
                                                            }}
                                                            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 dark:text-zinc-500 transition-colors"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>

                                                        {activeMenu === emp.id && (
                                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl border border-stone-200 dark:border-zinc-700 shadow-xl z-50 overflow-hidden"
                                                            >
                                                                <button
                                                                    onClick={() => handleEditEmployee(emp)}
                                                                    className="w-full px-4 py-3 text-left text-sm font-medium text-stone-700 dark:text-zinc-300 hover:bg-stone-50/80 dark:hover:bg-zinc-700 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <Edit2 size={16} />
                                                                    {t('common.edit')}
                                                                </button>
                                                                <button
                                                                    onClick={() => openDeleteModal(emp)}
                                                                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                    {t('brand.team.removeAccessAction', 'Remove brand access')}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="mb-4">
                                                    <Badge tone={emp.isActive ? 'green' : 'gray'}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-mintcom-green' : 'bg-stone-400 dark:bg-zinc-500'}`} />
                                                        {emp.isActive ? AppStrings.STATUS.ACTIVE : AppStrings.STATUS.INACTIVE}
                                                    </Badge>
                                                </div>

                                                {/* Contact Info */}
                                                <div className="space-y-3 mb-6">
                                                    {emp.email && (
                                                        <div className="flex items-center gap-3 p-3 bg-stone-100 dark:bg-zinc-800 rounded-xl">
                                                            <Mail size={16} className="text-stone-400 dark:text-zinc-500" />
                                                            <span className="text-xs font-bold text-stone-600 dark:text-zinc-300 truncate">{emp.email}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Access Rights */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="dashboard-card-label uppercase">{t('owner.staff.accessRights')}</p>
                                                        <span className="text-sm font-bold text-stone-900 dark:text-zinc-100">{emp.establishments.length} {emp.establishments.length !== 1 ? t('common.locations') : t('common.location')}</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {emp.establishments.slice(0, 2).map((est, eIdx) => (
                                                            <div
                                                                key={eIdx}
                                                                className="flex items-center justify-between p-3 bg-stone-100 dark:bg-zinc-800 rounded-xl border border-stone-200 dark:border-zinc-700"
                                                            >
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <MapPin size={14} className="text-stone-400 dark:text-zinc-500 flex-shrink-0" />
                                                                    <span className="text-xs font-bold text-stone-900 dark:text-zinc-100 truncate">
                                                                        {est.name}
                                                                    </span>
                                                                </div>
                                                                <Badge tone={getRoleBadgeTone(est.role)}>
                                                                    {getRoleDisplay(est.role)}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                        {emp.establishments.length > 2 && (
                                                            <div className="text-center py-1">
                                                                <span className="dashboard-card-meta">+ {emp.establishments.length - 2} more locations</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-stone-200 dark:border-zinc-800">
                                                    <button
                                                        onClick={() => handleEditEmployee(emp)}
                                                        className="flex-1 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 label-strong hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 border border-stone-200 dark:border-zinc-700"
                                                    >
                                                        <Edit2 size={14} />
                                                        {t('common.edit')}
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(emp)}
                                                        className="p-2.5 rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-100 dark:border-red-500/20"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* List View */
                                    <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                                        {/* Mobile Card View */}
                                        <div className="md:hidden divide-y divide-stone-100 dark:divide-zinc-800">
                                            {paginatedEmployees.map((emp) => (
                                                <div
                                                    key={emp.id}
                                                    className="p-4 hover:bg-stone-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center relative">
                                                            <span className="text-stone-900 dark:text-zinc-100 font-bold text-sm">
                                                                {getDisplayInitial(emp)}
                                                            </span>
                                                            {emp.isActive && (
                                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-mintcom-green rounded-full border-2 border-white dark:border-zinc-900" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                                                                {getDisplayName(emp)}
                                                            </h3>
                                                            <p className="dashboard-card-meta mt-0.5">@{emp.username}</p>
                                                        </div>
                                                        <div className="ml-auto flex gap-2">
                                                            <button
                                                                onClick={() => handleEditEmployee(emp)}
                                                                className="p-2 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(emp)}
                                                                className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                        <div className="p-2 rounded-lg bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
                                                            <p className="text-stone-500 dark:text-zinc-400 mb-1">{t('common.role')}</p>
                                                            <Badge tone={getRoleBadgeTone(emp.establishments[0]?.role || 'USER')}>
                                                                {getRoleDisplay(emp.establishments[0]?.role || 'USER')}
                                                            </Badge>
                                                        </div>
                                                        <div className="p-2 rounded-lg bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
                                                            <p className="text-stone-500 dark:text-zinc-400 mb-1">{t('brand.dashboard.locations')}</p>
                                                            <span className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                                                                {emp.establishments.length} {t('brand.dashboard.locations')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table Header */}
                                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-stone-50/60 dark:bg-zinc-800/40 border-b border-stone-200 dark:border-zinc-800 table-header-row">
                                            <div className="col-span-4">{t('common.name')}</div>
                                            <div className="col-span-2 text-center">{t('common.status.label')}</div>
                                            <div className="col-span-2 text-center">{t('common.role')}</div>
                                            <div className="col-span-2 text-center">{t('common.locations')}</div>
                                            <div className="col-span-2 text-center">{t('common.actions')}</div>
                                        </div>

                                        {/* Table Body */}
                                        <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                                            {paginatedEmployees.map((emp) => (
                                                <div
                                                    key={emp.id}
                                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-stone-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                                                    onClick={() => handleEditEmployee(emp)}
                                                >

                                                    {/* Member Info */}
                                                    <div className="col-span-4 flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center relative">
                                                            <span className="text-stone-900 dark:text-zinc-100 font-bold text-sm">
                                                                {getDisplayInitial(emp)}
                                                            </span>
                                                            {emp.isActive && (
                                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-mintcom-green rounded-full border-2 border-white dark:border-zinc-900" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                                                                {getDisplayName(emp)}
                                                            </h3>
                                                            <p className="dashboard-card-meta mt-0.5">@{emp.username}</p>
                                                        </div>
                                                    </div>

                                                    {/* Status */}
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <Badge tone={emp.isActive ? 'green' : 'gray'}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-mintcom-green' : 'bg-stone-400 dark:bg-zinc-500'}`} />
                                                            {emp.isActive ? AppStrings.STATUS.ACTIVE : AppStrings.STATUS.INACTIVE}
                                                        </Badge>
                                                    </div>

                                                    {/* Primary Role */}
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        {emp.establishments[0] && (
                                                            <Badge tone={getRoleBadgeTone(emp.establishments[0].role)}>
                                                                {getRoleDisplay(emp.establishments[0].role)}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Locations Count */}
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <span className="font-bold text-stone-900 dark:text-zinc-100">
                                                            {emp.establishments.length} {emp.establishments.length !== 1 ? t('common.locations') : t('common.location')}
                                                        </span>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="col-span-2 flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditEmployee(emp); }}
                                                            className="px-4 py-2 rounded-lg bg-stone-50 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 text-xs font-bold tracking-wide hover:bg-stone-100 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 border border-stone-200 dark:border-zinc-700"
                                                        >
                                                            <Edit2 size={14} />
                                                            {t('common.edit')}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openDeleteModal(emp); }}
                                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    variant="footer"
                                    totalItems={filteredEmployees.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                />
                            </div>
                        )}
            {/* Employee Form Modal */}

            <EmployeeFormModal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setEditingEmployee(null); }}
                onSubmit={handleEmployeeSubmit}
                establishments={establishments}
                initialData={editingEmployee ? {
                    id: editingEmployee.id,
                    name: `${editingEmployee.firstName} ${editingEmployee.lastName}`,
                    username: editingEmployee.username,
                    role: editingEmployee.establishments?.[0]?.role || 'USER',
                    email: editingEmployee.email ?? undefined,
                    emailVerified: editingEmployee.emailVerified,
                    permissions: (editingEmployee as any).permissions || [],
                    allowedDiscounts: (editingEmployee as any).allowedDiscounts || [],
                    customRoleId: (editingEmployee as any).customRoleId,
                    establishmentIds: editingEmployee.establishments?.map(e => e.id) || []
                } : null}
            />

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal} size="sm">
                {employeeToDelete && (
                    <>
                        <ModalCloseButton onClose={closeDeleteModal} autoPositionAbsolute />
                        <ModalBody>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-8 shadow-sm">
                                    <AlertTriangle size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-stone-900 dark:text-zinc-100 tracking-tight mb-3 leading-tight">
                                    {t('brand.team.removeAccessTitle', 'Remove Brand Access')}
                                </h3>
                                <p className="text-stone-500 dark:text-zinc-400 text-sm font-bold leading-relaxed max-w-[320px]">
                                    {t('brand.team.removeAccessPrefix', 'Remove brand-wide access for')}
                                    <span className="text-stone-900 dark:text-zinc-100 font-black mx-1">
                                        {employeeToDelete.firstName} {employeeToDelete.lastName}
                                    </span>
                                    {t('brand.team.removeAccessFrom', 'from')}
                                    <span className="text-stone-900 dark:text-zinc-100 font-black mx-1">
                                        {brandName}
                                    </span>
                                    <span className="text-stone-900 dark:text-zinc-100 font-black uppercase tracking-tighter text-[10px] bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                        {t('owner.staff.brandLabel')}
                                    </span>.
                                    <br /><br />
                                    <span className="text-xs opacity-70 font-medium italic">
                                        {t('brand.team.removeAccessWarning', 'This only removes shared brand access. Direct establishment assignments stay active.')}
                                    </span>
                                </p>
                            </div>
                            <div className="mt-6 space-y-5">
                                {deleteError && (
                                    <p className="px-1 text-[11px] font-black text-red-500 flex items-center gap-1.5">
                                        <AlertTriangle size={12} /> {deleteError}
                                    </p>
                                )}
                                {/* Offers whichever proof this owner can actually produce —
                                    a Google/Apple owner has no password to type here. */}
                                <StepUpVerifier
                                    action="revoke-brand-access"
                                    targetId={employeeToDelete.id}
                                    onVerified={confirmDelete}
                                    onError={setDeleteError}
                                    submitLabel={t('brand.team.removeAccessConfirm', 'Remove access')}
                                    disabled={isDeleting}
                                />
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <ModalCancelButton onClick={closeDeleteModal}>
                                {t('common.cancel')}
                            </ModalCancelButton>
                        </ModalFooter>
                    </>
                )}
            </Modal>        </div >
    );
}







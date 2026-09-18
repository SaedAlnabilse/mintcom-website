import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users,
    Shield,
    Mail,
    Phone,
    Edit2,
    Trash2,
    UserPlus,
    MapPin,
    AlertTriangle,
    MoreVertical,
    ArrowUpDown,
} from 'lucide-react';

import api from '../../config/api';
import { EmployeeFormModal } from '../../components/forms/EmployeeFormModal';
import { BusyOverlay } from '../../components/BusyOverlay';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { EmptyState, SelectInput, Pagination, Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton, ModalSubmitButton, ModalCloseButton, PageHeader, ListFilterBar, StatCard, StatCardGrid, primaryButtonInlineClass } from '../../components/ui';
import { PortalDropdown } from '../../components/PortalDropdown';
import { SectionLoader } from '../../components/LoadingState';
import { formatInputPlaceholder } from '../../utils/textCase';
import { retryTransientRequest } from '../../utils/retryTransientRequest';
import { useRealtime } from '../../hooks/useRealtime';
import { DataChangeEventTypes } from '../../services/realtimeService';
import { StatValue } from '../../components/ui/StatValue';
import { StepUpVerifier } from '../../components/StepUpVerifier';
import { reauthHeaders } from '../../services/stepUp';
import { biIcon } from '../../components/ui/BiIcon';
import {
    getAssignmentRoleLabel,
    getEmployeeRoleSummary,
} from '../../utils/roleNames';

interface EmployeeAssignment {
    establishmentId: string;
    establishmentName: string;
    role: string;
    permissions: string[];
    assignmentsId: string;
    isActive: boolean;
    customRoleId?: string;
    customRoleName?: string | null;
    customRoleScope?: 'GLOBAL' | 'LOCATION' | null;
    backofficeAccess?: boolean;
    backofficePermissions?: string[];
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string | null;
    emailVerified?: boolean;
    phone?: string | null;
    role: string;
    isActive: boolean;
    accessLevel: string;
    establishments: string[];
    assignments: EmployeeAssignment[];
    hasActiveShift?: boolean;
    isAccountOwner?: boolean;
    isOwnerAccount?: boolean;
    isProtected?: boolean;
    isAdminEquivalent?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'role' | 'status' | 'accountStatus' | 'access';
type RoleFilterValue = 'ALL' | 'ADMIN' | 'USER';
type StatusFilterValue = 'ALL' | 'ACTIVE' | 'INACTIVE';
const MAX_EMPLOYEES_PER_ACCOUNT = 50;
const EMPLOYEE_LIMIT_POPUP_MESSAGE =
    `Maximum is ${MAX_EMPLOYEES_PER_ACCOUNT} employees.\n` +
    `To add more than ${MAX_EMPLOYEES_PER_ACCOUNT} employees, contact Mintcom support at info@mintcompos.com with your account email. Never send your password to support.`;

const getDisplayInitial = (firstName?: string, username?: string) =>
    (firstName?.trim()?.charAt(0) || username?.trim()?.charAt(0) || '?').toUpperCase();

// Employees can be created without a name; fall back to the username.
const getDisplayName = (emp: { firstName?: string; lastName?: string; username?: string }) =>
    `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username || '';

const isOwnerEmployee = (employee: Pick<Employee, 'role' | 'isAccountOwner' | 'isOwnerAccount' | 'isProtected'>) =>
    Boolean(
        employee.isAccountOwner ||
        employee.isOwnerAccount ||
        employee.isProtected ||
        employee.role?.toUpperCase() === 'ACCOUNT_OWNER',
    );

const isAdminEquivalentEmployee = (
    employee: Pick<Employee, 'role' | 'isAccountOwner' | 'isOwnerAccount' | 'isProtected' | 'isAdminEquivalent'>,
) =>
    Boolean(
        employee.isAdminEquivalent ||
        isOwnerEmployee(employee) ||
        employee.role?.toUpperCase() === 'ADMIN',
    );

export function OwnerEmployeesPage() {
    const { t } = useTranslation();
    const { establishments, currentEstablishment } = useAuth();
    // Account Status ("Clocked in/out") comes from hasActiveShift, which only
    // changes when a shift opens/closes on POS. Subscribe so the column tracks
    // the same realtime events that raise the "Shift started by ..." toast,
    // instead of going stale until the page is refreshed.
    const { onRefresh } = useRealtime({
        establishmentId: currentEstablishment?.id || null,
    });
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilterValue>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('ACTIVE');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const [accessModalEmployee, setAccessModalEmployee] = useState<Employee | null>(null);

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const managedEmployeeCount = useMemo(
        () => employees.filter((employee) => !isOwnerEmployee(employee)).length,
        [employees],
    );



    const fetchEmployees = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const response = await retryTransientRequest(() =>
                api.get('/api/accounts/all-employees'),
            );
            const nextEmployees: Employee[] = Array.isArray(response.data) ? response.data : [];
            setEmployees(nextEmployees);
            // Keep open edit form in sync after verification / resend refresh.
            setEditingEmployee((current) => {
                if (!current?.id) return current;
                const refreshed = nextEmployees.find((emp) => emp.id === current.id);
                return refreshed || current;
            });
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            toast.error(t('owner.staff.syncError'));
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        const employeeEvents = new Set<string>([
            DataChangeEventTypes.SHIFT_STARTED,
            DataChangeEventTypes.SHIFT_ENDED,
            DataChangeEventTypes.STAFF_CREATED,
            DataChangeEventTypes.STAFF_UPDATED,
            DataChangeEventTypes.STAFF_DELETED,
        ]);

        return onRefresh((eventType) => {
            if (employeeEvents.has(eventType)) {
                // Background refresh: never flip the list back to the loader
                // while the owner is reading it.
                fetchEmployees(true);
            }
        });
    }, [onRefresh, fetchEmployees]);

    useEffect(() => {
        if (!activeMenu) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.dropdown-container')) {
                setActiveMenu(null);
            }
        };

        const handleScroll = () => {
            setActiveMenu(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [activeMenu]);

    const openDeleteModal = (emp: Employee) => {
        if (isOwnerEmployee(emp)) {
            toast.error(t('owner.staff.ownerProtected', {
                defaultValue: 'The account owner cannot be deactivated from employee management.',
            }));
            return;
        }
        setEmployeeToDelete(emp);
        setDeleteError('');
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setEmployeeToDelete(null);
        setDeleteError('');
    };

    /**
     * Runs once StepUpVerifier has produced a single-use reauth token. The
     * proof already establishes the owner is present, so no credential travels
     * with the delete itself.
     */
    const confirmDelete = async (reauthToken: string) => {
        if (!employeeToDelete) return;

        setIsDeleting(true);
        setDeleteError('');

        try {
            await api.delete(`/api/accounts/employees/${employeeToDelete.id}`, {
                headers: reauthHeaders(reauthToken)
            });
            toast.success(t('common.deactivate'));
            closeDeleteModal();
            setIsFormModalOpen(false);
            setEditingEmployee(null);
            fetchEmployees();
        } catch (error: any) {
            setDeleteError(error.response?.data?.message || t('owner.staff.incorrectPassword'));
        } finally {
            setIsDeleting(false);
        }
    };

    // Legacy handler for EmployeeFormModal callback
    const handleDeleteEmployee = (id: string) => {
        const emp = employees.find(e => e.id === id);
        if (emp) {
            openDeleteModal(emp);
        }
    };

    const openEditEmployee = (emp: Employee) => {
        setEditingEmployee(emp);
        setIsFormModalOpen(true);
    };

    const handleOpenAddEmployeeModal = () => {
        if (managedEmployeeCount >= MAX_EMPLOYEES_PER_ACCOUNT) {
            window.alert(EMPLOYEE_LIMIT_POPUP_MESSAGE);
            return;
        }
        setEditingEmployee(null);
        setIsFormModalOpen(true);
    };

    const handleEmployeeSubmit = async (data: any) => {
        try {
            if (!editingEmployee && managedEmployeeCount >= MAX_EMPLOYEES_PER_ACCOUNT) {
                window.alert(EMPLOYEE_LIMIT_POPUP_MESSAGE);
                return;
            }
            if (editingEmployee) {
                if (isOwnerEmployee(editingEmployee)) {
                    await api.put('/api/accounts/owner-employee', data);
                } else {
                    await api.put(`/api/accounts/employees/${editingEmployee.id}`, data);
                }
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

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getActiveAssignments = useCallback(
        (employee: Employee) => (employee.assignments || []).filter((assignment) => assignment.isActive),
        [],
    );

    /**
     * One label per employee for the list. An employee can hold different roles
     * at different locations, so this shows the shared role when they agree and
     * a "Mixed" summary when they do not - `emp.role` alone was the server's
     * "Admin wins" collapse, which read as Admin for anyone who was Admin at a
     * single branch.
     */
    const getEmployeeRoleLabel = useCallback(
        (employee: Employee) =>
            getEmployeeRoleSummary(getActiveAssignments(employee), { role: employee.role }, t),
        [getActiveAssignments, t],
    );

    const filteredEmployees = useMemo(() => {
        const result = employees.filter(emp => {
            const matchesSearch =
                `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
            const matchesRole =
                roleFilter === 'ALL' ||
                (roleFilter === 'USER'
                    ? !isAdminEquivalentEmployee(emp)
                    : isAdminEquivalentEmployee(emp));
            const matchesStatus = statusFilter === 'ALL' ||
                (statusFilter === 'ACTIVE' ? emp.isActive : !emp.isActive);
            return matchesSearch && matchesRole && matchesStatus;
        });

        // Sorting
        if (sortConfig) {
            result.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortConfig.key) {
                    case 'name':
                        aValue = `${a.firstName} ${a.lastName}`.trim().toLowerCase() || a.username.toLowerCase();
                        bValue = `${b.firstName} ${b.lastName}`.trim().toLowerCase() || b.username.toLowerCase();
                        break;
                    case 'role':
                        // Sort by the printed label, not the base-role enum.
                        aValue = getEmployeeRoleLabel(a).toLowerCase();
                        bValue = getEmployeeRoleLabel(b).toLowerCase();
                        break;
                    case 'status':
                        aValue = a.isActive ? 1 : 0;
                        bValue = b.isActive ? 1 : 0;
                        break;
                    case 'accountStatus':
                        aValue = a.hasActiveShift ? 1 : 0;
                        bValue = b.hasActiveShift ? 1 : 0;
                        break;
                    case 'access':
                        aValue = getActiveAssignments(a).length;
                        bValue = getActiveAssignments(b).length;
                        break;
                    default:
                        return 0;
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [employees, searchQuery, roleFilter, statusFilter, sortConfig, getActiveAssignments, getEmployeeRoleLabel]);

    // Reset to page 1 when filters or sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter, statusFilter, sortConfig]);

    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEmployees, currentPage]);

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const hasEmployeeSearch = searchQuery.trim().length > 0;
    const hasEmployeeFilters = roleFilter !== 'ALL' || statusFilter !== 'ALL';

    const getRoleStyle = (role: string) => {
        switch (role?.toUpperCase()) {
            case 'ACCOUNT_OWNER':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'ADMIN':
                return 'bg-stone-500/10 text-stone-600 dark:text-zinc-300 border-stone-500/20';
            case 'MANAGER':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default:
                return 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20';
        }
    };


    const getStatusBadge = (isActive: boolean | undefined) => {
        if (isActive) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black tracking-wide bg-mintcom-green/10 text-mintcom-green">
                    {t('common.active', 'Active')}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black tracking-wide bg-mintcom-red/10 text-mintcom-red">
                {t('common.inactive', 'Inactive')}
            </span>
        );
    };

    const getAccountStatusContent = (hasActiveShift: boolean | undefined) => (
        <div className={`flex items-center justify-center gap-2 font-medium text-xs tracking-wide ${hasActiveShift ? 'text-mintcom-green' : 'text-stone-400'}`}>
            {hasActiveShift ? (
                <>
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mintcom-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-mintcom-green"></span>
                    </div>
                    <span>{t('staff.status.online')}</span>
                </>
            ) : (
                <>
                    <div className="h-2 w-2 rounded-full bg-stone-300 dark:bg-zinc-600" />
                    <span>{t('staff.status.offline')}</span>
                </>
            )}
        </div>
    );

    const stats = useMemo(() => ({
        total: employees.length,
        admins: employees.filter(isAdminEquivalentEmployee).length,
        staff: employees.filter(e => !isAdminEquivalentEmployee(e)).length,
        active: employees.filter(e => e.hasActiveShift).length
    }), [employees]);

    const primaryEditingAssignment =
        editingEmployee
            ? getActiveAssignments(editingEmployee)[0] ?? editingEmployee.assignments?.[0]
            : null;



    return (
        <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            {/* Full-screen blocker while data loads, so no second action can
                be stacked on an in-flight request. */}
            <BusyOverlay visible={isLoading} />
            {/* Header */}
            <PageHeader
                title={t('owner.staff.title')}
                subtitle={t('owner.staff.subtitle')}
                actions={
                    <>
                    <button
                        id="tour-add-employee-btn"
                        onClick={handleOpenAddEmployeeModal}
                        className={primaryButtonInlineClass}
                    >
                        <UserPlus size={15} strokeWidth={2} />
                        <span>{t('staff.newEmployee')}</span>
                    </button>
                    </>
                }
            />

            {/* Stats Grid */}
            <StatCardGrid columns={4} id="tour-stats-grid">
                <StatCard
                    label={t('owner.staff.totalUsers')}
                    info={t('owner.staff.usersInfo')}
                    value={stats.total}
                    icon={biIcon('bi-people')}
                    layout="horizontal"
                />
                <StatCard
                    label={t('owner.staff.activeNow')}
                    info={t('owner.staff.activeInfo')}
                    value={stats.active}
                    icon={biIcon('bi-person-check')}
                    layout="horizontal"
                />
                <StatCard
                    label={t('owner.staff.admins')}
                    info={t('owner.staff.adminsInfo')}
                    value={stats.admins}
                    icon={biIcon('bi-shield-check')}
                    layout="horizontal"
                />
                <StatCard
                    label={t('owner.staff.standardUsers')}
                    info={t('owner.staff.standardInfo')}
                    value={stats.staff}
                    icon={biIcon('bi-person-badge')}
                    layout="horizontal"
                />
            </StatCardGrid>

            {/* Filters Bar */}
            <ListFilterBar
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                onSearchClear={() => setSearchQuery('')}
                searchPlaceholder={formatInputPlaceholder(t('owner.staff.searchPlaceholder'), t('common.locale'))}
                searchId="tour-search-input"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                viewToggleId="tour-view-toggle"
            >
                <div className="w-full sm:w-40">
                    <SelectInput
                        value={statusFilter === 'ALL' ? null : statusFilter}
                        onChange={(val) => setStatusFilter((val as StatusFilterValue) || 'ALL')}
                        options={[
                            { label: t('common.active', 'Active'), value: 'ACTIVE' },
                            { label: t('common.inactive', 'Inactive'), value: 'INACTIVE' },
                        ]}
                        allOptionLabel={t('common.allStatuses', 'All Statuses')}
                        placeholder={t('common.allStatuses', 'All Statuses')}
                        searchable={false}
                    />
                </div>
                <div className="w-full sm:w-48">
                    <SelectInput
                        value={roleFilter === 'ALL' ? null : roleFilter}
                        onChange={(val) => setRoleFilter((val as RoleFilterValue) || 'ALL')}
                        options={[
                            { label: t('staff.roles.admin'), value: 'ADMIN' },
                            { label: t('staff.roles.user'), value: 'USER' },
                        ]}
                        allOptionLabel={t('owner.employees.allRoles')}
                        placeholder={formatInputPlaceholder(t('owner.employees.allRoles'), t('common.locale'))}
                        searchable={false}
                    />
                </div>
            </ListFilterBar>

            {/* Employee List */}
            {isLoading ? (
                <SectionLoader message={t('owner.staff.loading')} minHeightClassName="py-20" />
            ) : filteredEmployees.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={
                        hasEmployeeSearch
                            ? t('common.noResults')
                            : hasEmployeeFilters
                                ? t('common.noFilteredResults')
                                : t('owner.staff.noStaffFound')
                    }
                    description={
                        hasEmployeeSearch
                            ? t('common.noMatchingResults', { entity: 'staff', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' })
                            : hasEmployeeFilters
                                ? t('common.noFilteredResultsDesc')
                                : t('owner.staff.noStaffDesc')
                    }
                />
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-stretch gap-6 px-4">
                            {paginatedEmployees.map((emp) => {
                                const activeAssignments = getActiveAssignments(emp);
                                const accessCount = activeAssignments.length;

                                return (
                                <div
                                    key={emp.id}
                                    className={`group relative min-w-0 h-full bg-white dark:bg-zinc-900/60 rounded-2xl border shadow-sm p-6 transition-all duration-300 overflow-hidden ${isOwnerEmployee(emp) ? 'border-amber-300/60 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/[0.04]' : 'border-stone-200 dark:border-zinc-800'}`}
                                >
                                    
                                    <div className="relative z-10 flex h-full min-w-0 flex-col">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex min-w-0 items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 flex items-center justify-center relative flex-shrink-0">
                                                    <span className="text-stone-900 dark:text-zinc-100 font-bold text-xl">
                                                        {getDisplayInitial(emp.firstName, emp.username)}
                                                    </span>
                                                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${emp.isActive ? 'bg-mintcom-green' : 'bg-mintcom-red'}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-lg font-bold tracking-tight text-stone-900 dark:text-zinc-100 leading-tight">
                                                        {getDisplayName(emp)}
                                                    </h3>
                                                    <p className="truncate text-xs text-stone-500 mt-1">
                                                        {emp.username}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="relative dropdown-container">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        triggerRef.current = e.currentTarget;
                                                        setActiveMenu(activeMenu === emp.id ? null : emp.id);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 transition-colors"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                <PortalDropdown
                                                    isOpen={activeMenu === emp.id}
                                                    onClose={() => setActiveMenu(null)}
                                                    triggerRef={triggerRef}
                                                    align={t('common.locale') === 'ar' ? 'left' : 'right'}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            openEditEmployee(emp);
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-sm font-medium text-stone-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                        {t('common.edit')}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleDeleteEmployee(emp.id);
                                                            setActiveMenu(null);
                                                        }}
                                                        disabled={isOwnerEmployee(emp)}
                                                        className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-colors border-t border-stone-100 dark:border-zinc-800 ${isOwnerEmployee(emp) ? 'text-amber-600 dark:text-amber-400 cursor-not-allowed opacity-75' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
                                                    >
                                                        <Trash2 size={16} />
                                                        {isOwnerEmployee(emp)
                                                            ? t('staff.ownerProtected', { defaultValue: 'Owner protected' })
                                                            : t('common.deactivate')}
                                                    </button>
                                                </PortalDropdown>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getRoleStyle(emp.role)}`}>
                                                <Shield size={10} />
                                                {getEmployeeRoleLabel(emp)}
                                            </span>
                                        </div>

                                        <div className="mt-auto space-y-4 pt-4 border-t border-stone-100 dark:border-zinc-800">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mb-1">{t('common.status.label', 'Status')}</p>
                                                    {getStatusBadge(emp.isActive)}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mb-1">{t('staff.table.status')}</p>
                                                    {getAccountStatusContent(emp.hasActiveShift)}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-stone-500 dark:text-zinc-400 mb-1">{t('staff.table.contact')}</p>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs text-stone-500">
                                                        <Mail size={12} className="text-stone-400" />
                                                        <span className="font-medium">{emp.email || t('owner.staff.noEmail')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-stone-500">
                                                        <Phone size={12} className="text-stone-400" />
                                                        <span className="font-medium">{emp.phone || t('owner.staff.noPhone')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-stone-500 dark:text-zinc-400 mb-1">{t('owner.staff.access')}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setAccessModalEmployee(emp)}
                                                    className="inline-flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-zinc-100 hover:text-mintcom-green transition-colors"
                                                >
                                                    <MapPin size={14} className="text-mintcom-green" />
                                                    {t('owner.staff.locationsCount', {
                                                        count: accessCount,
                                                        defaultValue: accessCount === 1 ? '1 location' : '{{count}} locations',
                                                    })}
                                                </button>
                                                {accessCount === 0 && (
                                                    <p className="mt-2 text-xs text-stone-500">{t('owner.staff.noLocationsAssigned')}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                            <div className="md:hidden divide-y divide-stone-100 dark:divide-zinc-800">
                                {paginatedEmployees.map((emp) => {
                                    const activeAssignments = getActiveAssignments(emp);
                                    const accessCount = activeAssignments.length;

                                    return (
                                        <div
                                            key={emp.id}
                                            className={`p-4 hover:bg-stone-50/80 dark:hover:bg-zinc-800/40 transition-colors ${isOwnerEmployee(emp) ? 'bg-amber-50/50 dark:bg-amber-500/[0.04]' : ''}`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-black text-sm">
                                                        {getDisplayInitial(emp.firstName, emp.username)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-stone-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                                                            <span>{getDisplayName(emp)}</span>
                                                        </p>
                                                        <p className="text-xs text-stone-500">{emp.username}</p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getRoleStyle(emp.role)}`}>
                                                    <Shield size={10} />
                                                    {getEmployeeRoleLabel(emp)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-3 pt-3 border-t border-stone-100 dark:border-zinc-800">
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mb-0.5">{t('staff.table.contact')}</p>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">
                                                            <Mail size={12} className="text-stone-400 flex-shrink-0" />
                                                            <span className="truncate">{emp.email || t('owner.staff.noEmail')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">
                                                            <Phone size={12} className="text-stone-400 flex-shrink-0" />
                                                            <span className="truncate">{emp.phone || t('owner.staff.noPhone')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mb-0.5">{t('common.status.label', 'Status')}</p>
                                                    {getStatusBadge(emp.isActive)}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mb-0.5">{t('staff.table.status')}</p>
                                                    {getAccountStatusContent(emp.hasActiveShift)}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-stone-500 dark:text-zinc-400 mb-0.5">{t('owner.staff.access')}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAccessModalEmployee(emp)}
                                                        className="inline-flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-zinc-100 hover:text-mintcom-green transition-colors"
                                                    >
                                                        <MapPin size={14} className="text-mintcom-green" />
                                                        {t('owner.staff.locationsCount', {
                                                            count: accessCount,
                                                            defaultValue: accessCount === 1 ? '1 location' : '{{count}} locations',
                                                        })}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-zinc-800">
                                                <button
                                                    onClick={() => {
                                                        openEditEmployee(emp);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-all text-xs font-bold touch-target"
                                                >
                                                    <Edit2 size={14} />
                                                    {t('common.edit')}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEmployee(emp.id)}
                                                    disabled={isOwnerEmployee(emp)}
                                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-bold touch-target ${isOwnerEmployee(emp) ? 'border-amber-200 text-amber-600 cursor-not-allowed opacity-70' : 'border-red-200 dark:border-red-500/20 text-mintcom-red hover:bg-red-50 dark:hover:bg-red-900/10'}`}
                                                >
                                                    <Trash2 size={14} />
                                                    {isOwnerEmployee(emp)
                                                        ? t('staff.ownerProtected', { defaultValue: 'Owner protected' })
                                                        : t('common.deactivate')}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white dark:bg-zinc-900/40">
                                        <tr className="border-b border-stone-200 dark:border-zinc-800">
                                            <th
                                                className="px-6 py-4 text-start text-[13px] font-semibold text-stone-500 dark:text-zinc-400 cursor-pointer hover:text-stone-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {t('staff.table.name')}
                                                    {sortConfig?.key === 'name' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-center text-[13px] font-semibold text-stone-500 dark:text-zinc-400 cursor-pointer hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
                                                onClick={() => handleSort('role')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('staff.table.role')}
                                                    {sortConfig?.key === 'role' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center text-[13px] font-semibold text-stone-500 dark:text-zinc-400 whitespace-nowrap">{t('staff.table.contact')}</th>
                                            <th
                                                className="px-6 py-4 text-center text-[13px] font-semibold text-stone-500 dark:text-zinc-400 cursor-pointer hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
                                                onClick={() => handleSort('status')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('common.status.label', 'Status')}
                                                    {sortConfig?.key === 'status' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-center text-[13px] font-semibold text-stone-500 dark:text-zinc-400 cursor-pointer hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
                                                onClick={() => handleSort('accountStatus')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('staff.table.status')}
                                                    {sortConfig?.key === 'accountStatus' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-center text-[13px] font-semibold text-stone-500 dark:text-zinc-400 cursor-pointer hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
                                                onClick={() => handleSort('access')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('owner.staff.access')}
                                                    {sortConfig?.key === 'access' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-end text-[13px] font-semibold text-stone-500 dark:text-zinc-400 whitespace-nowrap">{t('owner.locations.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                                        {paginatedEmployees.map((emp) => {
                                            const activeAssignments = getActiveAssignments(emp);
                                            const accessCount = activeAssignments.length;

                                            return (
                                                <tr
                                                    key={emp.id}
                                                    className={`group hover:bg-stone-50/80 dark:hover:bg-zinc-800/40 transition-colors ${isOwnerEmployee(emp) ? 'bg-amber-50/40 dark:bg-amber-500/[0.04]' : ''}`}
                                                >
                                                    <td className="px-6 py-4 text-start">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-black text-sm shrink-0">
                                                                {getDisplayInitial(emp.firstName, emp.username)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-stone-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                                                                    <span>{getDisplayName(emp)}</span>
                                                                </p>
                                                                <p className="text-xs text-stone-500">{emp.username}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getRoleStyle(emp.role)}`}>
                                                            <Shield size={10} />
                                                            {getEmployeeRoleLabel(emp)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="space-y-1 flex flex-col items-center justify-center">
                                                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                                                <Mail size={12} className="text-stone-400" />
                                                                <span className="font-medium">{emp.email || t('owner.staff.noEmail')}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                                                <Phone size={12} className="text-stone-400" />
                                                                <span className="font-medium">{emp.phone || t('owner.staff.noPhone')}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {getStatusBadge(emp.isActive)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {getAccountStatusContent(emp.hasActiveShift)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setAccessModalEmployee(emp)}
                                                            className="inline-flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-zinc-100 hover:text-mintcom-green transition-colors"
                                                        >
                                                            <MapPin size={14} className="text-mintcom-green" />
                                                            {t('owner.staff.locationsCount', {
                                                                count: accessCount,
                                                                defaultValue: accessCount === 1 ? '1 location' : '{{count}} locations',
                                                            })}
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-5 text-end">
                                                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    openEditEmployee(emp);
                                                                }}
                                                                aria-label={t('common.edit')}
                                                                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-all shadow-sm active:scale-90"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <div className="relative dropdown-container">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        triggerRef.current = e.currentTarget;
                                                                        setActiveMenu(activeMenu === emp.id ? null : emp.id);
                                                                    }}
                                                                    aria-label={t('common.actions')}
                                                                    aria-expanded={activeMenu === emp.id}
                                                                    className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all active:scale-90 shadow-sm ${activeMenu === emp.id ? 'bg-mintcom-green text-black border-mintcom-green' : 'bg-white dark:bg-zinc-800 border-stone-100 dark:border-zinc-800 text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-zinc-700'}`}
                                                                >
                                                                    <MoreVertical size={18} />
                                                                </button>

                                                                <PortalDropdown
                                                                    isOpen={activeMenu === emp.id}
                                                                    onClose={() => setActiveMenu(null)}
                                                                    triggerRef={triggerRef}
                                                                    align={t('common.locale') === 'ar' ? 'left' : 'right'}
                                                                    className="py-1.5"
                                                                >
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveMenu(null);
                                                                            openEditEmployee(emp);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 label-strong font-sans text-stone-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition-colors text-left"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                        <span>{t('common.edit')}</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveMenu(null);
                                                                            handleDeleteEmployee(emp.id);
                                                                        }}
                                                                        disabled={isOwnerEmployee(emp)}
                                                                        className={`w-full flex items-center gap-3 px-4 py-3 label-strong font-sans transition-colors text-left border-t border-stone-100 dark:border-zinc-800 ${isOwnerEmployee(emp) ? 'text-amber-600 dark:text-amber-400 cursor-not-allowed opacity-75' : 'text-mintcom-red hover:bg-red-50 dark:hover:bg-red-900/10'}`}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                        <span>
                                                                            {isOwnerEmployee(emp)
                                                                                ? t('staff.ownerProtected', { defaultValue: 'Owner protected' })
                                                                                : t('common.deactivate')}
                                                                        </span>
                                                                    </button>
                                                                </PortalDropdown>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                variant="footer"
                            />
                        </div>
                    )}
                    {viewMode === 'grid' && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </>
            )}


            <EmployeeFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleEmployeeSubmit}
                onDelete={editingEmployee ? handleDeleteEmployee : undefined}
                establishments={establishments}
                initialData={editingEmployee ? {
                    id: editingEmployee.id,
                    name: `${editingEmployee.firstName} ${editingEmployee.lastName}`,
                    username: editingEmployee.username,
                    role: editingEmployee.role,
                    email: editingEmployee.email ?? undefined,
                    emailVerified: editingEmployee.emailVerified,
                    phone: editingEmployee.phone ?? undefined,
                    permissions: primaryEditingAssignment?.permissions || [],
                    customRoleId: primaryEditingAssignment?.customRoleId,
                    backofficeAccess: primaryEditingAssignment?.backofficeAccess,
                    backofficePermissions: primaryEditingAssignment?.backofficePermissions,
                    allowedDiscounts: (editingEmployee as any).allowedDiscounts || [],
                    establishmentIds: getActiveAssignments(editingEmployee).map(a => a.establishmentId),
                    assignments: getActiveAssignments(editingEmployee),
                    isAccountOwner: editingEmployee.isAccountOwner,
                    isOwnerAccount: editingEmployee.isOwnerAccount,
                    isProtected: editingEmployee.isProtected,
                } : null}
            />

            <Modal isOpen={accessModalEmployee !== null} onClose={() => setAccessModalEmployee(null)} size="md">
                {accessModalEmployee && (
                    <>
                        <ModalHeader
                            title={`${accessModalEmployee.firstName} ${accessModalEmployee.lastName}`.trim() || accessModalEmployee.username}
                            subtitle={accessModalEmployee.username}
                            onClose={() => setAccessModalEmployee(null)}
                        />

                        <ModalBody>
                            <div className="flex items-center justify-between rounded-2xl bg-white dark:bg-zinc-800 px-4 py-3 border border-stone-200 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <MapPin size={16} className="text-mintcom-green" />
                                    <span className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                                        {t('owner.staff.accessLocations', 'Accessible Establishments')}
                                    </span>
                                </div>
                                <span className="text-sm font-black text-mintcom-green">
                                    {t('owner.staff.locationsCount', {
                                        count: getActiveAssignments(accessModalEmployee).length,
                                        defaultValue:
                                            getActiveAssignments(accessModalEmployee).length === 1
                                                ? '1 location'
                                                : '{{count}} locations',
                                    })}
                                </span>
                            </div>

                            {getActiveAssignments(accessModalEmployee).length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-stone-200 dark:border-zinc-800 px-4 py-8 text-center mt-4">
                                    <p className="text-sm font-medium text-stone-500">
                                        {t('owner.staff.noLocationsAssigned')}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3 mt-4">
                                    {getActiveAssignments(accessModalEmployee).map((assignment) => (
                                        <div
                                            key={assignment.assignmentsId}
                                            className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 dark:border-zinc-800 px-4 py-3"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                                                    {assignment.establishmentName}
                                                </p>
                                                <p className="text-xs text-stone-500 mt-1">
                                                    {t('staff.table.role')}: {getAssignmentRoleLabel(assignment, t)}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getRoleStyle(assignment.role)}`}>
                                                <Shield size={10} />
                                                {getAssignmentRoleLabel(assignment, t)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ModalBody>
                    </>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModalOpen && !!employeeToDelete} onClose={closeDeleteModal} size="sm">
              {employeeToDelete && (
                <>
                  <ModalCloseButton onClose={closeDeleteModal} autoPositionAbsolute />
                  <ModalBody className="pt-10">
                      <div className="p-10 pb-6 flex flex-col items-center text-center">
                          <div className="w-20 h-20 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-8 shadow-sm">
                              <AlertTriangle size={40} />
                          </div>
                          <h3 className="text-2xl font-black text-stone-900 dark:text-zinc-100 tracking-tight mb-3 leading-tight">
                              {t('security.modes.deleteEmployee.title')}
                          </h3>
                          <p className="text-stone-500 dark:text-zinc-400 text-sm font-bold leading-relaxed max-w-[300px]">
                              {t('security.modes.deleteEmployee.warning', {
                                  name: `${employeeToDelete.firstName} ${employeeToDelete.lastName}`.trim(),
                              })}
                          </p>
                      </div>

                      <div className="px-10 pb-8 space-y-5">
                          {deleteError && (
                              <p className="px-1 text-[11px] font-black text-red-500 flex items-center gap-1.5">
                                  <AlertTriangle size={12} /> {deleteError}
                              </p>
                          )}
                          {/* Offers whichever proof this owner can actually produce —
                              a Google/Apple owner has no password to type here. */}
                          <StepUpVerifier
                              action="delete-account-employee"
                              targetId={employeeToDelete.id}
                              onVerified={confirmDelete}
                              onError={setDeleteError}
                              submitLabel={t('popups.deleteEmployee.button', 'Deactivate Member')}
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
            </Modal>


        </div>
    );
}




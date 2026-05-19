import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Users,
    Shield,
    Mail,
    Phone,
    Edit2,
    Trash2,
    UserPlus,
    MapPin,
    Star,
    Eye,
    EyeOff,
    AlertTriangle,
    Grid3X3,
    List,
    MoreVertical,
    UserCheck,
    ArrowUpDown,
  X
} from 'lucide-react';
import api from '../../config/api';
import { EmployeeFormModal } from '../../components/forms/EmployeeFormModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { SearchInput, SelectInput, Pagination } from '../../components/ui';
import { PortalDropdown } from '../../components/PortalDropdown';
import { SectionLoader } from '../../components/LoadingState';
import { formatInputLabel, formatInputPlaceholder } from '../../utils/textCase';

interface EmployeeAssignment {
    establishmentId: string;
    establishmentName: string;
    role: string;
    permissions: string[];
    assignmentsId: string;
    isActive: boolean;
    customRoleId?: string;
    backofficeAccess?: boolean;
    backofficePermissions?: string[];
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string | null;
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
}

type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'role' | 'status' | 'accountStatus' | 'access';
type RoleFilterValue = 'ALL' | 'ADMIN' | 'USER';
type StatusFilterValue = 'ALL' | 'ACTIVE' | 'INACTIVE';
const MAX_EMPLOYEES_PER_ACCOUNT = 50;
const MAX_DELETE_PASSWORD_ATTEMPTS = 3;
const EMPLOYEE_LIMIT_POPUP_MESSAGE =
    `Maximum is ${MAX_EMPLOYEES_PER_ACCOUNT} employees.\n` +
    `To add more than ${MAX_EMPLOYEES_PER_ACCOUNT} employees, contact Mintcom support at info@mintcompos.com with your account email. Never send your password to support.`;

const getDisplayInitial = (firstName?: string, username?: string) =>
    (firstName?.trim()?.charAt(0) || username?.trim()?.charAt(0) || '?').toUpperCase();

const isOwnerEmployee = (employee: Pick<Employee, 'role' | 'isAccountOwner' | 'isOwnerAccount' | 'isProtected'>) =>
    Boolean(
        employee.isAccountOwner ||
        employee.isOwnerAccount ||
        employee.isProtected ||
        employee.role?.toUpperCase() === 'ACCOUNT_OWNER',
    );

export function OwnerEmployeesPage() {
    const { t } = useTranslation();
    const { establishments, account, logout } = useAuth();
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
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deleteAttemptCount, setDeleteAttemptCount] = useState(0);

    const managedEmployeeCount = useMemo(
        () => employees.filter((employee) => !isOwnerEmployee(employee)).length,
        [employees],
    );



    const fetchEmployees = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/accounts/all-employees');
            setEmployees(response.data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            toast.error(t('owner.staff.syncError'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

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
        setDeletePassword('');
        setDeleteError('');
        setDeleteAttemptCount(0);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setEmployeeToDelete(null);
        setDeletePassword('');
        setDeleteError('');
        setDeleteAttemptCount(0);
    };

    const confirmDelete = async () => {
        if (!employeeToDelete || !account?.email) return;

        if (!deletePassword.trim()) {
            setDeleteError(t('owner.staff.enterPassword'));
            return;
        }

        setIsDeleting(true);
        setDeleteError('');

        try {
            // Call delete with password verification
            await api.delete(`/api/accounts/employees/${employeeToDelete.id}`, {
                data: { email: account.email, password: deletePassword },
                headers: { 'X-Skip-Auth-Redirect': 'true' }
            });
            toast.success(t('common.deactivate'));
            closeDeleteModal();
            setIsFormModalOpen(false);
            setEditingEmployee(null);
            fetchEmployees();
        } catch (error: any) {
            if (error.response?.status === 401) {
                const nextAttemptCount = deleteAttemptCount + 1;
                const remainingAttempts = MAX_DELETE_PASSWORD_ATTEMPTS - nextAttemptCount;

                setDeleteAttemptCount(nextAttemptCount);

                if (remainingAttempts > 0) {
                    setDeleteError(
                        t('owner.staff.incorrectPasswordRemaining', {
                            count: remainingAttempts,
                        }),
                    );
                    return;
                }

                const tooManyAttemptsMessage = t('owner.staff.tooManyPasswordAttempts');
                setDeleteError(tooManyAttemptsMessage);
                toast.error(tooManyAttemptsMessage);
                closeDeleteModal();
                await logout();
                return;
            }

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
        if (isOwnerEmployee(emp)) {
            toast.error(t('owner.staff.ownerEditProtected', {
                defaultValue: 'The owner profile is managed from Account settings.',
            }));
            return;
        }
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

    const filteredEmployees = useMemo(() => {
        const result = employees.filter(emp => {
            const matchesSearch =
                `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
            const matchesRole = roleFilter === 'ALL' || (roleFilter === 'USER' ? emp.role !== 'ADMIN' : emp.role === roleFilter);
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
                        aValue = a.role?.toLowerCase() || '';
                        bValue = b.role?.toLowerCase() || '';
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
    }, [employees, searchQuery, roleFilter, statusFilter, sortConfig, getActiveAssignments]);

    // Reset to page 1 when filters or sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter, statusFilter, sortConfig]);

    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEmployees, currentPage]);

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

    const getRoleStyle = (role: string) => {
        switch (role?.toUpperCase()) {
            case 'ACCOUNT_OWNER':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'ADMIN':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'MANAGER':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default:
                return 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20';
        }
    };

    const getRoleLabel = (role: string) => {
        if (role?.toUpperCase() === 'ACCOUNT_OWNER') {
            return t('staff.roles.accountOwner', { defaultValue: 'Owner' });
        }
        const translationKey = `staff.roles.${role?.toLowerCase?.() || ''}`;
        const translatedRole = t(translationKey);
        if (translatedRole !== translationKey) {
            return translatedRole;
        }

        return role ? role.charAt(0) + role.slice(1).toLowerCase() : '';
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
        <div className={`flex items-center justify-center gap-2 font-medium text-xs tracking-wide ${hasActiveShift ? 'text-mintcom-green' : 'text-gray-400'}`}>
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
                    <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{t('staff.status.offline')}</span>
                </>
            )}
        </div>
    );

    const stats = useMemo(() => ({
        total: employees.length,
        admins: employees.filter(e => e.role === 'ADMIN').length,
        staff: employees.filter(e => e.role !== 'ADMIN' && !isOwnerEmployee(e)).length,
        active: employees.filter(e => e.hasActiveShift).length
    }), [employees]);

    const primaryEditingAssignment =
        editingEmployee
            ? getActiveAssignments(editingEmployee)[0] ?? editingEmployee.assignments?.[0]
            : null;



    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('owner.staff.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
                        {t('owner.staff.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-3">

                    <button
                        id="tour-add-employee-btn"
                        onClick={handleOpenAddEmployeeModal}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-mintcom-green text-black font-bold text-sm hover:bg-[#5fa888] transition-all shadow-sm"
                    >
                        <UserPlus size={18} />
                        <span>{t('staff.newEmployee')}</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div id="tour-stats-grid" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                    { label: t('owner.staff.totalUsers'), info: t('owner.staff.usersInfo'), value: stats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: t('owner.staff.activeNow'), info: t('owner.staff.activeInfo'), value: stats.active, icon: UserCheck, color: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
                    { label: t('owner.staff.admins'), info: t('owner.staff.adminsInfo'), value: stats.admins, icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: t('owner.staff.standardUsers'), info: t('owner.staff.standardInfo'), value: stats.staff, icon: Star, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2 sm:mb-3">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300`}>
                                    <stat.icon size={16} className="sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div>
                                <p className="dashboard-stat-title mb-1 truncate">{stat.label}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-1">{stat.value.toLocaleString(t('common.locale'))}</p>
                                <p className="hidden sm:block text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{stat.info}</p>
                            </div>
                        </div>
                    </div>
                ))
                }
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div id="tour-search-input" className="relative flex-1 sm:max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                        placeholder={formatInputPlaceholder(t('owner.staff.searchPlaceholder'), t('common.locale'))}
                        className="w-full"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
                        />
                    </div>
                    <div id="tour-view-toggle" className="flex items-center bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-1 h-12">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-mintcom-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Grid3X3 size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-mintcom-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Employee List */}
            {isLoading ? (
                <SectionLoader message={t('owner.staff.loading')} minHeightClassName="py-20" />
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Users size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="dashboard-card-value">{searchQuery.trim() ? t('common.noResults') : t('owner.staff.noStaffFound')}</p>
                    <p className="text-sm font-medium text-gray-500 mt-1">{searchQuery.trim() ? t('common.noMatchingResults', { entity: 'staff', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' }) : t('owner.staff.noStaffDesc')}</p>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {paginatedEmployees.map((emp) => {
                                const activeAssignments = getActiveAssignments(emp);
                                const accessCount = activeAssignments.length;

                                return (
                                <div
                                    key={emp.id}
                                    className={`group relative bg-white dark:bg-[#1E293B] rounded-2xl border shadow-sm hover:shadow-lg hover:border-indigo-500/30 p-6 transition-all duration-300 overflow-hidden ${isOwnerEmployee(emp) ? 'border-amber-300/60 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/[0.04]' : 'border-gray-200 dark:border-white/5'}`}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-[12px] bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                                    <span className="text-gray-900 dark:text-white font-bold text-xl">
                                                        {getDisplayInitial(emp.firstName, emp.username)}
                                                    </span>
                                                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0A0A0A] ${emp.isActive ? 'bg-mintcom-green' : 'bg-mintcom-red'}`} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                                                        {emp.firstName} {emp.lastName}
                                                        {isOwnerEmployee(emp) && (
                                                            <span className="ml-2 align-middle px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black tracking-wide">
                                                                {t('staff.roles.accountOwner', { defaultValue: 'Owner' })}
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1">
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
                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
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
                                                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
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
                                                        className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-colors border-t border-gray-100 dark:border-white/5 ${isOwnerEmployee(emp) ? 'text-amber-600 dark:text-amber-400 cursor-not-allowed opacity-75' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
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
                                                {getRoleLabel(emp.role)}
                                            </span>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('common.status.label', 'Status')}</p>
                                                    {getStatusBadge(emp.isActive)}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('staff.table.status')}</p>
                                                    {getAccountStatusContent(emp.hasActiveShift)}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('staff.table.contact')}</p>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Mail size={12} className="text-gray-400" />
                                                        <span className="font-medium">{emp.email || t('owner.staff.noEmail')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Phone size={12} className="text-gray-400" />
                                                        <span className="font-medium">{emp.phone || t('owner.staff.noPhone')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('owner.staff.access')}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setAccessModalEmployee(emp)}
                                                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:text-mintcom-green transition-colors"
                                                >
                                                    <MapPin size={14} className="text-mintcom-green" />
                                                    {t('owner.staff.locationsCount', {
                                                        count: accessCount,
                                                        defaultValue: accessCount === 1 ? '1 location' : '{{count}} locations',
                                                    })}
                                                </button>
                                                {accessCount === 0 && (
                                                    <p className="mt-2 text-xs text-gray-500">{t('owner.staff.noLocationsAssigned')}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                                {paginatedEmployees.map((emp) => {
                                    const activeAssignments = getActiveAssignments(emp);
                                    const accessCount = activeAssignments.length;

                                    return (
                                        <div
                                            key={emp.id}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${isOwnerEmployee(emp) ? 'bg-amber-50/50 dark:bg-amber-500/[0.04]' : ''}`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-black text-sm">
                                                        {getDisplayInitial(emp.firstName, emp.username)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                                            <span>{emp.firstName} {emp.lastName}</span>
                                                            {isOwnerEmployee(emp) && (
                                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black tracking-wide">
                                                                    {t('staff.roles.accountOwner', { defaultValue: 'Owner' })}
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{emp.username}</p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getRoleStyle(emp.role)}`}>
                                                    <Shield size={10} />
                                                    {getRoleLabel(emp.role)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('staff.table.contact')}</p>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            <Mail size={12} className="text-gray-400 flex-shrink-0" />
                                                            <span className="truncate">{emp.email || t('owner.staff.noEmail')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            <Phone size={12} className="text-gray-400 flex-shrink-0" />
                                                            <span className="truncate">{emp.phone || t('owner.staff.noPhone')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('common.status.label', 'Status')}</p>
                                                    {getStatusBadge(emp.isActive)}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('staff.table.status')}</p>
                                                    {getAccountStatusContent(emp.hasActiveShift)}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('owner.staff.access')}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAccessModalEmployee(emp)}
                                                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:text-mintcom-green transition-colors"
                                                    >
                                                        <MapPin size={14} className="text-mintcom-green" />
                                                        {t('owner.staff.locationsCount', {
                                                            count: accessCount,
                                                            defaultValue: accessCount === 1 ? '1 location' : '{{count}} locations',
                                                        })}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                                                <button
                                                    onClick={() => {
                                                        openEditEmployee(emp);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all text-xs font-bold touch-target"
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
                                    <thead className="bg-gray-50 dark:bg-white/[0.02]">
                                        <tr className="border-b border-gray-200 dark:border-white/5">
                                            <th
                                                className="px-6 py-4 text-left dashboard-card-label cursor-pointer hover:text-mintcom-green transition-colors"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {t('staff.table.name')}
                                                    {sortConfig?.key === 'name' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-center dashboard-card-label cursor-pointer hover:text-mintcom-green transition-colors"
                                                onClick={() => handleSort('role')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('staff.table.role')}
                                                    {sortConfig?.key === 'role' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center dashboard-card-label">{t('staff.table.contact')}</th>
                                            <th
                                                className="px-6 py-4 text-center dashboard-card-label cursor-pointer hover:text-mintcom-green transition-colors"
                                                onClick={() => handleSort('status')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('common.status.label', 'Status')}
                                                    {sortConfig?.key === 'status' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-center dashboard-card-label cursor-pointer hover:text-mintcom-green transition-colors"
                                                onClick={() => handleSort('accountStatus')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('staff.table.status')}
                                                    {sortConfig?.key === 'accountStatus' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-center dashboard-card-label cursor-pointer hover:text-mintcom-green transition-colors"
                                                onClick={() => handleSort('access')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('owner.staff.access')}
                                                    {sortConfig?.key === 'access' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center dashboard-card-label">{t('owner.locations.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {paginatedEmployees.map((emp) => {
                                            const activeAssignments = getActiveAssignments(emp);
                                            const accessCount = activeAssignments.length;

                                            return (
                                                <tr
                                                    key={emp.id}
                                                    className={`group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${isOwnerEmployee(emp) ? 'bg-amber-50/40 dark:bg-amber-500/[0.04]' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform duration-300">
                                                                {getDisplayInitial(emp.firstName, emp.username)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                                                    <span>{emp.firstName} {emp.lastName}</span>
                                                                    {isOwnerEmployee(emp) && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black tracking-wide">
                                                                            {t('staff.roles.accountOwner', { defaultValue: 'Owner' })}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-gray-500">{emp.username}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getRoleStyle(emp.role)}`}>
                                                            <Shield size={10} />
                                                            {getRoleLabel(emp.role)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="space-y-1 flex flex-col items-center justify-center">
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <Mail size={12} className="text-gray-400" />
                                                                <span className="font-medium">{emp.email || t('owner.staff.noEmail')}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <Phone size={12} className="text-gray-400" />
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
                                                            className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:text-mintcom-green transition-colors"
                                                        >
                                                            <MapPin size={14} className="text-mintcom-green" />
                                                            {t('owner.staff.locationsCount', {
                                                                count: accessCount,
                                                                defaultValue: accessCount === 1 ? '1 location' : '{{count}} locations',
                                                            })}
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    openEditEmployee(emp);
                                                                }}
                                                                aria-label={t('common.edit')}
                                                                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-90"
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
                                                                    className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all active:scale-90 shadow-sm ${activeMenu === emp.id ? 'bg-mintcom-green text-black border-mintcom-green' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'}`}
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
                                                                        className="w-full flex items-center gap-3 px-4 py-3 label-strong font-outfit text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
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
                                                                        className={`w-full flex items-center gap-3 px-4 py-3 label-strong font-outfit transition-colors text-left border-t border-gray-100 dark:border-white/5 ${isOwnerEmployee(emp) ? 'text-amber-600 dark:text-amber-400 cursor-not-allowed opacity-75' : 'text-mintcom-red hover:bg-red-50 dark:hover:bg-red-900/10'}`}
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
                    phone: editingEmployee.phone ?? undefined,
                    permissions: primaryEditingAssignment?.permissions || [],
                    customRoleId: primaryEditingAssignment?.customRoleId,
                    backofficeAccess: primaryEditingAssignment?.backofficeAccess,
                    backofficePermissions: primaryEditingAssignment?.backofficePermissions,
                    allowedDiscounts: (editingEmployee as any).allowedDiscounts || [],
                    establishmentIds: getActiveAssignments(editingEmployee).map(a => a.establishmentId),
                    assignments: getActiveAssignments(editingEmployee),
                } : null}
            />

            {accessModalEmployee && createPortal(
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setAccessModalEmployee(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-full max-w-lg rounded-[2rem] bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 overflow-hidden"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-white/5">
                            <div>
                                <p className="text-xs font-black tracking-[0.18em] uppercase text-mintcom-green mb-2">
                                    {t('owner.staff.accessRights', 'Access Rights')}
                                </p>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                    {accessModalEmployee.firstName} {accessModalEmployee.lastName}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{accessModalEmployee.username}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAccessModalEmployee(null)}
                                aria-label={t('common.close', 'Close')}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div className="flex items-center justify-between rounded-2xl bg-gray-50 dark:bg-white/5 px-4 py-3 border border-gray-200 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <MapPin size={16} className="text-mintcom-green" />
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {t('owner.staff.accessLocations', 'Accessible Locations')}
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
                                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 px-4 py-8 text-center">
                                    <p className="text-sm font-medium text-gray-500">
                                        {t('owner.staff.noLocationsAssigned')}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {getActiveAssignments(accessModalEmployee).map((assignment) => (
                                        <div
                                            key={assignment.assignmentsId}
                                            className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 dark:border-white/5 px-4 py-3"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {assignment.establishmentName}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {t('staff.table.role')}: {getRoleLabel(assignment.role)}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getRoleStyle(assignment.role)}`}>
                                                <Shield size={10} />
                                                {getRoleLabel(assignment.role)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && employeeToDelete && createPortal(
                <div className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans transition-all duration-300">
                    <motion.div 
                       initial={{ opacity: 0, scale: 0.95, y: 20 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden h-[92vh] sm:h-auto sm:max-h-[85vh] flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/5 relative z-10"
                    >
                        {/* Mobile Drag Handle */}
                        <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
                          <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="p-10 pb-6 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mb-8 shadow-sm">
                                <AlertTriangle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-3 leading-tight">
                                {t('security.modes.deleteEmployee.title')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold leading-relaxed max-w-[300px]">
                                {t('security.modes.deleteEmployee.warning', {
                                    name: `${employeeToDelete.firstName} ${employeeToDelete.lastName}`.trim(),
                                })}
                            </p>
                        </div>

                        <div className="px-10 pb-8 space-y-5">
                            <div>
                                <label className="text-[10px] font-normal  tracking-[0.2em] text-gray-400 mb-2.5 block px-1">
                                    {formatInputLabel(t('common.password'), t('common.locale'))}
                                </label>
                                <div className="relative group">
                                    <input maxLength={255}
                                        type={showDeletePassword ? 'text' : 'password'}
                                        value={deletePassword}
                                        onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                                        placeholder={formatInputPlaceholder(t('owner.staff.enterPasswordPlaceholder'), t('common.locale'))}
                                        className={`w-full bg-gray-50 dark:bg-black/20 border ${deleteError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/5'} rounded-2xl px-5 py-4 pr-12 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all shadow-sm`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {deleteError && <p className="mt-2.5 px-1 text-[11px] font-black text-red-500 flex items-center gap-1.5 animate-pulse"><AlertTriangle size={12} /> {deleteError}</p>}
                            </div>
                        </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 dark:border-white/5 flex items-center gap-4 bg-gray-50/50 dark:bg-black/20">
                            <button
                                onClick={closeDeleteModal}
                                className="flex-1 py-4 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-black text-xs tracking-widest uppercase hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting || !deletePassword}
                                className="flex-[1.5] py-4 rounded-2xl bg-red-500 text-white font-black text-xs tracking-widest uppercase hover:bg-red-600 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 shadow-xl shadow-red-500/20 active:scale-95"
                            >
                                {isDeleting ? (
                                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 size={18} strokeWidth={2.5} />
                                        {t('popups.deleteEmployee.button', 'Deactivate Member')}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}


        </div>
    );
}






import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Search,
    Users,
    Shield,
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
import { Pagination } from '../../components/ui';
import { CustomSelect } from '../../components/CustomSelect';

interface EmployeeAssignment {
    establishmentId: string;
    establishmentName: string;
    role: string;
    permissions: string[];
    assignmentsId: string;
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
    role: string;
    accessLevel: string;
    establishments: string[];
    assignments: EmployeeAssignment[];
    hasActiveShift?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'role' | 'status' | 'access';
const MAX_EMPLOYEES_PER_ACCOUNT = 50;
const EMPLOYEE_LIMIT_POPUP_MESSAGE =
    `Maximum is ${MAX_EMPLOYEES_PER_ACCOUNT} employees.\n` +
    `To add more than ${MAX_EMPLOYEES_PER_ACCOUNT} employees, contact PayMint support at support@PayMint.app with your account email and password.`;

export function OwnerEmployeesPage() {
    const { t } = useTranslation();
    const { establishments, account } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');



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

    const openDeleteModal = (emp: Employee) => {
        setEmployeeToDelete(emp);
        setDeletePassword('');
        setDeleteError('');
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setEmployeeToDelete(null);
        setDeletePassword('');
        setDeleteError('');
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
                data: { email: account.email, password: deletePassword }
            });
            toast.success(t('owner.staff.staffRemoved'));
            closeDeleteModal();
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

    const handleOpenAddEmployeeModal = () => {
        if (employees.length >= MAX_EMPLOYEES_PER_ACCOUNT) {
            window.alert(EMPLOYEE_LIMIT_POPUP_MESSAGE);
            return;
        }
        setEditingEmployee(null);
        setIsFormModalOpen(true);
    };

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

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredEmployees = useMemo(() => {
        const result = employees.filter(emp => {
            const matchesSearch =
                `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                emp.username.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' ? emp.hasActiveShift : !emp.hasActiveShift);
            return matchesSearch && matchesRole && matchesStatus;
        });

        // Sorting
        if (sortConfig) {
            result.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortConfig.key) {
                    case 'name':
                        aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
                        bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
                        break;
                    case 'role':
                        aValue = a.role?.toLowerCase() || '';
                        bValue = b.role?.toLowerCase() || '';
                        break;
                    case 'status':
                        aValue = a.hasActiveShift ? 1 : 0;
                        bValue = b.hasActiveShift ? 1 : 0;
                        break;
                    case 'access':
                        aValue = a.assignments?.length || 0;
                        bValue = b.assignments?.length || 0;
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
    }, [employees, searchQuery, roleFilter, statusFilter, sortConfig]);

    // Reset to page 1 when filters or sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter, statusFilter, sortConfig]);

    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEmployees, currentPage]);

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

    const getRoleBadge = (role: string) => {
        const base = "px-2.5 py-1 rounded-lg text-xs font-black tracking-wider border";
        switch (role?.toUpperCase()) {
            case 'ADMIN':
                return <span className={`${base} bg-paymint-green/10 text-paymint-green border-paymint-green/20`}>{t('staff.roles.admin')}</span>;
            case 'MANAGER':
                return <span className={`${base} bg-purple-500/10 text-purple-500 border-purple-500/20`}>{t('staff.roles.manager')}</span>;
            case 'USER':
                return <span className={`${base} bg-blue-500/10 text-blue-500 border-blue-500/20`}>{t('staff.roles.user')}</span>;
            default:
                return <span className={`${base} bg-gray-500/10 text-gray-500 border-gray-500/20`}>{role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : ''}</span>;
        }
    };

    const getStatusBadge = (isActive: boolean | undefined) => {
        if (isActive) {
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold tracking-wide w-fit mx-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t('common.status.active')}
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-paymint-red/10 text-paymint-red border border-paymint-red/20 text-xs font-bold tracking-wide w-fit mx-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-paymint-red" />
                {t('common.status.inactive')}
            </span>
        );
    };

    const stats = useMemo(() => ({
        total: employees.length,
        admins: employees.filter(e => e.role === 'ADMIN').length,
        staff: employees.filter(e => e.role !== 'ADMIN').length,
        active: employees.filter(e => e.hasActiveShift).length
    }), [employees]);



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
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-sm"
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
                    { label: t('owner.staff.activeNow'), info: t('owner.staff.activeInfo'), value: stats.active, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: t('owner.staff.admins'), info: t('owner.staff.adminsInfo'), value: stats.admins, icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: t('owner.staff.standardUsers'), info: t('owner.staff.standardInfo'), value: stats.staff, icon: Star, color: 'text-orange-500', bg: 'bg-orange-500/10' },
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
                            <div>
                                <p className="dashboard-card-label mb-1">{stat.label}</p>
                                <p className="dashboard-card-value mb-2">{stat.value}</p>
                                <p className="dashboard-card-meta">{stat.info}</p>
                            </div>
                        </div>
                    </div>
                ))
                }
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div id="tour-search-input" className="relative flex-1 min-w-[300px]">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder={t('owner.staff.searchPlaceholder')}
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
                        <div id="tour-filters" className="flex gap-3">
                            <div className="w-36">
                                <CustomSelect
                                    value={roleFilter}
                                    onChange={(val) => setRoleFilter(val as string)}
                                    options={[
                                        { label: t('owner.staff.allRoles'), value: 'all' },
                                        { label: t('staff.roles.admin'), value: 'ADMIN' },
                                        { label: t('staff.roles.user'), value: 'USER' }
                                    ]}
                                />
                            </div>
                            <div className="w-36">
                                <CustomSelect
                                    value={statusFilter}
                                    onChange={(val) => setStatusFilter(val as string)}
                                    options={[
                                        { label: t('owner.staff.allStatus'), value: 'all' },
                                        { label: t('common.status.active'), value: 'active' },
                                        { label: t('common.status.inactive'), value: 'inactive' }
                                    ]}
                                />
                            </div>
                        </div>

                        {/* View Mode Toggle */}
                        <div id="tour-view-toggle" className="flex items-center bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-1 h-[52px]">
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
                    </div>
                </div>
            </div>

            {/* Employee List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin" />
                    <p className="text-sm font-bold text-gray-400 tracking-widest">{t('owner.staff.loading')}</p>
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Users size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="dashboard-card-value">{searchQuery.trim() ? t('common.noResults') : t('owner.staff.noStaffFound')}</p>
                    <p className="text-sm font-bold text-gray-500 mt-1">{searchQuery.trim() ? t('common.noMatchingResults', { entity: 'staff', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' }) : t('owner.staff.noStaffDesc')}</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedEmployees.map((emp) => (
                        <div
                            key={emp.id}
                            className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg hover:border-indigo-500/30 p-6 transition-all duration-300 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            <span className="text-gray-900 dark:text-white font-bold text-xl">
                                                {emp.firstName.charAt(0).toUpperCase()}
                                            </span>
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0A0A0A]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-tight group-hover:text-indigo-500 transition-colors">
                                                {emp.firstName} {emp.lastName}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {emp.email || `@${emp.username}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenu(activeMenu === emp.id ? null : emp.id);
                                            }}
                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeMenu === emp.id && (
                                            <div
                                                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => {
                                                        setEditingEmployee(emp);
                                                        setIsFormModalOpen(true);
                                                        setActiveMenu(null);
                                                    }}
                                                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                    {t('owner.staff.editDetails')}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleDeleteEmployee(emp.id);
                                                        setActiveMenu(null);
                                                    }}
                                                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                    {t('owner.staff.remove')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    {getRoleBadge(emp.role)}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 dashboard-card-label uppercase">
                                        <MapPin size={12} />
                                        {t('owner.staff.accessLocations')}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {emp.assignments?.length > 0 ? (
                                            emp.assignments.slice(0, 3).map((assign, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-gray-50 dark:bg-white/5 rounded text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5 hover:border-indigo-500/20 transition-colors">
                                                    {assign.establishmentName}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="dashboard-card-meta italic">{t('owner.staff.noLocationsAssigned')}</span>
                                        )}
                                        {emp.assignments?.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-50 dark:bg-white/5 rounded dashboard-card-meta">
                                                +{emp.assignments.length - 3} {t('common.more')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 dashboard-card-label">
                        <div
                            className="col-span-4 cursor-pointer hover:text-paymint-green transition-colors flex items-center gap-1"
                            onClick={() => handleSort('name')}
                        >
                            {t('common.name')}
                            {sortConfig?.key === 'name' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                        </div>
                        <div
                            className="col-span-2 text-center cursor-pointer hover:text-paymint-green transition-colors flex items-center justify-center gap-1"
                            onClick={() => handleSort('role')}
                        >
                            {t('common.role')}
                            {sortConfig?.key === 'role' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                        </div>
                        <div
                            className="col-span-2 text-center cursor-pointer hover:text-paymint-green transition-colors flex items-center justify-center gap-1"
                            onClick={() => handleSort('status')}
                        >
                            {t('common.status.label')}
                            {sortConfig?.key === 'status' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                        </div>
                        <div
                            className="col-span-2 text-center cursor-pointer hover:text-paymint-green transition-colors flex items-center justify-center gap-1"
                            onClick={() => handleSort('access')}
                        >
                            {t('owner.staff.access')}
                            {sortConfig?.key === 'access' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                        </div>
                        <div className="col-span-2 text-center">{t('common.actions')}</div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {paginatedEmployees.map((emp) => (
                            <div
                                key={emp.id}
                                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center"
                            >
                                <div className="col-span-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white">
                                        {emp.firstName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</h3>
                                        <p className="dashboard-card-meta">{emp.username}</p>
                                    </div>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    {getRoleBadge(emp.role)}
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    {getStatusBadge(emp.hasActiveShift)}
                                </div>
                                <div className="col-span-2 text-sm font-bold text-gray-900 dark:text-white text-center">
                                    {t('owner.staff.locationsCount', { count: emp.assignments?.length || 0 })}
                                </div>
                                <div className="col-span-2 flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => { setEditingEmployee(emp); setIsFormModalOpen(true); }}
                                        className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold tracking-wide hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/5"
                                    >
                                        {t('common.edit')}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEmployee(emp.id)}
                                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination Controls */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />



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
                    permissions: editingEmployee.assignments?.[0]?.permissions || [],
                    customRoleId: editingEmployee.assignments?.[0]?.customRoleId,
                    backofficeAccess: editingEmployee.assignments?.[0]?.backofficeAccess,
                    backofficePermissions: editingEmployee.assignments?.[0]?.backofficePermissions,
                    allowedDiscounts: (editingEmployee as any).allowedDiscounts || [],
                    establishmentIds: editingEmployee.assignments?.map(a => a.establishmentId) || []
                } : null}
            />

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && employeeToDelete && (
                <div className="fixed inset-0 z-50 popup-surface flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div
                        className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-[2rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl"
                    >
                        <div className="p-8 pb-4">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">{t('owner.staff.removeStaffTitle')}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                {t('owner.staff.removeConfirm', { name: `${employeeToDelete.firstName} ${employeeToDelete.lastName}` })}
                            </p>
                        </div>

                        <div className="px-8 pb-6 space-y-4">
                            <div>
                                <label className="dashboard-card-label mb-2 block">
                                    {t('owner.staff.verifyPassword')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showDeletePassword ? 'text' : 'password'}
                                        value={deletePassword}
                                        onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                                        placeholder={t('owner.staff.passwordPlaceholder')}
                                        className={`w-full bg-gray-50 dark:bg-white/5 border ${deleteError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 pr-12 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
                                    >
                                        {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {deleteError && <p className="mt-2 text-xs font-bold text-red-500">{deleteError}</p>}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 bg-gray-50 dark:bg-white/[0.02]">
                            <button
                                onClick={closeDeleteModal}
                                className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold text-xs tracking-wider hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-bold text-xs tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        {t('common.confirm')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}



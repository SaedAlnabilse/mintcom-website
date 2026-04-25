import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

import {
    Users,
    Shield,
    Search,
    MapPin,
    UserPlus,
    Mail,
    AtSign,
    Edit2,
    Trash2,
    Grid3X3,
    List,
    X,
    MoreVertical,
    UserCheck,
    Eye,
    EyeOff,
    AlertTriangle
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { CustomSelect } from '../../components/CustomSelect';
import { EmployeeFormModal } from '../../components/forms/EmployeeFormModal';
import { useAuth } from '../../context/AuthContext';
import { Pagination } from '../../components/ui';
import { AppStrings } from '../../constants/AppStrings';

interface Employee {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string | null;
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
const MAX_EMPLOYEES_PER_ACCOUNT = 50;
const MAX_DELETE_PASSWORD_ATTEMPTS = 3;
const EMPLOYEE_LIMIT_POPUP_MESSAGE =
    `Maximum is ${MAX_EMPLOYEES_PER_ACCOUNT} employees.\n` +
    `To add more than ${MAX_EMPLOYEES_PER_ACCOUNT} employees, contact PayMint support at support@PayMint.app with your account email and password.`;

export default function BrandTeamPage() {
    const { t } = useTranslation();
    const { brandId: paramBrandId } = useParams<{ brandId: string }>();
    const context = useOutletContext<{ brand: any }>() || {};
    const brandId = context.brand?.id || paramBrandId;
    const { establishments, account, logout } = useAuth();

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
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deleteAttemptCount, setDeleteAttemptCount] = useState(0);

    const fetchBrandInfo = useCallback(async () => {
        try {
            const response = await api.get(`/api/brands/${brandId}`);
            setBrandName(response.data?.name || t('brand.dashboard.title'));
        } catch (err) {
            console.error('Failed to fetch brand info:', err);
        }
    }, [brandId, t]);

    const fetchEmployees = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/api/brands/${brandId}/employees`);
            setEmployees(response.data || []);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
            toast.error(t('owner.staff.syncError'));
        } finally {
            setIsLoading(false);
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

    const handleEditEmployee = (emp: Employee) => {
        setEditingEmployee(emp);
        setIsFormModalOpen(true);
        setActiveMenu(null);
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
        setDeletePassword('');
        setDeleteError('');
        setDeleteAttemptCount(0);
        setDeleteModalOpen(true);
        setActiveMenu(null);
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
            await api.delete(`/api/accounts/employees/${employeeToDelete.id}`, {
                data: { email: account.email, password: deletePassword },
                headers: { 'X-Skip-Auth-Redirect': 'true' }
            });
            toast.success(t('owner.staff.staffRemoved'));
            closeDeleteModal();
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

    const getRoleBadgeStyle = (role: string) => {
        const base = "px-2.5 py-1 rounded-lg text-xs font-black tracking-wider border";
        if (role.toUpperCase() === 'ADMIN') {
            return `${base} bg-paymint-green/10 text-paymint-green border-paymint-green/20`;
        }
        return `${base} bg-blue-500/10 text-blue-500 border-blue-500/20`;
    };

    const clearFilters = () => {
        setSearchQuery('');
        setRoleFilter('all');
        setLocationFilter('all');
        setSortBy('name');
        setSortOrder('asc');
    };

    const hasActiveFilters = searchQuery || roleFilter !== 'all' || locationFilter !== 'all';
    const hasFilters = roleFilter !== 'all' || locationFilter !== 'all';

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-paymint-green/20 rounded-full" />
                    <div className="w-16 h-16 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
                </div>
                <p className="text-sm font-bold text-gray-400 tracking-widest">{t('owner.staff.loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('owner.staff.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('owner.staff.subtitle')}</span>
                        {brandName && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green label-strong font-outfit border border-paymint-green/20">
                                {brandName}
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAddEmployee}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-[#68B390] transition-all shadow-sm"
                    >
                        <UserPlus size={18} />
                        <span>{t('staff.newEmployee')}</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: t('owner.staff.totalUsers'), value: stats.total, icon: Users, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-100 dark:bg-white/5' },
                    { label: t('staff.roles.user'), value: stats.users, icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: t('owner.staff.admins'), value: stats.admins, icon: Shield, color: 'text-paymint-green', bg: 'bg-paymint-green/10' },
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
                            <p className="dashboard-stat-title mb-1">{stat.label}</p>
                            <p className="dashboard-card-value">{stat.value}</p>
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
                        <input maxLength={255}
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
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Role Filter */}
                        <div className="w-36">
                            <CustomSelect
                                value={roleFilter}
                                onChange={(val) => setRoleFilter(val as RoleFilter)}
                                options={[
                                    { label: t('owner.staff.allRoles'), value: 'all' },
                                    { label: t('staff.roles.admin'), value: 'ADMIN' },
                                    { label: t('staff.roles.user'), value: 'CASHIER' },
                                ]}
                            />
                        </div>

                        {/* Location Filter */}
                        {locations.length > 1 && (
                            <div className="w-44">
                                <CustomSelect
                                    value={locationFilter}
                                    onChange={(val) => setLocationFilter(val as string)}
                                    options={[
                                        { label: t('owner.staff.allLocations'), value: 'all' },
                                        ...locations.map(loc => ({ label: loc.name, value: loc.id }))
                                    ]}
                                />
                            </div>
                        )}

                        {/* Sort */}
                        <div className="w-52">
                            <CustomSelect
                                value={sortBy}
                                onChange={(val) => setSortBy(val as SortOption)}
                                options={[
                                    { label: t('common.sortByName'), value: 'name' },
                                    { label: t('common.sortByRole'), value: 'role' },
                                    { label: t('common.sortByLocations'), value: 'locations' },
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
                        {hasFilters && (
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
                        </div>

                        {/* Team Display */}
                        {filteredEmployees.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                                <Users size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                                <p className="text-lg font-medium text-gray-900 dark:text-white">{searchQuery.trim() ? t('common.noResults') : t('owner.staff.noStaffFound')}</p>
                                {searchQuery.trim() && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {t('common.noMatchingResults', { entity: 'staff', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' })}
                                    </p>
                                )}
                                {!hasActiveFilters && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {t('owner.staff.addStaffDesc')}
                                    </p>
                                )}
                                {hasFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="mt-4 px-6 py-2 rounded-xl bg-paymint-green text-black text-sm font-bold hover:bg-[#68B390] transition-all"
                                    >
                                        {t('attributes.filters.reset')}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                                {viewMode === 'grid' ? (
                                    /* Grid View */
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                                        {paginatedEmployees.map((emp) => (
                                            <div
                                                key={emp.id}
                                                className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 p-6 transition-all shadow-sm hover:shadow-lg overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                                {/* Header */}
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center relative flex-shrink-0">
                                                            <span className="text-gray-900 dark:text-white font-bold text-xl">
                                                                {emp.firstName.charAt(0).toUpperCase()}
                                                            </span>
                                                            {emp.isActive && (
                                                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-paymint-green rounded-full border-2 border-white dark:border-[#0A0A0A]" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                                                {emp.firstName} {emp.lastName}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
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
                                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>

                                                        {activeMenu === emp.id && (
                                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                                            >
                                                                <button
                                                                    onClick={() => handleEditEmployee(emp)}
                                                                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <Edit2 size={16} />
                                                                    {t('common.edit')}
                                                                </button>
                                                                <button
                                                                    onClick={() => openDeleteModal(emp)}
                                                                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                    {t('common.remove')}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="mb-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide border ${emp.isActive
                                                        ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20 dark:bg-paymint-green/ dark:text-paymint-green dark:border-paymint-green/'
                                                        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-paymint-green' : 'bg-gray-400'}`} />
                                                        {emp.isActive ? AppStrings.STATUS.ACTIVE : AppStrings.STATUS.INACTIVE}
                                                    </span>
                                                </div>

                                                {/* Contact Info */}
                                                <div className="space-y-3 mb-6">
                                                    {emp.email && (
                                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                                                            <Mail size={16} className="text-gray-400" />
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate">{emp.email}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Access Rights */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="dashboard-card-label uppercase">{t('owner.staff.accessRights')}</p>
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{emp.establishments.length} {emp.establishments.length !== 1 ? t('common.locations') : t('common.location')}</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {emp.establishments.slice(0, 2).map((est, eIdx) => (
                                                            <div
                                                                key={eIdx}
                                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5"
                                                            >
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                                                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                                        {est.name}
                                                                    </span>
                                                                </div>
                                                                <span className={getRoleBadgeStyle(est.role)}>
                                                                    {getRoleDisplay(est.role)}
                                                                </span>
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
                                                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-white/5">
                                                    <button
                                                        onClick={() => handleEditEmployee(emp)}
                                                        className="flex-1 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 label-strong hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-gray-200 dark:border-white/5"
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
                                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                                        {/* Mobile Card View */}
                                        <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                                            {paginatedEmployees.map((emp) => (
                                                <div
                                                    key={emp.id}
                                                    className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center relative">
                                                            <span className="text-gray-900 dark:text-white font-bold text-sm">
                                                                {emp.firstName.charAt(0).toUpperCase()}
                                                            </span>
                                                            {emp.isActive && (
                                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-paymint-green rounded-full border-2 border-white dark:border-[#0A0A0A]" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {emp.firstName} {emp.lastName}
                                                            </h3>
                                                            <p className="dashboard-card-meta mt-0.5">@{emp.username}</p>
                                                        </div>
                                                        <div className="ml-auto flex gap-2">
                                                            <button
                                                                onClick={() => handleEditEmployee(emp)}
                                                                className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                                                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                                            <p className="text-gray-500 mb-1">{t('common.role')}</p>
                                                            <span className={getRoleBadgeStyle(emp.establishments[0]?.role || 'USER')}>
                                                                {getRoleDisplay(emp.establishments[0]?.role || 'USER')}
                                                            </span>
                                                        </div>
                                                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                                            <p className="text-gray-500 mb-1">{t('brand.dashboard.locations')}</p>
                                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {emp.establishments.length} {t('brand.dashboard.locations')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table Header */}
                                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 table-header-row">
                                            <div className="col-span-4">{t('common.name')}</div>
                                            <div className="col-span-2 text-center">{t('common.status.label')}</div>
                                            <div className="col-span-2 text-center">{t('common.role')}</div>
                                            <div className="col-span-2 text-center">{t('common.locations')}</div>
                                            <div className="col-span-2 text-center">{t('common.actions')}</div>
                                        </div>

                                        {/* Table Body */}
                                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                                            {paginatedEmployees.map((emp) => (
                                                <div
                                                    key={emp.id}
                                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                                    onClick={() => handleEditEmployee(emp)}
                                                >

                                                    {/* Member Info */}
                                                    <div className="col-span-4 flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center relative">
                                                            <span className="text-gray-900 dark:text-white font-bold text-sm">
                                                                {emp.firstName.charAt(0).toUpperCase()}
                                                            </span>
                                                            {emp.isActive && (
                                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-paymint-green rounded-full border-2 border-white dark:border-[#0A0A0A]" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {emp.firstName} {emp.lastName}
                                                            </h3>
                                                            <p className="dashboard-card-meta mt-0.5">@{emp.username}</p>
                                                        </div>
                                                    </div>

                                                    {/* Status */}
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium tracking-wider border ${emp.isActive
                                                            ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20 dark:bg-paymint-green/ dark:text-paymint-green dark:border-paymint-green/'
                                                            : 'bg-gray-100 text-gray-500 border-gray-200'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-paymint-green' : 'bg-gray-400'}`} />
                                                            {emp.isActive ? AppStrings.STATUS.ACTIVE : AppStrings.STATUS.INACTIVE}
                                                        </span>
                                                    </div>

                                                    {/* Primary Role */}
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        {emp.establishments[0] && (
                                                            <span className={getRoleBadgeStyle(emp.establishments[0].role)}>
                                                                {getRoleDisplay(emp.establishments[0].role)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Locations Count */}
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            {emp.establishments.length} {emp.establishments.length !== 1 ? t('common.locations') : t('common.location')}
                                                        </span>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="col-span-2 flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditEmployee(emp); }}
                                                            className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold tracking-wide hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center gap-2 border border-gray-200 dark:border-white/5"
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
                    permissions: (editingEmployee as any).permissions || [],
                    allowedDiscounts: (editingEmployee as any).allowedDiscounts || [],
                    customRoleId: (editingEmployee as any).customRoleId,
                    establishmentIds: editingEmployee.establishments?.map(e => e.id) || []
                } : null}
            />

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && employeeToDelete && createPortal(
                <div className="fixed inset-0 z-[10001] popup-surface flex items-center justify-center p-4 bg-black/40 dark:bg-black/80 backdrop-blur-sm transition-all duration-300">
                    <motion.div 
                       initial={{ opacity: 0, scale: 0.95, y: 20 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-[2.5rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20"
                    >
                        <div className="p-10 pb-6 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mb-8 shadow-sm">
                                <AlertTriangle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-3 leading-tight">{t('owner.staff.removeStaff')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold leading-relaxed max-w-[320px]">
                                {t('owner.staff.removeStaffConfirmPrefix')}
                                <span className="text-gray-900 dark:text-white font-black mx-1">
                                    {employeeToDelete.firstName} {employeeToDelete.lastName}
                                </span>
                                {t('owner.staff.removeStaffConfirmFrom')}
                                <span className="text-gray-900 dark:text-white font-black mx-1">
                                    {brandName}
                                </span>
                                <span className="text-gray-900 dark:text-white font-black uppercase tracking-tighter text-[10px] bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                                    {t('owner.staff.brandLabel')}
                                </span>.
                                <br /><br />
                                <span className="text-xs opacity-70 font-medium italic">{t('owner.staff.undoneWarning')}</span>
                            </p>
                         </div>
                        <div className="px-10 pb-8 space-y-5">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5 block px-1">
                                    {t('common.password')}
                                </label>
                                <div className="relative group">
                                    <input maxLength={255}
                                        type={showDeletePassword ? 'text' : 'password'}
                                        value={deletePassword}
                                        onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                                        placeholder={t('owner.staff.enterPasswordPlaceholder')}
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
                                        {t('common.confirm')}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}        </div >
    );
}







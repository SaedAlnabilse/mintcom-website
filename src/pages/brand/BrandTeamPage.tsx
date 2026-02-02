import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Shield,
    Search,
    RefreshCw,
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

export function BrandTeamPage() {
    const { brandId } = useParams<{ brandId: string }>();
    const { establishments, account } = useAuth();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [brandName, setBrandName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [locationFilter, setLocationFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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

    useEffect(() => {
        if (brandId) {
            fetchEmployees();
            fetchBrandInfo();
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

    const fetchBrandInfo = async () => {
        try {
            const response = await api.get(`/api/brands/${brandId}`);
            setBrandName(response.data?.name || 'Brand');
        } catch (err) {
            console.error('Failed to fetch brand info:', err);
        }
    };

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/api/brands/${brandId}/employees`);
            setEmployees(response.data || []);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
            toast.error('Failed to load team data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmployeeSubmit = async (data: any) => {
        try {
            if (editingEmployee) {
                await api.put(`/api/accounts/employees/${editingEmployee.id}`, data);
                toast.success('Employee updated');
            } else {
                await api.post('/api/accounts/employees', data);
                toast.success('Employee added');
            }
            setIsFormModalOpen(false);
            setEditingEmployee(null);
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save employee');
            throw error; // Re-throw to let the modal know it failed
        }
    };

    const handleEditEmployee = (emp: Employee) => {
        setEditingEmployee(emp);
        setIsFormModalOpen(true);
        setActiveMenu(null);
    };

    const handleAddEmployee = () => {
        setEditingEmployee(null);
        setIsFormModalOpen(true);
    };

    const openDeleteModal = (emp: Employee) => {
        setEmployeeToDelete(emp);
        setDeletePassword('');
        setDeleteError('');
        setDeleteModalOpen(true);
        setActiveMenu(null);
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
            setDeleteError('Please enter your password');
            return;
        }

        setIsDeleting(true);
        setDeleteError('');

        try {
            await api.delete(`/api/accounts/employees/${employeeToDelete.id}`, {
                data: { email: account.email, password: deletePassword }
            });
            toast.success('Employee removed');
            closeDeleteModal();
            fetchEmployees();
        } catch (error: any) {
            setDeleteError(error.response?.data?.message || 'Incorrect password or failed to delete');
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
                case 'name':
                    comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                    break;
                case 'role':
                    const roleA = a.establishments[0]?.role || '';
                    const roleB = b.establishments[0]?.role || '';
                    comparison = roleA.localeCompare(roleB);
                    break;
                case 'locations':
                    comparison = a.establishments.length - b.establishments.length;
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [employees, searchQuery, roleFilter, locationFilter, sortBy, sortOrder]);

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
        return role.toUpperCase() === 'ADMIN' ? 'Admin' : 'User';
    };

    const getRoleBadgeStyle = (role: string) => {
        const base = "px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border";
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-paymint-green/20 rounded-full" />
                    <div className="w-16 h-16 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
                </div>
                <p className="text-sm font-bold text-gray-400 tracking-widest">Loading Team Data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-500 text-xs font-black tracking-widest border border-purple-500/20">
                            Team
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Team</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
                        Manage staff for {brandName}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchEmployees}
                        className="p-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleAddEmployee}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-sm"
                    >
                        <UserPlus size={18} />
                        <span>Add Staff</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Staff', value: stats.total, icon: Users, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-100 dark:bg-white/5' },
                    { label: 'Users', value: stats.users, icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Admins', value: stats.admins, icon: Shield, color: 'text-paymint-green', bg: 'bg-paymint-green/10' },
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Role Filter */}
                        <div className="w-36">
                            <CustomSelect
                                value={roleFilter}
                                onChange={(val) => setRoleFilter(val as RoleFilter)}
                                options={[
                                    { label: 'All Roles', value: 'all' },
                                    { label: 'Admin', value: 'ADMIN' },
                                    { label: 'User', value: 'CASHIER' },
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
                                        { label: 'All Locations', value: 'all' },
                                        ...locations.map(loc => ({ label: loc.name, value: loc.id }))
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
                                    { label: 'Sort by Role', value: 'role' },
                                    { label: 'Sort by Locations', value: 'locations' },
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
                            {roleFilter !== 'all' && (
                                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-400">
                                    Role: {roleFilter === 'CASHIER' ? 'User' : roleFilter === 'ADMIN' ? 'Admin' : 'All'}
                                </span>
                            )}
                            {locationFilter !== 'all' && (
                                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-400">
                                    Location: {locations.find(l => l.id === locationFilter)?.name}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-medium text-gray-400 ml-auto">
                            {filteredEmployees.length} staff
                        </span>
                    </div>
                )}
            </div>



            {/* Team Display */}
            {filteredEmployees.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Users size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">No staff found</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {hasActiveFilters ? 'Try adjusting your filters' : 'Add staff to see them here'}
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
                        {filteredEmployees.map((emp, index) => (
                            <motion.div
                                key={emp.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.03 }}
                                className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 p-6 transition-all shadow-sm hover:shadow-lg overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Header */}
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center relative flex-shrink-0">
                                            <span className="text-gray-900 dark:text-white font-bold text-xl">
                                                {emp.firstName.charAt(0).toUpperCase()}
                                            </span>
                                            {emp.isActive && (
                                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0A0A0A]" />
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

                                        <AnimatePresence>
                                            {activeMenu === emp.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                                >
                                                    <button
                                                        onClick={() => handleEditEmployee(emp)}
                                                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(emp)}
                                                        className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                        Remove
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mb-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide border ${emp.isActive
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                        {emp.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-3 mb-6">
                                    {emp.email && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                                            <Mail size={16} className="text-gray-400" />
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">{emp.email}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Access Rights */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-gray-500 tracking-wide">Access Rights</p>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{emp.establishments.length} Location{emp.establishments.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {emp.establishments.slice(0, 2).map((est, eIdx) => (
                                            <div
                                                key={eIdx}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5"
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
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
                                                <span className="text-xs font-medium text-gray-400">+ {emp.establishments.length - 2} more locations</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-white/5">
                                    <button className="flex-1 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold tracking-wide hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-gray-200 dark:border-white/5">
                                        <Edit2 size={14} />
                                        Edit
                                    </button>
                                    <button className="p-2.5 rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-100 dark:border-red-500/20">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                /* List View */
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 text-xs font-bold text-gray-500 tracking-wide">
                        <div className="col-span-4">Name</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Primary Role</div>
                        <div className="col-span-2">Locations</div>
                        <div className="col-span-2 text-center">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredEmployees.map((emp, index) => (
                                <motion.div
                                    key={emp.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                                >

                                    {/* Member Info */}
                                    {/* Member Info */}
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center relative">
                                            <span className="text-gray-900 dark:text-white font-bold text-sm">
                                                {emp.firstName.charAt(0).toUpperCase()}
                                            </span>
                                            {emp.isActive && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0A0A0A]" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">
                                                {emp.firstName} {emp.lastName}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">@{emp.username}</p>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 flex items-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide border ${emp.isActive
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                            : 'bg-gray-100 text-gray-500 border-gray-200'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                            {emp.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    {/* Primary Role */}
                                    <div className="col-span-2 flex items-center">
                                        {emp.establishments[0] && (
                                            <span className={getRoleBadgeStyle(emp.establishments[0].role)}>
                                                {getRoleDisplay(emp.establishments[0].role)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Locations Count */}
                                    <div className="col-span-2 flex items-center">
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {emp.establishments.length} location{emp.establishments.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleEditEmployee(emp)}
                                            className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold tracking-wide hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center gap-2 border border-gray-200 dark:border-white/5"
                                        >
                                            <Edit2 size={14} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(emp)}
                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Results Summary */}
            {filteredEmployees.length > 0 && (
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-bold text-gray-900 dark:text-white">{filteredEmployees.length}</span> of{' '}
                        <span className="font-bold text-gray-900 dark:text-white">{employees.length}</span> staff
                    </p>
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
            <AnimatePresence>
                {deleteModalOpen && employeeToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-[2rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl"
                        >
                            <div className="p-8 pb-4">
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Remove Staff</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    Remove <span className="font-bold text-gray-900 dark:text-white">{employeeToDelete.firstName} {employeeToDelete.lastName}</span>? This cannot be undone.
                                </p>
                            </div>

                            <div className="px-8 pb-6 space-y-4">
                                <div>
                                    <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showDeletePassword ? 'text' : 'password'}
                                            value={deletePassword}
                                            onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                                            placeholder="Enter your account password"
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
                                    Cancel
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
                                            Confirm
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

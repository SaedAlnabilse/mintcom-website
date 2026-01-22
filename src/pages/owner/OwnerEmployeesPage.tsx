import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Users,
    Shield,
    Edit2,
    Trash2,
    UserPlus,
    RefreshCw,
    MapPin,
    ArrowUpRight,
    Star,
    Eye,
    EyeOff,
    AlertTriangle,
    Grid3X3,
    List,
    MoreVertical,
    UserCheck,
    HelpCircle
} from 'lucide-react';
import { QuickInfo } from '../../components/QuickInfo';
import api from '../../config/api';
import { EmployeeFormModal } from '../../components/forms/EmployeeFormModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { CustomSelect } from '../../components/CustomSelect';
import { TourGuide, type TourStep } from '../../components/TourGuide';

interface EmployeeAssignment {
    establishmentId: string;
    establishmentName: string;
    role: string;
    permissions: string[];
    assignmentsId: string;
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

export function OwnerEmployeesPage() {
    const { establishments, account } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // Tour state
    const [isTourOpen, setIsTourOpen] = useState(false);

    const tourSteps: TourStep[] = [
        {
            targetId: 'tour-stats-grid',
            title: 'Workforce Overview',
            description: 'Get a quick snapshot of your total employees, active staff, and role distribution across all locations.'
        },
        {
            targetId: 'tour-search-input',
            title: 'Smart Search',
            description: 'Quickly find any employee by name, email, or username. The list updates instantly as you type.'
        },
        {
            targetId: 'tour-filters',
            title: 'Filter by Role',
            description: 'Focus on specific groups like Admins or Staff to manage permissions more effectively.'
        },
        {
            targetId: 'tour-view-toggle',
            title: 'Flexible Views',
            description: 'Switch between a detailed list view for management or a grid card view for a visual overview.'
        },
        {
            targetId: 'tour-add-employee-btn',
            title: 'Induct Personnel',
            description: 'Ready to grow? Click here to add new team members and assign them to specific locations.'
        }
    ];

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClick = () => setActiveMenu(null);
        if (activeMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [activeMenu]);

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/accounts/all-employees');
            setEmployees(response.data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            toast.error('Failed to synchronize workforce data');
        } finally {
            setIsLoading(false);
        }
    };

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
            setDeleteError('Please enter your password');
            return;
        }

        setIsDeleting(true);
        setDeleteError('');

        try {
            // Call delete with password verification
            await api.delete(`/api/accounts/employees/${employeeToDelete.id}`, {
                data: { email: account.email, password: deletePassword }
            });
            toast.success('Employee removed successfully');
            closeDeleteModal();
            fetchEmployees();
        } catch (error: any) {
            setDeleteError(error.response?.data?.message || 'Incorrect password or failed to delete');
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

    const handleEmployeeSubmit = async (data: any) => {
        try {
            if (editingEmployee) {
                await api.put(`/api/accounts/employees/${editingEmployee.id}`, data);
                toast.success('Employee updated successfully');
            } else {
                await api.post('/api/accounts/employees', data);
                toast.success('Employee added successfully');
            }
            setIsFormModalOpen(false);
            setEditingEmployee(null);
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save employee');
            throw error; // Re-throw to let the modal know it failed
        }
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch =
                `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                emp.username.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [employees, searchQuery, roleFilter]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter]);

    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEmployees, currentPage]);

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

    const getRoleBadge = (role: string) => {
        const base = "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border";
        switch (role?.toUpperCase()) {
            case 'ADMIN':
                return <span className={`${base} bg-paymint-green/10 text-paymint-green border-paymint-green/20`}>ADMIN</span>;
            case 'MANAGER':
                return <span className={`${base} bg-purple-500/10 text-purple-500 border-purple-500/20`}>MANAGER</span>;
            case 'USER':
                return <span className={`${base} bg-blue-500/10 text-blue-500 border-blue-500/20`}>STAFF</span>;
            default:
                return <span className={`${base} bg-gray-500/10 text-gray-500 border-gray-500/20`}>{role}</span>;
        }
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
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black uppercase tracking-widest border border-paymint-green/20">
                            Unified Access Control
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Global Workforce</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Manage personnel across {establishments.length} operational nodes.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsTourOpen(true)}
                        className="p-3 rounded-xl bg-white dark:bg-white/5 text-gray-400 hover:text-paymint-green border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                        title="Start Tour"
                    >
                        <HelpCircle size={18} />
                    </button>
                    <button
                        id="tour-refresh-btn"
                        onClick={fetchEmployees}
                        className="p-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        id="tour-add-employee-btn"
                        onClick={() => { setEditingEmployee(null); setIsFormModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-paymint-green/20"
                    >
                        <UserPlus size={18} />
                        <span>Induct Personnel</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div id="tour-stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Workforce', info: 'Total number of registered employees across all locations.', value: stats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Active Now', info: 'Employees currently clocked in or managing active sessions.', value: stats.active, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Administrators', info: 'Users with full system access and configuration privileges.', value: stats.admins, icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Staff Members', info: 'Standard users with restricted access based on assigned roles.', value: stats.staff, icon: Star, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{stat.label}</p>
                            <QuickInfo text={stat.info} />
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
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
                            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchQuery ? 'text-paymint-green' : 'text-gray-400'}`}
                        />
                        <input
                            type="text"
                            placeholder="Filter by name, email or node..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-paymint-green/10 focus:border-paymint-green/50 dark:focus:border-paymint-green/50 focus:bg-white dark:focus:bg-white/10 transition-all h-[52px] shadow-sm hover:shadow-md focus:shadow-lg"
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-3 flex-wrap lg:ml-auto">
                        <div id="tour-filters" className="w-44">
                            <CustomSelect
                                value={roleFilter}
                                onChange={(val) => setRoleFilter(val as string)}
                                options={[
                                    { label: 'All Roles', value: 'all' },
                                    { label: 'Admin', value: 'ADMIN' },
                                    { label: 'User', value: 'USER' }
                                ]}
                            />
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
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Synchronizing Personnel...</p>
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Users size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">No personnel found</p>
                    <p className="text-sm text-gray-500 mt-1">Adjust filters or induct new team members</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {paginatedEmployees.map((emp, index) => (
                            <motion.div
                                key={emp.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: (index % itemsPerPage) * 0.03 }}
                                className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 p-6 transition-all shadow-sm hover:shadow-lg overflow-hidden"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center relative flex-shrink-0">
                                            <span className="text-gray-900 dark:text-white font-bold text-xl">
                                                {emp.firstName.charAt(0).toUpperCase()}
                                            </span>
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0A0A0A]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
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

                                        <AnimatePresence>
                                            {activeMenu === emp.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
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
                                                        Edit Details
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleDeleteEmployee(emp.id);
                                                            setActiveMenu(null);
                                                        }}
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

                                <div className="mb-6">
                                    {getRoleBadge(emp.role)}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                        <MapPin size={12} />
                                        Access Locations
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {emp.assignments?.length > 0 ? (
                                            emp.assignments.slice(0, 3).map((assign, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-gray-50 dark:bg-white/5 rounded text-[10px] font-medium text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5">
                                                    {assign.establishmentName}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No locations assigned</span>
                                        )}
                                        {emp.assignments?.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-50 dark:bg-white/5 rounded text-[10px] font-medium text-gray-500">
                                                +{emp.assignments.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wide">
                        <div className="col-span-4">Personnel</div>
                        <div className="col-span-2">Role</div>
                        <div className="col-span-2">Access</div>
                        <div className="col-span-4 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {paginatedEmployees.map((emp, index) => (
                                <motion.div
                                    key={emp.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ delay: (index % itemsPerPage) * 0.02 }}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center"
                                >
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white">
                                            {emp.firstName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</h3>
                                            <p className="text-xs text-gray-500">{emp.username}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        {getRoleBadge(emp.role)}
                                    </div>
                                    <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {emp.assignments?.length || 0} Locations
                                    </div>
                                    <div className="col-span-4 flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => { setEditingEmployee(emp); setIsFormModalOpen(true); }}
                                            className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wide hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/5"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEmployee(emp.id)}
                                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Page <span className="text-gray-900 dark:text-white">{currentPage}</span> of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 transition-all"
                            title="Previous Page"
                        >
                            <ArrowUpRight size={18} className="rotate-[225deg]" />
                        </button>
                        <div className="flex gap-1.5">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1
                                        ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                                        : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 transition-all"
                            title="Next Page"
                        >
                            <ArrowUpRight size={18} className="rotate-45" />
                        </button>
                    </div>
                </div>
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
                    permissions: editingEmployee.assignments?.[0]?.permissions || [],
                    establishmentIds: editingEmployee.assignments?.map(a => a.establishmentId) || []
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
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Terminate Access</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    Are you sure you want to remove <span className="font-bold text-gray-900 dark:text-white">{employeeToDelete.firstName} {employeeToDelete.lastName}</span> from the workforce? This action is irreversible.
                                </p>
                            </div>

                            <div className="px-8 pb-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                        Verify Password
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
                                    className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
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

            {/* Tour Guide */}
            <TourGuide
                steps={tourSteps}
                isOpen={isTourOpen}
                onClose={() => setIsTourOpen(false)}
                onComplete={() => {
                    setIsTourOpen(false);
                    toast.success("You're all set! Enjoy managing your workforce.");
                }}
            />
        </div>
    );
}


import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Users,
    Shield,
    UserCheck,
    Plus,
    MapPin,
    RefreshCw,
    Grid3X3,
    List,
    Calendar,
    ExternalLink,
    MoreVertical,
    Eye,
    Trash2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { useAuth } from '../../context/AuthContext';
import { CustomSelect } from '../../components/CustomSelect';

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

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'date' | 'locations';

const createBrandSchema = z.object({
    name: z.string().min(2, 'Brand name must be at least 2 characters'),
    establishmentLoginId: z.string()
        .min(4, 'POS ID must be at least 4 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'POS ID can only contain letters, numbers, underscores, and hyphens'),
    establishmentPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type BrandFormData = z.infer<typeof createBrandSchema>;

export function OwnerBrandsPage() {
    const { establishments, refreshEstablishments } = useAuth();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEstablishments, setSelectedEstablishments] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortOrder] = useState<'asc' | 'desc'>('asc');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Wizard state
    const [wizardStep, setWizardStep] = useState(1);
    const [employeesForMerging, setEmployeesForMerging] = useState<EstablishmentEmployees[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [error, setError] = useState('');
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

    const { register, handleSubmit, formState: { errors }, reset, trigger } = useForm<BrandFormData>({
        resolver: zodResolver(createBrandSchema)
    });

    // Close menu when clicking outside
    useEffect(() => {
        const handleClick = () => setActiveMenu(null);
        if (activeMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
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

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/brands');
            setBrands(response.data);
        } catch (error) {
            console.error('Failed to fetch brands:', error);
            toast.error('Failed to load brands');
        } finally {
            setIsLoading(false);
        }
    };

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
            const isValid = await trigger();
            if (isValid) {
                setWizardStep(2);
                setError('');
            }
        } else if (wizardStep === 2) {
            if (selectedEstablishments.length < 2) {
                setError('Select at least 2 establishments to create a brand');
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
        reset();
    };

    const onCreateBrand = async (data: BrandFormData) => {
        if (selectedEstablishments.length < 2) {
            setError('Select at least 2 establishments to merge');
            return;
        }

        setIsCreating(true);
        try {
            await api.post('/api/brands', {
                ...data,
                establishmentIds: selectedEstablishments,
                mergeEmployeeIds: selectedEmployees,
            });
            toast.success('Brand created successfully!');
            handleCloseModal();
            fetchBrands();
            refreshEstablishments();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create brand');
            setError(error.response?.data?.message || 'Failed to create brand');
        } finally {
            setIsCreating(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const hasActiveFilters = searchQuery.trim().length > 0;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-paymint-green/20 rounded-full" />
                    <div className="w-16 h-16 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
                </div>
                <p className="text-sm font-bold text-gray-400 tracking-widest">Loading brands...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black tracking-widest border border-paymint-green/20">
                            Brand Engine
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Brand Portfolio</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Unified control plane for multi-establishment entities
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchBrands}
                        className="p-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    {availableEstablishments.length >= 2 && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-paymint-green/20"
                        >
                            <Plus size={18} />
                            <span>Create Brand</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Active Brands', value: stats.totalBrands, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Merged Locations', value: stats.totalMerged, icon: Link2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Available Nodes', value: stats.availableNodes, icon: Store, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
                        <div className="relative z-10 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 tracking-wide">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[300px]">
                        <Search
                            size={18}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchQuery ? 'text-paymint-green' : 'text-gray-400'}`}
                        />
                        <input
                            type="text"
                            placeholder="Search brands by name or POS ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-paymint-green/10 focus:border-paymint-green/50 dark:focus:border-paymint-green/50 focus:bg-white dark:focus:bg-white/10 transition-all h-[52px] shadow-sm hover:shadow-md focus:shadow-lg"
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-3 flex-wrap lg:ml-auto">
                        {/* Sort */}
                        <div className="w-44">
                            <CustomSelect
                                value={sortBy}
                                onChange={(val) => setSortBy(val as SortOption)}
                                options={[
                                    { label: 'Sort by Name', value: 'name' },
                                    { label: 'Sort by Date', value: 'date' },
                                    { label: 'Sort by Locations', value: 'locations' },
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
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <span className="text-xs font-bold text-gray-400 tracking-wide">Active filters:</span>
                        <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-400">
                            Search: "{searchQuery}"
                        </span>
                        <span className="text-xs font-medium text-gray-400 ml-auto">
                            {filteredBrands.length} of {brands.length} brands
                        </span>
                    </div>
                )}
            </div>

            {/* Brands Display */}
            {filteredBrands.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Building2 size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {hasActiveFilters ? 'No brands found' : 'Portfolio Empty'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {hasActiveFilters ? 'Try adjusting your search' : 'Create a brand to merge multiple establishments'}
                    </p>
                    {!hasActiveFilters && availableEstablishments.length >= 2 && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-6 px-6 py-3 bg-paymint-green text-black font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-paymint-green/20 flex items-center gap-2 mx-auto"
                        >
                            <Link2 size={18} />
                            Create Your First Brand
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredBrands.map((brand, index) => (
                            <motion.div
                                key={brand.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
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
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">
                                                        {brand.name}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded bg-paymint-green/10 text-paymint-green text-[9px] font-black tracking-wide">
                                                        Active
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {brand.establishmentCount} Locations
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

                                            <AnimatePresence>
                                                {activeMenu === brand.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                        className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(`/brand/${brand.id}`, '_blank');
                                                            }}
                                                            className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                        >
                                                            <Eye size={16} />
                                                            View Dashboard
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
                                                            Dissolve Brand
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                                        <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl group-hover:border-purple-500/10 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Hash size={14} className="text-purple-500" />
                                                <span className="text-[9px] font-black text-gray-400 tracking-widest">POS ID</span>
                                            </div>
                                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white truncate">
                                                {brand.establishmentLoginId}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl group-hover:border-purple-500/10 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar size={14} className="text-blue-500" />
                                                <span className="text-[9px] font-black text-gray-400 tracking-widest">Created</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                {formatDate(brand.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Establishments */}
                                    <div className="space-y-3 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-400 tracking-widest">Fleet Composition</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {brand.establishments.slice(0, 4).map((est) => (
                                                <div key={est.id} className="px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-lg flex items-center gap-2 hover:border-purple-500/30 transition-all">
                                                    <Store size={12} className="text-gray-400" />
                                                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{est.name}</span>
                                                </div>
                                            ))}
                                            {brand.establishments.length > 4 && (
                                                <div className="px-3 py-2 bg-gray-100 dark:bg-white/5 rounded-lg">
                                                    <span className="text-[11px] font-bold text-gray-500">
                                                        +{brand.establishments.length - 4} more
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                        <button
                                            onClick={() => window.open(`/brand/${brand.id}`, '_blank')}
                                            className="flex-1 py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold tracking-wide hover:bg-purple-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn border border-gray-200 dark:border-white/5 hover:border-purple-500 shadow-sm hover:shadow-purple-500/20"
                                        >
                                            <span>Open Dashboard</span>
                                            <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
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
                        <div className="col-span-4">Brand</div>
                        <div className="col-span-2">POS ID</div>
                        <div className="col-span-2">Locations</div>
                        <div className="col-span-2">Created</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredBrands.map((brand, index) => (
                                <motion.div
                                    key={brand.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 transition-colors cursor-pointer group ${brand.id === 'cmkek5eme0001vjjqvfm3wjwa'
                                        ? 'bg-paymint-green/[0.03] hover:bg-paymint-green/[0.05]'
                                        : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                                        }`}
                                    onClick={() => window.open(`/brand/${brand.id}`, '_blank')}
                                >
                                    {/* Brand Info */}
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center text-black shadow-lg shadow-paymint-green/10">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">
                                                    {brand.name}
                                                </h3>

                                            </div>
                                            <span className="px-2 py-0.5 rounded bg-paymint-green/10 text-paymint-green text-[9px] font-black">
                                                Active
                                            </span>
                                        </div>
                                    </div>

                                    {/* POS ID */}
                                    <div className="col-span-2 flex items-center">
                                        <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                                            {brand.establishmentLoginId}
                                        </span>
                                    </div>

                                    {/* Locations */}
                                    <div className="col-span-2 flex items-center">
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {brand.establishmentCount} locations
                                        </span>
                                    </div>

                                    {/* Created */}
                                    <div className="col-span-2 flex items-center">
                                        <span className="text-sm text-gray-500">
                                            {formatDate(brand.createdAt)}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex items-center justify-end gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(`/brand/${brand.id}`, '_blank');
                                            }}
                                            className="px-4 py-2 rounded-lg bg-paymint-green text-black text-xs font-bold tracking-wide hover:bg-emerald-400 transition-all flex items-center gap-2"
                                        >
                                            <Eye size={14} />
                                            View
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSecurityModal({
                                                    isOpen: true,
                                                    targetId: brand.id,
                                                    targetName: brand.name,
                                                    mode: 'dissolve-brand'
                                                });
                                            }}
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
            {filteredBrands.length > 0 && (
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-bold text-gray-900 dark:text-white">{filteredBrands.length}</span> of{' '}
                        <span className="font-bold text-gray-900 dark:text-white">{brands.length}</span> brands
                    </p>
                </div>
            )}

            {/* Create Brand Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="relative w-full max-w-4xl bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                        >
                            {/* Modal Sidebar */}
                            <div className="w-full md:w-72 bg-gray-50 dark:bg-white/[0.02] p-8 border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/5 flex flex-col justify-between shrink-0">
                                <div>
                                    <div className="w-14 h-14 rounded-xl bg-paymint-green flex items-center justify-center mb-6 shadow-lg shadow-paymint-green/20">
                                        <Link2 size={28} className="text-black" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-3">Create Brand</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">Merge multiple establishments into a unified brand entity.</p>
                                </div>

                                <div className="space-y-4 mt-8 hidden md:block">
                                    {[1, 2, 3].map((step) => (
                                        <div key={step} className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${wizardStep >= step ? 'bg-paymint-green border-paymint-green text-black' : 'border-gray-200 dark:border-white/10 text-gray-400'}`}>
                                                {wizardStep > step ? <UserCheck size={16} /> : <span className="text-xs font-bold">{step}</span>}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${wizardStep === step ? 'text-paymint-green' : 'text-gray-400'}`}>
                                                    {step === 1 ? 'Brand Details' : step === 2 ? 'Select Locations' : 'Merge Staff'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex flex-col">
                                <form onSubmit={handleSubmit(onCreateBrand)} className="flex-1">
                                    <AnimatePresence mode="wait">
                                        {wizardStep === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-500 tracking-wide block">Brand Name</label>
                                                        <input
                                                            {...register('name')}
                                                            placeholder="e.g. Alpha Group"
                                                            className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl py-4 px-5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all placeholder-gray-300 dark:placeholder-gray-600"
                                                        />
                                                        {errors.name && <p className="text-paymint-red text-xs font-bold">{errors.name.message as string}</p>}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-gray-500 tracking-wide block">POS Login ID</label>
                                                            <div className="relative">
                                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                                <input
                                                                    {...register('establishmentLoginId')}
                                                                    placeholder="brand-id"
                                                                    className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl py-4 pl-12 pr-5 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all lowercase"
                                                                />
                                                            </div>
                                                            {errors.establishmentLoginId && <p className="text-paymint-red text-xs font-bold">{errors.establishmentLoginId.message as string}</p>}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-gray-500 tracking-wide block">Password</label>
                                                            <div className="relative">
                                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                                <input
                                                                    type="password"
                                                                    {...register('establishmentPassword')}
                                                                    placeholder="••••••••"
                                                                    className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl py-4 pl-12 pr-5 font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
                                                                />
                                                            </div>
                                                            {errors.establishmentPassword && <p className="text-paymint-red text-xs font-bold">{errors.establishmentPassword.message as string}</p>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-5 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20 flex gap-4">
                                                    <Shield size={20} className="text-blue-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Unified Credentials</h4>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">These credentials will act as the master access for all merged establishments.</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {wizardStep === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-500 tracking-wide mb-4">Select Establishments to Merge</h4>
                                                    <p className="text-sm text-gray-500 mb-4">Select at least 2 establishments to create a brand.</p>
                                                    <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {availableEstablishments.map((est: any) => (
                                                            <div
                                                                key={est.id}
                                                                onClick={() => toggleEstablishment(est.id)}
                                                                className={`group p-5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedEstablishments.includes(est.id) ? 'bg-paymint-green/5 border-paymint-green/40' : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 hover:border-gray-300'}`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedEstablishments.includes(est.id) ? 'bg-paymint-green text-black' : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/5'}`}>
                                                                        <Store size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-900 dark:text-white">{est.name}</p>
                                                                        <p className="text-xs text-gray-500">{est.type || 'Standard'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedEstablishments.includes(est.id) ? 'bg-paymint-green border-paymint-green text-black' : 'border-gray-200 dark:border-white/10'}`}>
                                                                    {selectedEstablishments.includes(est.id) && <UserCheck size={14} />}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {error && <p className="p-4 bg-paymint-red/10 border border-paymint-red/20 rounded-xl text-paymint-red text-xs font-bold text-center">{error}</p>}
                                            </motion.div>
                                        )}

                                        {wizardStep === 3 && (
                                            <motion.div
                                                key="step3"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-xs font-bold text-gray-500 tracking-wide">Merge Staff (Optional)</h4>
                                                        <span className="px-3 py-1 bg-paymint-green/10 rounded-lg text-xs font-bold text-paymint-green">
                                                            {selectedEmployees.length} selected
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-4">Select employees who should have access across all brand locations.</p>

                                                    {loadingEmployees ? (
                                                        <div className="py-16 flex flex-col items-center justify-center space-y-4">
                                                            <RefreshCw className="w-10 h-10 text-paymint-green animate-spin" />
                                                            <p className="text-sm text-gray-400">Loading staff data...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                                            {employeesForMerging.map((group) => (
                                                                <div key={group.establishmentId} className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden">
                                                                    <div className="px-5 py-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-white/5">
                                                                        <div className="flex items-center gap-2">
                                                                            <MapPin size={14} className="text-paymint-green" />
                                                                            <span className="font-bold text-gray-900 dark:text-white text-sm">{group.establishmentName}</span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const allIn = group.employees.every(e => selectedEmployees.includes(e.employeeId));
                                                                                selectAllFromEstablishment(group, !allIn);
                                                                            }}
                                                                            className="text-xs font-bold text-paymint-green hover:underline"
                                                                        >
                                                                            Toggle All
                                                                        </button>
                                                                    </div>
                                                                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                        {group.employees.map((emp) => (
                                                                            <div
                                                                                key={emp.id}
                                                                                onClick={() => toggleEmployee(emp.employeeId)}
                                                                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${selectedEmployees.includes(emp.employeeId) ? 'bg-paymint-green/5 border-paymint-green/30' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gray-200'}`}
                                                                            >
                                                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${selectedEmployees.includes(emp.employeeId) ? 'bg-paymint-green text-black' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                                                                                    {selectedEmployees.includes(emp.employeeId) ? <UserCheck size={12} /> : <Users size={12} />}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</p>
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${getRoleBadgeColor(emp.role)}`}>{emp.role}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </form>

                                {/* Modal Actions */}
                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 flex items-center gap-3">
                                    {wizardStep > 1 && (
                                        <button
                                            onClick={handlePrevStep}
                                            className="px-6 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/[0.1] transition-all flex items-center gap-2 border border-gray-200 dark:border-white/5"
                                        >
                                            <ChevronLeft size={16} />
                                            Back
                                        </button>
                                    )}
                                    <button
                                        onClick={wizardStep < 3 ? handleNextStep : handleSubmit(onCreateBrand)}
                                        disabled={isCreating}
                                        className="flex-1 px-6 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-paymint-green/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                {wizardStep === 3 ? 'Create Brand' : 'Continue'}
                                                <ChevronRight size={16} />
                                            </>
                                        )}
                                    </button>
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

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Store,
    Search,
    DollarSign,
    Zap,
    Building2,
    Grid3X3,
    List,
    MoreVertical,
    ExternalLink,
    Settings,
    Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CustomSelect } from '../../components/CustomSelect';

const STATUS_OPTIONS = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Trial', value: 'TRIAL' },
    { label: 'Canceled', value: 'CANCELED' },
    { label: 'Expired', value: 'EXPIRED' }
];

const TYPE_OPTIONS = [
    { label: 'All Types', value: 'all' },
    { label: 'Restaurant', value: 'RESTAURANT' },
    { label: 'Cafe', value: 'CAFE' },
    { label: 'Retail', value: 'RETAIL' }
];

type ViewMode = 'grid' | 'list';

export function OwnerEstablishmentsPage() {
    const navigate = useNavigate();
    const { establishments, setCurrentEstablishment } = useAuth();
    const [searchParams] = useSearchParams();
    const highlightId = searchParams.get('highlight');

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const filteredEstablishments = useMemo(() => {
        return establishments.filter(est => {
            const matchesSearch = est.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                est.type?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || est.subscriptionStatus === statusFilter;
            const matchesType = typeFilter === 'all' || est.type?.toUpperCase() === typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [establishments, searchQuery, statusFilter, typeFilter]);

    const handleEstablishmentClick = (establishment: any) => {
        setCurrentEstablishment(establishment);
        localStorage.setItem('selectedEstablishmentId', establishment.id);
        window.open('/dashboard', '_blank');
    };

    const handleAddEstablishment = () => {
        navigate('/onboarding');
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'TRIAL':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'CANCELED':
            case 'EXPIRED':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    // Auto-scroll to highlighted item
    useEffect(() => {
        if (highlightId && filteredEstablishments.some(e => e.id === highlightId)) {
            const element = document.getElementById(`establishment-${highlightId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightId, filteredEstablishments]);


    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black uppercase tracking-widest border border-paymint-green/20">
                            Fleet Inventory
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Establishments</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Manage {establishments.length} operational units across your enterprise.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => navigate('/owner/brands')}
                        className="px-5 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <Building2 size={18} className="text-purple-500" />
                        <span>Manage Brands</span>
                    </button>
                    <button
                        onClick={handleAddEstablishment}
                        className="px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-paymint-green/20 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        <span>Add New Node</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Store size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Inventory</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{establishments.length}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="group relative p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-paymint-green/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Active Nodes</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {establishments.filter(e => e.subscriptionStatus === 'ACTIVE').length}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="group relative p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Settings size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Trial Instances</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {establishments.filter(e => e.subscriptionStatus === 'TRIAL').length}
                            </p>
                        </div>
                    </div>
                </motion.div>
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
                            placeholder="Search by name, ID, or type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-paymint-green/10 focus:border-paymint-green/50 dark:focus:border-paymint-green/50 focus:bg-white dark:focus:bg-white/10 transition-all h-[52px] shadow-sm hover:shadow-md focus:shadow-lg"
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-3 flex-wrap lg:ml-auto">
                        <div className="w-44">
                            <CustomSelect
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val)}
                                options={STATUS_OPTIONS}
                            />
                        </div>
                        <div className="w-44">
                            <CustomSelect
                                value={typeFilter}
                                onChange={(val) => setTypeFilter(val)}
                                options={TYPE_OPTIONS}
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
                    </div>
                </div>


            </div>

            {/* Establishments Grid */}
            {filteredEstablishments.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Store size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">No establishments found</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Add your first establishment to get started or adjust your searches
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredEstablishments.map((est, index) => (
                            <motion.div
                                key={est.id}
                                id={`establishment-${est.id}`}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.03 }}
                                className={`group relative bg-white dark:bg-[#1E293B] rounded-2xl border p-6 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer ${est.id === highlightId
                                    ? 'border-paymint-green ring-2 ring-paymint-green/50 shadow-xl shadow-paymint-green/20'
                                    : 'border-gray-200 dark:border-white/5 hover:border-blue-500/30'
                                    }`}
                                onClick={() => handleEstablishmentClick(est)}
                            >
                                {/* Hover gradient */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {est.id === highlightId && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <span className="bg-paymint-green text-black text-[10px] font-black px-2 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-widest shadow-sm">New</span>
                                    </div>
                                )}

                                {/* Content Container */}
                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                                                <Store size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors truncate max-w-[180px]">
                                                    {est.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-medium text-gray-500">{est.type || 'Standard'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                                    <span className="text-xs font-medium text-gray-500">{est.currency || 'JOD'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === est.id ? null : est.id);
                                                }}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            <AnimatePresence>
                                                {activeMenu === est.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                        className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEstablishmentClick(est);
                                                            }}
                                                            className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                        >
                                                            <Eye size={16} />
                                                            Enter Dashboard
                                                        </button>
                                                        <button
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                        >
                                                            <Settings size={16} />
                                                            Settings
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="mb-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(est.subscriptionStatus)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${est.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500' :
                                                est.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' :
                                                    'bg-red-500'
                                                }`} />
                                            {est.subscriptionStatus}
                                        </span>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5 group-hover:border-blue-500/10 transition-colors">
                                            <div className="flex items-center gap-2 mb-1 text-gray-400">
                                                <DollarSign size={12} />
                                                <p className="text-[10px] font-bold uppercase tracking-wide">Currency</p>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{est.currency || 'JOD'}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5 group-hover:border-blue-500/10 transition-colors">
                                            <div className="flex items-center gap-2 mb-1 text-gray-400">
                                                <Zap size={12} />
                                                <p className="text-[10px] font-bold uppercase tracking-wide">Status</p>
                                            </div>
                                            <p className="text-sm font-bold text-emerald-500">Online</p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEstablishmentClick(est);
                                        }}
                                        className="w-full py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wide hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn border border-gray-200 dark:border-white/5 hover:border-blue-500 shadow-sm hover:shadow-blue-500/20"
                                    >
                                        <span>Open Terminal</span>
                                        <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
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
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wide">
                        <div className="col-span-4">Establishment</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Currency</div>
                        <div className="col-span-2 text-center">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredEstablishments.map((est, index) => (
                                <motion.div
                                    key={est.id}
                                    id={`establishment-${est.id}`}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group ${est.id === highlightId
                                        ? 'bg-paymint-green/5 ring-1 ring-paymint-green inset-0 z-10'
                                        : ''
                                        }`}
                                    onClick={() => handleEstablishmentClick(est)}
                                >
                                    {/* Info */}
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-paymint-green transition-colors">
                                            <Store size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">
                                                {est.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5 md:hidden">{est.type}</p>
                                            {est.id === highlightId && (
                                                <span className="text-[10px] text-paymint-green font-bold uppercase tracking-wider ml-2">New</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Type */}
                                    <div className="col-span-2 flex items-center">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {est.type || 'Standard'}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 flex items-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(est.subscriptionStatus)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${est.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500' :
                                                est.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' :
                                                    'bg-red-500'
                                                }`} />
                                            {est.subscriptionStatus}
                                        </span>
                                    </div>

                                    {/* Currency */}
                                    <div className="col-span-2 flex items-center">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {est.currency || 'JOD'}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex items-center justify-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEstablishmentClick(est);
                                            }}
                                            className="px-4 py-2 rounded-lg bg-paymint-green text-black text-xs font-bold uppercase tracking-wide hover:bg-emerald-400 transition-all flex items-center gap-2"
                                        >
                                            Enter Dashboard
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}

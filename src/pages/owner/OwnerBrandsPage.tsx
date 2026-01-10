import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    Link2,
    Unlink,
    Loader2,
    Store,
    X,
    Hash,
    Lock,
    ExternalLink,
    ChevronRight,
    TrendingUp,
    Users,
    BarChart3
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface Brand {
    id: string;
    name: string;
    logo?: string;
    ownerPosId: string;
    establishmentCount: number;
    establishments: {
        id: string;
        name: string;
        type: string;
        currency: string;
    }[];
    createdAt: string;
}

const createBrandSchema = z.object({
    name: z.string().min(2, 'Brand name must be at least 2 characters'),
    ownerPosId: z.string()
        .min(4, 'POS ID must be at least 4 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'POS ID can only contain letters, numbers, underscores, and hyphens'),
    ownerPosPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export function OwnerBrandsPage() {
    const { establishments, refreshEstablishments } = useAuth();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEstablishments, setSelectedEstablishments] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [dissolvingBrandId, setDissolvingBrandId] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: zodResolver(createBrandSchema)
    });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const response = await api.get('/api/brands');
            setBrands(response.data);
        } catch (error) {
            console.error('Failed to fetch brands:', error);
        } finally {
            setIsLoading(false);
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

    const onCreateBrand = async (data: any) => {
        if (selectedEstablishments.length < 2) {
            toast.error('Select at least 2 establishments to merge');
            return;
        }

        setIsCreating(true);
        try {
            await api.post('/api/brands', {
                ...data,
                establishmentIds: selectedEstablishments
            });
            toast.success('Brand created successfully!');
            setShowCreateModal(false);
            setSelectedEstablishments([]);
            reset();
            fetchBrands();
            refreshEstablishments();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create brand');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDissolveBrand = async (brandId: string) => {
        if (!confirm('Are you sure you want to dissolve this brand? All establishments will become independent.')) {
            return;
        }

        setDissolvingBrandId(brandId);
        try {
            await api.delete(`/api/brands/${brandId}/dissolve`);
            toast.success('Brand dissolved successfully');
            fetchBrands();
            refreshEstablishments();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to dissolve brand');
        } finally {
            setDissolvingBrandId(null);
        }
    };

    const openBrandDashboard = (brandId: string) => {
        window.open(`/brand/${brandId}`, '_blank');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-paymint-green" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-gray-50 to-white dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/20">
                            <Building2 size={32} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Brand Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Merge establishments for unified brand control</p>
                        </div>
                    </div>

                    {availableEstablishments.length >= 2 && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-paymint-green/20"
                        >
                            <Link2 size={18} />
                            <span>Create Brand</span>
                        </button>
                    )}
                </div>

                {/* Stats */}
                <div className="relative z-10 grid grid-cols-3 gap-4 mt-8">
                    <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                                <Building2 size={20} className="text-paymint-green" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{brands.length}</p>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Brands</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Store size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">
                                    {brands.reduce((acc, b) => acc + b.establishmentCount, 0)}
                                </p>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Merged Locations</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <TrendingUp size={20} className="text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{availableEstablishments.length}</p>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Brands Grid */}
            {brands.length === 0 ? (
                <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 p-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-paymint-green/10 to-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Building2 size={40} className="text-paymint-green" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">No Brands Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                        Create brands to unify multiple establishments under one identity. Access aggregated analytics, shared employee management, and unified POS login.
                    </p>
                    {availableEstablishments.length >= 2 ? (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-8 py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-105 transition-all inline-flex items-center gap-3 shadow-lg shadow-paymint-green/20"
                        >
                            <Link2 size={20} />
                            Create Your First Brand
                        </button>
                    ) : (
                        <p className="text-sm text-gray-400">You need at least 2 establishments to create a brand.</p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {brands.map((brand) => (
                        <motion.div
                            key={brand.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-8 border border-gray-200 dark:border-white/[0.05] hover:border-paymint-green/50 dark:hover:border-paymint-green/30 transition-all group cursor-pointer relative overflow-hidden"
                            onClick={() => openBrandDashboard(brand.id)}
                        >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-paymint-green/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-paymint-green to-emerald-500 flex items-center justify-center shadow-lg shadow-paymint-green/20">
                                            <Building2 size={24} className="text-black" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{brand.name}</h3>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                                {brand.establishmentCount} Locations
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDissolveBrand(brand.id); }}
                                            disabled={dissolvingBrandId === brand.id}
                                            className="p-2 text-gray-400 hover:text-paymint-red hover:bg-paymint-red/10 rounded-xl transition-all"
                                            title="Dissolve Brand"
                                        >
                                            {dissolvingBrandId === brand.id ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Unlink size={18} />
                                            )}
                                        </button>
                                        <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green group-hover:bg-paymint-green group-hover:text-black transition-all">
                                            <ExternalLink size={18} />
                                        </div>
                                    </div>
                                </div>

                                {/* POS ID */}
                                <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                    <Hash size={16} className="text-paymint-green" />
                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Brand POS ID:</span>
                                    <code className="text-sm font-mono text-paymint-green">{brand.ownerPosId}</code>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="text-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                        <BarChart3 size={16} className="mx-auto mb-1 text-gray-400" />
                                        <p className="text-xs font-bold text-gray-500 uppercase">Analytics</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                        <Users size={16} className="mx-auto mb-1 text-gray-400" />
                                        <p className="text-xs font-bold text-gray-500 uppercase">Team</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                        <Store size={16} className="mx-auto mb-1 text-gray-400" />
                                        <p className="text-xs font-bold text-gray-500 uppercase">Locations</p>
                                    </div>
                                </div>

                                {/* Establishments Preview */}
                                <div className="space-y-2">
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Merged Locations</span>
                                    <div className="flex flex-wrap gap-2">
                                        {brand.establishments.slice(0, 3).map((est) => (
                                            <span
                                                key={est.id}
                                                className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400"
                                            >
                                                {est.name}
                                            </span>
                                        ))}
                                        {brand.establishments.length > 3 && (
                                            <span className="px-3 py-1.5 bg-paymint-green/10 rounded-lg text-xs font-bold text-paymint-green">
                                                +{brand.establishments.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Open Dashboard CTA */}
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-sm">
                                    <span className="font-bold text-gray-400 group-hover:text-paymint-green transition-colors">Open Brand Dashboard</span>
                                    <ChevronRight size={18} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Brand Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/10"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-paymint-green flex items-center justify-center">
                                        <Link2 size={24} className="text-black" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Create Brand</h2>
                                        <p className="text-sm text-gray-500">Unite establishments under one brand</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all text-gray-400"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onCreateBrand)} className="space-y-6">
                                {/* Brand Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Brand Name</label>
                                    <input
                                        {...register('name')}
                                        placeholder="e.g., Sunset Hospitality"
                                        className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl py-4 px-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50`}
                                    />
                                    {errors.name && <p className="text-red-500 text-xs font-bold">{errors.name.message as string}</p>}
                                </div>

                                {/* Brand POS ID */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Hash size={12} />
                                        Brand POS ID
                                    </label>
                                    <input
                                        {...register('ownerPosId')}
                                        placeholder="e.g., sunset-brand"
                                        className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.ownerPosId ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl py-4 px-4 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-paymint-green/50`}
                                    />
                                    {errors.ownerPosId && <p className="text-red-500 text-xs font-bold">{errors.ownerPosId.message as string}</p>}
                                </div>

                                {/* Brand Password */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Lock size={12} />
                                        Brand Password
                                    </label>
                                    <input
                                        type="password"
                                        {...register('ownerPosPassword')}
                                        placeholder="••••••••"
                                        className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.ownerPosPassword ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl py-4 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/50`}
                                    />
                                    {errors.ownerPosPassword && <p className="text-red-500 text-xs font-bold">{errors.ownerPosPassword.message as string}</p>}
                                </div>

                                {/* Select Establishments */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                        Select Establishments ({selectedEstablishments.length} selected)
                                    </label>
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1">
                                        {availableEstablishments.map((est: any) => (
                                            <button
                                                key={est.id}
                                                type="button"
                                                onClick={() => toggleEstablishment(est.id)}
                                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${selectedEstablishments.includes(est.id)
                                                    ? 'border-paymint-green bg-paymint-green/10'
                                                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedEstablishments.includes(est.id)
                                                    ? 'border-paymint-green bg-paymint-green'
                                                    : 'border-gray-300 dark:border-white/20'
                                                    }`}>
                                                    {selectedEstablishments.includes(est.id) && (
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <Store size={18} className={selectedEstablishments.includes(est.id) ? 'text-paymint-green' : 'text-gray-400'} />
                                                <span className="font-bold text-gray-900 dark:text-white">{est.name}</span>
                                                <span className="text-xs text-gray-400 uppercase">{est.currency}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {selectedEstablishments.length < 2 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                            * Select at least 2 establishments to create a brand
                                        </p>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isCreating || selectedEstablishments.length < 2}
                                    className="w-full py-4 bg-paymint-green text-black font-black rounded-xl hover:shadow-lg hover:shadow-paymint-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Creating Brand...
                                        </>
                                    ) : (
                                        <>
                                            <Link2 size={20} />
                                            Create Brand
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

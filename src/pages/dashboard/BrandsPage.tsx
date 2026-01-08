import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Link2,
  Unlink,
  Loader2,
  Store,
  CheckCircle,
  X,
  Hash,
  Lock,
  Users,
  MoreVertical,
  Eye
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

export function BrandsPage() {
  const navigate = useNavigate();
  const { establishments, refreshEstablishments } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEstablishments, setSelectedEstablishments] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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
      setOpenMenuId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-paymint-green" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Brands</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Merge multiple establishments under one brand for unified management.</p>
        </div>
        {availableEstablishments.length >= 2 && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-paymint-green text-black font-black rounded-2xl hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-paymint-green/20 active:scale-95"
          >
            <Link2 size={20} />
            <span>Merge Establishments</span>
          </button>
        )}
      </div>

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <div className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/10 p-16 text-center">
          <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <Building2 size={40} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">No Brands Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
            Brands allow you to merge multiple establishments for unified POS login and shared employee management.
          </p>
          {availableEstablishments.length >= 2 ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-105 transition-all inline-flex items-center gap-3"
            >
              <Link2 size={20} />
              Create Your First Brand
            </button>
          ) : (
            <p className="text-sm text-gray-400">You need at least 2 establishments to create a brand.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {brands.map((brand) => (
            <motion.div
              key={brand.id}
              layout
              className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] p-10 border-2 border-gray-100 dark:border-white/[0.05] hover:border-paymint-green/50 transition-all group relative"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 flex items-center justify-center border border-paymint-green/20">
                    <Building2 size={28} className="text-paymint-green" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{brand.name}</h3>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {brand.establishmentCount} Locations
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === brand.id ? null : brand.id)}
                    className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all text-gray-400"
                  >
                    <MoreVertical size={20} />
                  </button>
                  <AnimatePresence>
                    {openMenuId === brand.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.1] rounded-2xl shadow-2xl z-50 overflow-hidden py-2"
                      >
                        <button
                          onClick={() => handleDissolveBrand(brand.id)}
                          disabled={dissolvingBrandId === brand.id}
                          className="w-full text-left px-5 py-3 text-sm font-bold text-paymint-red hover:bg-paymint-red/10 transition-all flex items-center gap-3"
                        >
                          {dissolvingBrandId === brand.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Unlink size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => { navigate(`/dashboard/brands/${brand.id}`); setOpenMenuId(null); }}
                          className="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center gap-3"
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                        <button
                          onClick={() => handleDissolveBrand(brand.id)}
                          disabled={dissolvingBrandId === brand.id}
                          className="w-full text-left px-5 py-3 text-sm font-bold text-paymint-red hover:bg-paymint-red/10 transition-all flex items-center gap-3"
                        >
                          {dissolvingBrandId === brand.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Unlink size={16} />
                          )}
                          Dissolve Brand
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* POS ID */}
              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                <Hash size={16} className="text-paymint-green" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Brand POS ID:</span>
                <code className="text-sm font-mono text-paymint-green">{brand.ownerPosId}</code>
              </div>

              {/* Establishments List */}
              <div className="space-y-3">
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Merged Locations</span>
                <div className="grid grid-cols-1 gap-2">
                  {brand.establishments.map((est) => (
                    <div
                      key={est.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl"
                    >
                      <Store size={16} className="text-gray-400" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{est.name}</span>
                      <span className="text-xs text-gray-400 uppercase">{est.currency}</span>
                    </div>
                  ))}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-10">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Create Brand</h2>
                    <p className="text-gray-500 text-sm mt-1">Merge establishments under one unified brand</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                  >
                    <X size={24} className="text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onCreateBrand)} className="space-y-8">
                  {/* Brand Details */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                        Brand Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('name')}
                        className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 px-5 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/50`}
                        placeholder="e.g. Coffee House Group"
                      />
                      {errors.name && <p className="text-red-500 text-xs font-bold pt-1">{errors.name.message as string}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                          Brand POS ID <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            {...register('ownerPosId')}
                            className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.ownerPosId ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/50`}
                            placeholder="coffeehouse_brand"
                          />
                        </div>
                        {errors.ownerPosId && <p className="text-red-500 text-xs font-bold pt-1">{errors.ownerPosId.message as string}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                          Brand POS Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="password"
                            {...register('ownerPosPassword')}
                            className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.ownerPosPassword ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/50`}
                            placeholder="••••••••"
                          />
                        </div>
                        {errors.ownerPosPassword && <p className="text-red-500 text-xs font-bold pt-1">{errors.ownerPosPassword.message as string}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Select Establishments */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                        Select Establishments to Merge
                      </label>
                      <span className="text-xs font-bold text-paymint-green">
                        {selectedEstablishments.length} selected
                      </span>
                    </div>

                    {availableEstablishments.length === 0 ? (
                      <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl text-center">
                        <p className="text-gray-500 text-sm">All establishments are already part of a brand.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                        {availableEstablishments.map((est: any) => (
                          <button
                            key={est.id}
                            type="button"
                            onClick={() => toggleEstablishment(est.id)}
                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedEstablishments.includes(est.id)
                                ? 'border-paymint-green bg-paymint-green/5'
                                : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                              }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedEstablishments.includes(est.id)
                                ? 'bg-paymint-green text-black'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                              }`}>
                              {selectedEstablishments.includes(est.id) ? (
                                <CheckCircle size={20} />
                              ) : (
                                <Store size={20} />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-bold text-gray-900 dark:text-white block">{est.name}</span>
                              <span className="text-xs text-gray-500">{est.currency}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedEstablishments.length > 0 && selectedEstablishments.length < 2 && (
                      <p className="text-paymint-red text-xs font-bold">Select at least 2 establishments to create a brand</p>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="p-5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20">
                    <div className="flex items-start gap-3">
                      <Users size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-bold mb-1">What happens when you create a brand:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>All merged locations share the same Brand POS login</li>
                          <li>Employees can be shared across all locations</li>
                          <li>Unified reporting in the dashboard</li>
                          <li>Each location keeps its own menu and settings</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-4 border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-black rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || selectedEstablishments.length < 2}
                      className="flex-1 py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Link2 size={20} />
                          Create Brand
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

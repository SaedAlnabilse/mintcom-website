import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Percent, DollarSign, Trash2, Edit2, Tag, ShieldAlert, Award } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { DiscountFormModal } from '../../components/forms/DiscountFormModal';

interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  percentage: number; // for modal compatibility
  adminOnly: boolean; // for modal compatibility
}

export function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning';
    confirmText?: string;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/app-settings/discounts');
      const mappedDiscounts = (response.data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        type: 'percentage' as const,
        value: d.percentage * 100,
        percentage: d.percentage,
        adminOnly: d.adminOnly,
        isActive: true,
      }));
      setDiscounts(mappedDiscounts);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load discounts');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDiscount(null);
    setShowModal(true);
  };

  const openEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setShowModal(true);
  };

  const onSubmit = async (name: string, percentage: number, adminOnly: boolean) => {
    try {
      setIsSubmitting(true);

      const payload = {
        name,
        percentage,
        adminOnly,
      };

      if (editingDiscount) {
        await api.put(`/app-settings/discounts/${editingDiscount.id}`, payload);
        toast.success('Discount updated successfully');
      } else {
        await api.post('/app-settings/discounts', payload);
        toast.success('Discount created successfully');
      }

      setShowModal(false);
      fetchDiscounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (discountId: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Discount',
      message: `Are you sure you want to delete "${name}"?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/app-settings/discounts/${discountId}`);
          toast.success('Discount deleted successfully');
          fetchDiscounts();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to delete discount');
        }
      }
    });
  };

  const formatValue = (discount: Discount) => {
    if (discount.type === 'percentage') {
      return `${discount.value}%`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'JOD',
      minimumFractionDigits: 2,
    }).format(discount.value).replace('JOD', '').trim() + ' JOD';
  };

  const stats = useMemo(() => {
    return {
      total: discounts.length,
      active: discounts.filter(d => d.isActive).length,
      adminOnly: discounts.filter(d => d.adminOnly).length,
    };
  }, [discounts]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black tracking-widest border border-paymint-green/20">
              Sales & Growth
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Discounts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage promotional offers and employee benefits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>Add Discount</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {!isLoading && discounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl p-6 flex items-center justify-between transition-all hover:shadow-lg overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest">Total Discounts</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl p-6 flex items-center justify-between transition-all hover:shadow-lg overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest">Restricted</p>
              <p className="text-3xl font-black text-amber-600 dark:text-yellow-400 mt-1">{stats.adminOnly}</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-yellow-400" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Discounts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin" />
        </div>
      ) : discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
          <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6">
            <Tag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Discounts Found</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mb-8 mx-auto font-medium">
            Create your first discount to start running promotions and rewarding your customers.
          </p>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-paymint-green text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm"
          >
            Create Discount
          </button>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {discounts.map((discount) => (
            <motion.div
              key={discount.id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="group relative bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-paymint-green/0 via-transparent to-paymint-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${discount.type === 'percentage' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                  {discount.type === 'percentage' ? <Percent size={20} /> : <DollarSign size={20} />}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                  <button
                    onClick={() => openEditModal(discount)}
                    className="p-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-white transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id, discount.name)}
                    className="p-2 bg-gray-50 dark:bg-white/5 hover:bg-paymint-red/10 hover:text-paymint-red rounded-lg transition-colors text-gray-600 dark:text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate group-hover:text-paymint-green transition-colors" title={discount.name}>{discount.name}</h3>
                <p className="text-3xl font-black text-paymint-green mb-4 tracking-tight">{formatValue(discount)} <span className="text-xs font-bold text-gray-500 tracking-widest ml-1">OFF</span></p>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-white/5">
                  <span className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-[10px] text-gray-600 dark:text-gray-400 font-bold tracking-wider">
                    {discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                  </span>
                  {discount.adminOnly && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 text-[10px] text-amber-700 dark:text-yellow-500 font-bold tracking-wider">
                      Manager Only
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Discount Modal */}
      <DiscountFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={onSubmit}
        onDelete={editingDiscount ? () => handleDelete(editingDiscount.id, editingDiscount.name) : undefined}
        initialData={editingDiscount}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        showCancel={confirmConfig.showCancel}
      />
    </div>
  );
}

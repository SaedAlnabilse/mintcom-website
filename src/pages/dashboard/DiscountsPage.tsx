import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Percent, DollarSign, Trash2, Edit2, Tag, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
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
    <div className="p-6 lg:p-10 space-y-8 h-full overflow-y-auto bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Discounts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage promotional offers and employee benefits</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-paymint-green text-black font-bold rounded-xl hover:bg-paymint-green transition-all flex items-center gap-2 shadow-lg shadow-paymint-green/20 active:scale-95"
        >
          <Plus size={20} />
          Add Discount
        </button>
      </div>

      {/* Summary Stats */}
      {!isLoading && discounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex items-center justify-between shadow-sm dark:shadow-none transition-colors">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Total Discounts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 dark:bg-white/5 rounded-xl flex items-center justify-center shadow-sm">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex items-center justify-between shadow-sm dark:shadow-none transition-colors">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Active Now</p>
              <p className="text-3xl font-bold text-paymint-green mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-paymint-green/10 dark:bg-white/5 rounded-xl flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-paymint-green" />
            </div>
          </div>
          <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex items-center justify-between shadow-sm dark:shadow-none transition-colors">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Restricted</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-yellow-400 mt-1">{stats.adminOnly}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-white/5 rounded-xl flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Discounts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin" />
        </div>
      ) : discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Tag className="w-10 h-10 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No discounts found</h3>
          <p className="text-gray-600 dark:text-gray-400 max-sm mb-8 mx-auto">
            Create your first discount to start running promotions and rewarding your customers.
          </p>
          <button
            onClick={openCreateModal}
            className="px-6 py-2.5 bg-paymint-green text-black font-bold rounded-xl hover:bg-paymint-green/90 transition-all shadow-lg shadow-paymint-green/20"
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
              className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-paymint-green/50 dark:hover:border-paymint-green/30 transition-all shadow-md shadow-gray-200/50 dark:shadow-none group relative overflow-hidden"
            >
              {/* Background gradient hint */}
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                  discount.type === 'percentage' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                }`}>
                  {discount.type === 'percentage' ? <Percent size={24} /> : <DollarSign size={24} />}
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                  <button
                    onClick={() => openEditModal(discount)}
                    className="p-2 bg-gray-100 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 rounded-lg text-gray-600 dark:text-white transition-colors shadow-sm"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id, discount.name)}
                    className="p-2 bg-accent/10 dark:bg-accent/10 hover:bg-accent/20 dark:hover:bg-accent/20 text-accent rounded-lg transition-colors shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate group-hover:text-paymint-green transition-colors" title={discount.name}>{discount.name}</h3>
              <p className="text-3xl font-black text-paymint-green mb-4">{formatValue(discount)} <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">OFF</span></p>
              
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">
                  {discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                </span>
                {discount.adminOnly && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 text-[10px] text-amber-700 dark:text-yellow-500 font-bold uppercase tracking-wider">
                    Manager Only
                  </span>
                )}
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
      />
    </div>
  );
}




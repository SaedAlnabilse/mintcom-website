import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../config/api';
import toast from 'react-hot-toast';

const discountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0, 'Value must be positive'),
  isActive: z.boolean(),
});

type DiscountFormData = z.infer<typeof discountSchema>;

interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
}

export function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: { type: 'percentage', isActive: true },
  });

  const discountType = watch('type');

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/app-settings/discounts');
      // Map backend data (percentage only) to frontend structure
      const mappedDiscounts = (response.data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        type: 'percentage' as const,
        value: d.percentage * 100,
        isActive: true, // Backend doesn't have isActive for discounts yet
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
    reset({ name: '', type: 'percentage', value: 0, isActive: true });
    setShowModal(true);
  };

  const openEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    reset({
      name: discount.name,
      type: 'percentage', // Always percentage for now
      value: discount.value,
      isActive: true,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: DiscountFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        name: data.name,
        percentage: data.value / 100,
        adminOnly: false, // Default
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
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.delete(`/app-settings/discounts/${discountId}`);
      toast.success('Discount deleted successfully');
      fetchDiscounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete discount');
    }
  };



  const formatValue = (discount: Discount) => {
    if (discount.type === 'percentage') {
      return `${discount.value}%`;
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(discount.value);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Discounts</h1>
          <p className="text-gray-400 text-sm">Manage discount options for sales</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Discount
        </button>
      </div>

      {/* Discounts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-green-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-gray-400 mb-4">No discounts configured</p>
          <button onClick={openCreateModal} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Create your first discount
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {discounts.map((discount) => (
            <div
              key={discount.id}
              className={`bg-gray-800 rounded-xl border p-5 transition-colors ${discount.isActive ? 'border-green-500/50' : 'border-gray-700'
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${discount.type === 'percentage' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                  }`}>
                  <span className={`text-xl font-bold ${discount.type === 'percentage' ? 'text-purple-400' : 'text-blue-400'
                    }`}>
                    {discount.type === 'percentage' ? '%' : '$'}
                  </span>
                </div>
                <div className="flex gap-1">
                  {/* Active toggle not supported yet */}
                  <button
                    onClick={() => openEditModal(discount)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id, discount.name)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <h3 className="text-white font-semibold text-lg mb-1">{discount.name}</h3>
              <p className="text-2xl font-bold text-green-400 mb-3">{formatValue(discount)}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${discount.type === 'percentage' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                  {discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${discount.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                  {discount.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discount Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingDiscount ? 'Edit Discount' : 'Add Discount'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Discount Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Staff Discount"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type *</label>
                <div className="flex w-full">
                  <label className={`flex-1 p-3 rounded-lg border cursor-pointer transition-colors ${discountType === 'percentage' ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-700'
                    }`}>
                    <input type="radio" {...register('type')} value="percentage" className="sr-only" defaultChecked />
                    <div className="text-center">
                      <span className="text-2xl">%</span>
                      <p className="text-sm text-gray-300 mt-1">Percentage</p>
                    </div>
                  </label>
                  {/* Fixed amount not supported by backend yet */}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Value ({discountType === 'percentage' ? '%' : '$'}) *
                </label>
                <input
                  type="number"
                  step={discountType === 'percentage' ? '1' : '0.01'}
                  {...register('value', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.value && <p className="text-red-400 text-sm mt-1">{errors.value.message}</p>}
              </div>

              {/* Active status not supported by backend yet */}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {editingDiscount ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';

const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isActive: z.boolean(),
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethod {
  id: string;
  name: string;
  imageUrl?: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface CardType {
  id: string;
  name: string;
  imageUrl?: string;
}

export function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCardImage, setSelectedCardImage] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null);
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    fetchPaymentMethods();
    fetchCardTypes();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/app-settings/payment-methods');
      setPaymentMethods(response.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCardTypes = async () => {
    try {
      const response = await api.get('/card-types');
      setCardTypes(response.data || []);
    } catch (err) {
      console.error('Failed to load card types');
    }
  };

  const openCreateModal = () => {
    setEditingMethod(null);
    reset({ name: '', isActive: true });
    setSelectedImage(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    reset({
      name: method.name,
      isActive: method.isActive,
    });
    setSelectedImage(null);
    setImagePreview(method.imageUrl || null);
    setShowModal(true);
  };

  /* Helper to upload image */
  const uploadImage = async (file: File, endpoint: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { success, imageUrl, imageKey }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCardImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setCardImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PaymentMethodFormData) => {
    try {
      setIsSubmitting(true);

      let imageUrl = editingMethod?.imageUrl;
      let imageKey = (editingMethod as any)?.imageKey;

      if (selectedImage) {
        // Upload new image
        const uploadRes = await uploadImage(selectedImage, '/payment-methods/upload-image');
        if (uploadRes.success) {
          imageUrl = uploadRes.imageUrl;
          imageKey = uploadRes.imageKey;
        }
      }

      const payload = {
        name: data.name,
        isActive: data.isActive,
        imageUrl,
        imageKey,
      };

      if (editingMethod) {
        await api.put(`/app-settings/payment-methods/${editingMethod.id}`, payload);
        toast.success('Payment method updated');
      } else {
        await api.post('/app-settings/payment-methods', payload);
        toast.success('Payment method created');
      }

      setShowModal(false);
      fetchPaymentMethods();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (methodId: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Payment Method',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/app-settings/payment-methods/${methodId}`);
          toast.success('Payment method deleted');
          fetchPaymentMethods();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to delete');
        }
      }
    });
  };

  const openCardModal = () => {
    setNewCardName('');
    setSelectedCardImage(null);
    setCardImagePreview(null);
    setShowCardModal(true);
  };

  const handleAddCardType = async () => {
    if (!newCardName.trim()) return;

    try {
      setIsSubmitting(true);

      let imageUrl, imageKey;
      if (selectedCardImage) {
        const uploadRes = await uploadImage(selectedCardImage, '/card-types/upload-image');
        if (uploadRes.success) {
          imageUrl = uploadRes.imageUrl;
          imageKey = uploadRes.imageKey;
        }
      }

      await api.post('/card-types', {
        name: newCardName,
        imageUrl,
        imageKey
      });

      toast.success('Card type added');
      setNewCardName('');
      setSelectedCardImage(null);
      setCardImagePreview(null);
      setShowCardModal(false);
      fetchCardTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add card type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCardType = async (cardId: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Card Type',
      message: `Are you sure you want to delete "${name}"?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/card-types/${cardId}`);
          toast.success('Card type deleted');
          fetchCardTypes();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to delete');
        }
      }
    });
  };

  const getMethodIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cash')) return '💵';
    if (lower.includes('card')) return '💳';
    if (lower.includes('visa')) return '💳';
    if (lower.includes('master')) return '💳';
    if (lower.includes('mobile') || lower.includes('phone')) return '📱';
    if (lower.includes('online') || lower.includes('digital')) return '🌐';
    return '💰';
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Methods</h1>
          <p className="text-gray-400 text-sm">Configure accepted payment options</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Method
        </button>
      </div>

      {/* Payment Methods */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Payment Methods</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-green-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-8 bg-gray-800 rounded-xl border border-gray-700">
            <p className="text-gray-400">No custom payment methods</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`bg-gray-800 rounded-xl border p-5 ${method.isActive ? 'border-green-500/50' : 'border-gray-700'
                  }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                    {method.imageUrl ? (
                      <img src={method.imageUrl} alt={method.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{getMethodIcon(method.name)}</span>
                    )}
                  </div>
                  {!method.isDefault && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(method)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(method.id, method.name)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-white font-semibold text-lg mb-2">{method.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${method.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                    {method.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {method.isDefault && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-500/20 text-blue-400">
                      Default
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Types */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Card Types</h2>
          <button
            onClick={openCardModal}
            className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Add Card Type
          </button>
        </div>

        {cardTypes.length === 0 ? (
          <div className="text-center py-8 bg-gray-800 rounded-xl border border-gray-700">
            <p className="text-gray-400">No card types configured</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {cardTypes.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl border border-gray-700"
              >
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt={card.name} className="w-8 h-8 object-contain" />
                ) : (
                  <span className="text-xl">💳</span>
                )}
                <span className="text-white font-medium">{card.name}</span>
                <button
                  onClick={() => handleDeleteCardType(card.id, card.name)}
                  className="ml-2 text-gray-400 hover:text-red-400"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Method Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon/Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">💰</span>
                    )}
                  </div>
                  <label className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 cursor-pointer text-sm">
                    Choose Image
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Mobile Payment"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  id="methodActive"
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
                />
                <label htmlFor="methodActive" className="text-gray-300">Method is active</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 flex items-center justify-center gap-2">
                  {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {editingMethod ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Type Modal */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Card Type</h2>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Card Image</label>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center border border-gray-600">
                    {cardImagePreview ? (
                      <img src={cardImagePreview} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl">💳</span>
                    )}
                  </div>
                  <label className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 cursor-pointer text-sm">
                    Choose Image
                    <input type="file" accept="image/*" onChange={handleCardImageChange} className="hidden" />
                  </label>
                </div>

                <label className="block text-sm font-medium text-gray-300 mb-2">Card Name</label>
                <input
                  type="text"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Visa, Mastercard"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowCardModal(false)} className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
                <button
                  onClick={handleAddCardType}
                  disabled={isSubmitting || !newCardName.trim()}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

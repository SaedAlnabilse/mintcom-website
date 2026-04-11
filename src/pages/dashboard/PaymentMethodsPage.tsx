import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  CreditCard,
  Edit2,
  Trash2,
  X,
  Upload,
  Smartphone,
  Globe,
  DollarSign,
  Wallet,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { API_BASE_URL } from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';

const paymentMethodSchema = z.object({
  name: z.string().min(1, 'common.required'),
  isActive: z.boolean(),
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethod {
  id: string;
  name: string;
  logo?: string; // Legacy field for backwards compatibility
  imageUrl?: string;
  imageKey?: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface CardType {
  id: string;
  name: string;
  imageUrl?: string;
  imageKey?: string;
  logo?: string;
}

export function PaymentMethodsPage() {
  const { t } = useTranslation();
  usePermissionGuard(['manage_payment_methods']);
  const location = useLocation();
  const { currentEstablishment } = useAuth();
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
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({}); // For manual forms
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

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PaymentMethodFormData>({ // added watch
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { isActive: true },
  });

  const watchName = watch('name');

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  useEffect(() => {
    fetchPaymentMethods();
    fetchCardTypes();
  }, [currentEstablishment]);

  useEffect(() => {
    const state = location.state as { openCreateModal?: boolean } | null;
    if (state?.openCreateModal) {
      setEditingMethod(null);
      reset({ name: '', isActive: true });
      setSelectedImage(null);
      setImagePreview(null);
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, reset]);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/app-settings/payment-methods');
      setPaymentMethods(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast.error(t('paymentMethods.messages.failedToLoad'));
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCardTypes = async () => {
    try {
      const response = await api.get('/card-types');
      setCardTypes(Array.isArray(response.data) ? response.data : []);
    } catch {
      console.error('Failed to load card types');
      toast.error(t('paymentMethods.messages.failedToLoad'));
    }
  };

  const uploadImage = async (file: File, endpoint: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
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

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleRemoveCardImage = () => {
    setSelectedCardImage(null);
    setCardImagePreview(null);
  };

  const onSubmit = async (data: PaymentMethodFormData) => {
    try {
      setIsSubmitting(true);

      let imageUrl = imagePreview ? (editingMethod?.imageUrl || null) : null;
      let imageKey = imagePreview ? (editingMethod?.imageKey || null) : null;

      if (selectedImage) {
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
        toast.success(t('paymentMethods.messages.updated'));
      } else {
        await api.post('/app-settings/payment-methods', payload);
        toast.success(t('paymentMethods.messages.created'));
      }

      setShowModal(false);
      fetchPaymentMethods();
    } catch (error: any) {
      console.error('Failed to save payment method:', error);
      const errorMessage = error?.response?.data?.message || error?.message || t('paymentMethods.messages.failedToSave');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (methodId: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: t('paymentMethods.confirm.removeTitle'),
      message: t('paymentMethods.confirm.removeMessage', { name }),
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/app-settings/payment-methods/${methodId}`);
          toast.success(t('paymentMethods.messages.removed'));
          fetchPaymentMethods();
        } catch {
          toast.error(t('paymentMethods.messages.failedToRemove'));
        }
      }
    });
  };

  const handleAddCardType = async () => {
    setCardErrors({});
    if (!newCardName.trim()) {
      setCardErrors({ cardName: t('common.required') });
      return;
    }
    try {
      setIsSubmitting(true);

      let imageUrl = cardImagePreview ? (editingCard?.imageUrl || null) : null;
      let imageKey = cardImagePreview ? (editingCard?.imageKey || null) : null;

      if (selectedCardImage) {
        const uploadRes = await uploadImage(selectedCardImage, '/card-types/upload-image');
        if (uploadRes.success) {
          imageUrl = uploadRes.imageUrl;
          imageKey = uploadRes.imageKey;
        }
      }

      const payload = { name: newCardName, imageUrl, imageKey };

      if (editingCard) {
        await api.patch(`/card-types/${editingCard.id}`, payload);
        toast.success(t('paymentMethods.messages.brandUpdated'));
      } else {
        await api.post('/card-types', payload);
        toast.success(t('paymentMethods.messages.brandAdded'));
      }

      setShowCardModal(false);
      fetchCardTypes();
    } catch (error: any) {
      console.error('Failed to save brand:', error);
      const errorMessage = error?.response?.data?.message || error?.message || t('paymentMethods.messages.failedToSaveBrand');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCardType = async (cardId: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: t('paymentMethods.confirm.deleteCardTitle'),
      message: t('paymentMethods.confirm.deleteCardMessage', { name }),
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/card-types/${cardId}`);
          toast.success(t('paymentMethods.messages.cardTypeRemoved'));
          fetchCardTypes();
        } catch {
          toast.error(t('paymentMethods.messages.failedToDelete'));
        }
      }
    });
  };

  const getMethodIcon = (name: string, size: number = 24) => {
    const lower = name.toLowerCase();
    if (lower.includes('cash')) return <DollarSign size={size} />;
    if (lower.includes('card') || lower.includes('visa') || lower.includes('master')) return <CreditCard size={size} />;
    if (lower.includes('mobile') || lower.includes('phone') || lower.includes('wallet')) return <Smartphone size={size} />;
    if (lower.includes('online')) return <Globe size={size} />;
    return <Wallet size={size} />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('paymentMethods.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
            <span>{t('paymentMethods.subtitle')}</span>
            {currentEstablishment?.name && (
              <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                {currentEstablishment.name}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Card Types Section */}
      <section className="bg-white dark:bg-[#1E293B] rounded-[32px] border border-gray-200 dark:border-white/[0.03] p-8 sm:p-10 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <div className="flex items-start gap-5 mb-12 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-paymint-green/10 flex items-center justify-center text-paymint-green shrink-0 border border-paymint-green/20">
            <CreditCard size={28} />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('paymentMethods.cardBrands')}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-2xl">{t('paymentMethods.cardBrandsSubtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
          {cardTypes.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-gray-50/50 dark:bg-white/[0.01] rounded-[24px] border border-dashed border-gray-200 dark:border-white/5">
              <p className="text-gray-400 font-black tracking-[0.2em] text-xs uppercase">{t('paymentMethods.noCardBrands')}</p>
            </div>
          ) : (
            Array.isArray(cardTypes) && cardTypes.map((card) => (
              <motion.div
                layout
                key={card.id}
                className="group relative bg-white dark:bg-white/[0.02] rounded-[24px] border border-gray-100 dark:border-white/5 transition-all duration-500 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 flex flex-col overflow-hidden"
              >
                {/* Image/Icon Container */}
                <div className="aspect-[4/3] flex items-center justify-center p-8 bg-gray-50/50 dark:bg-black/20 relative group-hover:bg-white dark:group-hover:bg-black/40 transition-colors duration-500">
                  <div className="w-20 h-20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    {getImageUrl(card.imageUrl || card.logo) ? (
                      <img src={getImageUrl(card.imageUrl || card.logo)!} alt={card.name} className="w-full h-full object-contain drop-shadow-sm" />
                    ) : (
                      <CreditCard size={40} className="text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Info & Actions */}
                <div className="p-5 flex flex-col gap-4 border-t border-gray-100 dark:border-white/5">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white truncate px-1">{card.name}</h3>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingCard(card); setNewCardName(card.name); setCardImagePreview(card.imageUrl || card.logo || null); setSelectedCardImage(null); setShowCardModal(true); setCardErrors({}); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-paymint-green hover:bg-paymint-green/10 border border-gray-100 dark:border-white/5 transition-all font-bold text-xs"
                    >
                      <Edit2 size={14} /> {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteCardType(card.id, card.name)}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 border border-gray-100 dark:border-white/5 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {/* Add New Network Card */}
          <motion.button
            layout
            onClick={() => { setEditingCard(null); setNewCardName(''); setCardImagePreview(null); setSelectedCardImage(null); setShowCardModal(true); setCardErrors({}); }}
            className="group relative aspect-square sm:aspect-auto sm:min-h-[220px] bg-gray-50/50 dark:bg-white/[0.01] border-2 border-dashed border-gray-200 dark:border-white/[0.05] rounded-[24px] p-6 cursor-pointer hover:border-paymint-green/50 hover:bg-white dark:hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center gap-4"
          >
            <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-white/10 group-hover:bg-paymint-green/10 group-hover:border-paymint-green transition-all shadow-sm">
              <Plus size={24} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
            </div>
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{t('paymentMethods.addBrand')}</span>
          </motion.button>
        </div>
      </section>

      {/* Main Section */}
      <section className="bg-white dark:bg-[#1E293B] rounded-[32px] border border-gray-200 dark:border-white/[0.03] p-8 sm:p-10 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <div className="flex items-start gap-5 mb-12 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-paymint-green/10 flex items-center justify-center text-paymint-green shrink-0 border border-paymint-green/20">
            <Wallet size={28} />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('paymentMethods.paymentTypes')}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-2xl">{t('paymentMethods.paymentTypesSubtitle')}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[4/5] rounded-[24px] bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
            {Array.isArray(paymentMethods) && paymentMethods.map((method) => (
              <motion.div
                layout
                key={method.id}
                className={`group relative bg-white dark:bg-white/[0.02] rounded-[24px] border transition-all duration-500 flex flex-col overflow-hidden ${method.isActive
                  ? 'border-gray-100 dark:border-white/5 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1'
                  : 'border-gray-100 dark:border-white/5 opacity-50 grayscale'
                  }`}
              >
                {/* Icon Container */}
                <div className="aspect-[4/3] flex items-center justify-center p-8 bg-gray-50/50 dark:bg-black/20 relative group-hover:bg-white dark:group-hover:bg-black/40 transition-colors duration-500">
                  <div className="w-20 h-20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    {getImageUrl(method.imageUrl || method.logo) ? (
                      <img src={getImageUrl(method.imageUrl || method.logo)!} alt={method.name} className="w-full h-full object-contain drop-shadow-sm" />
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500">
                        {getMethodIcon(method.name, 48)}
                      </div>
                    )}
                  </div>
                  {method.isDefault && (
                    <div className="absolute top-4 left-4">
                      <div className="px-2.5 py-1 rounded-lg bg-blue-500 text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-lg shadow-blue-500/20">
                        <Star size={10} fill="currentColor" /> {t('paymentMethods.system')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="p-5 flex flex-col gap-4 border-t border-gray-100 dark:border-white/5">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white truncate px-1">{method.name}</h3>
                  
                  <div className="flex items-center gap-2">
                    {!method.isDefault ? (
                      <>
                        <button
                          onClick={() => { setEditingMethod(method); reset({ name: method.name, isActive: method.isActive }); setImagePreview(method.imageUrl || null); setShowModal(true); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-paymint-green hover:bg-paymint-green/10 border border-gray-100 dark:border-white/5 transition-all font-bold text-xs"
                        >
                          <Edit2 size={14} /> {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(method.id, method.name)}
                          className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 border border-gray-100 dark:border-white/5 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        {t('common.systemDefault', 'System Default')}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add New Method Card */}
            <motion.button
              layout
              onClick={() => { setEditingMethod(null); reset({ name: '', isActive: true }); setImagePreview(null); setShowModal(true); }}
              className="group relative aspect-square sm:aspect-auto sm:min-h-[220px] bg-gray-50/50 dark:bg-white/[0.01] border-2 border-dashed border-gray-200 dark:border-white/[0.05] rounded-[24px] p-6 cursor-pointer hover:border-paymint-green/50 hover:bg-white dark:hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center gap-4"
            >
              <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-white/10 group-hover:bg-paymint-green/10 group-hover:border-paymint-green transition-all shadow-sm">
                <Plus size={24} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
              </div>
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{t('paymentMethods.addPayment')}</span>
            </motion.button>
          </div>
        )}
      </section>

      {/* Payment Method Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5"
            >
              {/* Mobile Drag Handle */}
              <div className="h-1.5 w-12 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

              <div className="px-8 py-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
                    <Wallet size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {editingMethod ? t('paymentMethods.editPayment') : t('paymentMethods.addPayment')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border border-gray-200 dark:border-white/10 transition-all hover:rotate-90"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 overflow-hidden relative group transition-all hover:border-paymint-green/50">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-4" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm shadow-xl"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={32} className="text-gray-300" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.upload')}</span>
                        <input  maxLength={255}type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-3 px-1 flex items-center gap-2">
                      {t('paymentMethods.form.nameLabel')} <span className="text-paymint-red">*</span>
                    </label>
                    <input maxLength={255}
                      type="text"
                      {...register('name')}
                      className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-paymint-red' : 'border-gray-200 dark:border-white/10'} rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                      placeholder={t('paymentMethods.form.namePlaceholder')}
                    />
                    {errors.name && <p className="text-paymint-red text-[10px] font-black mt-2 px-1 uppercase tracking-widest">{errors.name.message}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !watchName?.trim()}
                  className={`w-full py-4 bg-paymint-green text-black font-bold rounded-xl hover:scale-[1.02] shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:grayscale disabled:scale-100 ${watchName?.trim() ? 'shadow-paymint-green/40' : 'shadow-black/5'}`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    editingMethod ? t('common.save') : t('common.add')
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Card Type Modal */}
      <AnimatePresence>
        {showCardModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCardModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5"
            >
              {/* Mobile Drag Handle */}
              <div className="h-1.5 w-12 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

              <div className="px-8 py-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
                    <CreditCard size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {editingCard ? t('paymentMethods.editBrand') : t('paymentMethods.addBrand')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowCardModal(false)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border border-gray-200 dark:border-white/10 transition-all hover:rotate-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 overflow-hidden relative group transition-all hover:border-paymint-green/50">
                    {cardImagePreview ? (
                      <>
                        <img src={cardImagePreview} alt="Preview" className="w-full h-full object-contain p-4" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveCardImage(); }}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm shadow-xl"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={32} className="text-gray-300" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.upload')}</span>
                        <input  maxLength={255}type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleCardImageChange} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-3 px-1 flex items-center gap-2">
                      {t('paymentMethods.form.nameLabel')} <span className="text-paymint-red">*</span>
                    </label>
                    <input maxLength={255}
                      type="text"
                      value={newCardName}
                      onChange={(e) => {
                        setNewCardName(e.target.value);
                        if (cardErrors.cardName) setCardErrors({ ...cardErrors, cardName: '' });
                      }}
                      className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${cardErrors.cardName ? 'border-paymint-red' : 'border-gray-200 dark:border-white/10'} rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                      placeholder={t('paymentMethods.form.brandPlaceholder')}
                    />
                    {cardErrors.cardName && <p className="text-paymint-red text-[10px] font-black mt-2 px-1 uppercase tracking-widest">{cardErrors.cardName}</p>}
                  </div>
                </div>

                <button
                  onClick={handleAddCardType}
                  disabled={isSubmitting || !newCardName.trim()}
                  className={`w-full py-4 bg-paymint-green text-black font-bold rounded-xl hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:grayscale disabled:scale-100 ${newCardName.trim() ? 'shadow-paymint-green/40' : 'shadow-black/5'}`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    editingCard ? t('common.save') : t('common.add')
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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




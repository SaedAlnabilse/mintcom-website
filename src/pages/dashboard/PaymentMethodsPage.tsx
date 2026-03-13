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
import { QuickInfo } from '../../components/QuickInfo';
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentMethodFormData>({ // added watch
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { isActive: true },
  });

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
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
              </div>
              <span className="text-xs font-bold text-paymint-green tracking-widest">{t('dashboard.shiftStatus.live')}</span>
            </div>
          </div>
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
      <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green flex-shrink-0">
            <CreditCard size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('paymentMethods.cardBrands')}</h2>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('paymentMethods.cardBrandsSubtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cardTypes.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <p className="text-gray-400 font-black tracking-widest text-xs">{t('paymentMethods.noCardBrands')}</p>
            </div>
          ) : (
            Array.isArray(cardTypes) && cardTypes.map((card) => (
              <motion.div
                layout
                key={card.id}
                className="group relative bg-gray-50 dark:bg-white/[0.02] p-6 rounded-2xl border border-gray-100 dark:border-white/5 transition-all duration-300 hover:border-paymint-green/30 flex flex-col items-center justify-center min-h-[200px]"
              >
                <div className="absolute top-3 right-3 flex gap-1 z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingCard(card); setNewCardName(card.name); setCardImagePreview(card.imageUrl || card.logo || null); setSelectedCardImage(null); setShowCardModal(true); setCardErrors({}); }}
                    className="p-2 rounded-lg bg-white dark:bg-black/50 text-gray-400 hover:text-paymint-green shadow-sm border border-gray-100 dark:border-white/5 backdrop-blur-sm"
                    title={t('common.edit')}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCardType(card.id, card.name); }} className="p-2 rounded-lg bg-white dark:bg-black/50 text-gray-400 hover:text-paymint-red shadow-sm border border-gray-100 dark:border-white/5 backdrop-blur-sm" title={t('common.delete')}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-black/40 flex items-center justify-center border border-gray-100 dark:border-white/5 overflow-hidden p-4 mb-4 shadow-sm">
                  {getImageUrl(card.imageUrl || card.logo) ? (
                    <img src={getImageUrl(card.imageUrl || card.logo)!} alt={card.name} className="w-full h-full object-contain" />
                  ) : (
                    <CreditCard size={32} className="text-gray-400" />
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate w-full text-center">{card.name}</h3>
              </motion.div>
            ))
          )}

          {/* Add New Network Card */}
          <motion.div
            layout
            onClick={() => { setEditingCard(null); setNewCardName(''); setCardImagePreview(null); setSelectedCardImage(null); setShowCardModal(true); setCardErrors({}); }}
            className="group relative bg-gray-50/50 dark:bg-white/[0.01] border-2 border-dashed border-gray-200 dark:border-white/[0.05] rounded-2xl p-6 cursor-pointer hover:border-paymint-green/50 hover:bg-white dark:hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center min-h-[200px]"
          >
            <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-white/10 group-hover:bg-paymint-green/10 group-hover:border-paymint-green transition-all shadow-sm">
              <Plus size={24} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('paymentMethods.addBrand')}</h3>
          </motion.div>
        </div>
      </section>

      {/* Main Section */}
      <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green flex-shrink-0">
            <Wallet size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t('paymentMethods.paymentTypes')}
            </h2>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('paymentMethods.paymentTypesSubtitle')}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.isArray(paymentMethods) && paymentMethods.map((method) => (
              <motion.div
                layout
                key={method.id}
                className={`group relative bg-white dark:bg-[#1E293B] p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] ${method.isActive
                  ? 'border-paymint-green/20 hover:border-paymint-green/50'
                  : 'border-gray-100 dark:border-white/5 opacity-60'
                  }`}
              >
                <div className="absolute top-3 right-3 flex gap-1 z-10">
                  {!method.isDefault && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setEditingMethod(method); reset({ name: method.name, isActive: method.isActive }); setImagePreview(method.imageUrl || null); setShowModal(true); }} className="p-2 rounded-lg bg-gray-50 dark:bg-black/50 text-gray-400 hover:text-paymint-green border border-gray-100 dark:border-white/5 shadow-sm backdrop-blur-sm" title={t('common.edit')}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(method.id, method.name); }} className="p-2 rounded-lg bg-gray-50 dark:bg-black/50 text-gray-400 hover:text-paymint-red border border-gray-100 dark:border-white/5 shadow-sm backdrop-blur-sm" title={t('common.delete')}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>

                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-black/40 flex items-center justify-center border border-gray-100 dark:border-white/5 overflow-hidden p-4 mb-4 shadow-sm">
                  {getImageUrl(method.imageUrl || method.logo) ? (
                    <img src={getImageUrl(method.imageUrl || method.logo)!} alt={method.name} className="w-full h-full object-contain" />
                  ) : (
                    getMethodIcon(method.name, 32)
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate w-full text-center">{method.name}</h3>
                {method.isDefault && (
                  <span className="mt-3 text-[10px] font-black text-blue-500 tracking-widest flex items-center gap-1 bg-blue-500/10 px-3 py-1 rounded-full uppercase border border-blue-500/20">
                    <Star size={10} fill="currentColor" /> {t('paymentMethods.system')}
                  </span>
                )}
              </motion.div>
            ))}

            {/* Add New Method Card */}
            <motion.div
              layout
              onClick={() => { setEditingMethod(null); reset({ name: '', isActive: true }); setImagePreview(null); setShowModal(true); }}
              className="group relative bg-gray-50/50 dark:bg-white/[0.01] border-2 border-dashed border-gray-200 dark:border-white/[0.05] rounded-2xl p-6 cursor-pointer hover:border-paymint-green/50 hover:bg-white dark:hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center min-h-[200px]"
            >
              <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-white/10 group-hover:bg-paymint-green/10 group-hover:border-paymint-green transition-all shadow-sm">
                <Plus size={24} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('paymentMethods.addPayment')}</h3>
            </motion.div>
          </div>
        )}
      </section>

      {/* Payment Method Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] popup-surface flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {editingMethod ? t('paymentMethods.editPayment') : t('paymentMethods.addPayment')}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 overflow-hidden relative group">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm shadow-xl"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload size={32} className="text-gray-300" />
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} />
                      </>
                    )}
                  </div>

                  <div className="flex items-center">
                    <p className="text-xs font-black text-gray-400 tracking-widest">{t('paymentMethods.form.iconLabel')}</p>
                    <QuickInfo text={t('paymentMethods.form.iconTip')} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] mb-3 px-1 flex items-center">
                    {t('paymentMethods.form.nameLabel')} <span className="text-paymint-red mx-1">*</span>
                    <QuickInfo text={t('paymentMethods.form.nameTip')} />
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-none'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder={t('paymentMethods.form.namePlaceholder')}
                  />
                  {errors.name && <p className="text-paymint-red text-xs font-black mt-2 px-1">{errors.name.message}</p>}
                </div>


                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] tracking-widest text-xs transition-all flex items-center justify-center gap-2">
                  {editingMethod ? t('common.save') : t('common.add')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Card Type Modal */}
      <AnimatePresence>
        {showCardModal && (
          <div className="fixed inset-0 z-[60] popup-surface flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {editingCard ? t('paymentMethods.editBrand') : t('paymentMethods.addBrand')}
                </h2>
                <button onClick={() => setShowCardModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 overflow-hidden relative group">
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
                      <>
                        <Upload size={32} className="text-gray-300" />
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleCardImageChange} />
                      </>
                    )}
                  </div>

                  <div className="flex items-center">
                    <p className="text-xs font-black text-gray-400 tracking-widest">{t('paymentMethods.form.logoLabel')}</p>
                    <QuickInfo text={t('paymentMethods.form.logoTip')} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] mb-3 px-1 flex items-center">
                    {t('paymentMethods.form.nameLabel')} <span className="text-paymint-red mx-1">*</span>
                    <QuickInfo text={t('paymentMethods.form.brandTip')} />
                  </label>
                  <input
                    type="text"
                    value={newCardName}
                    onChange={(e) => {
                      setNewCardName(e.target.value);
                      if (cardErrors.cardName) setCardErrors({ ...cardErrors, cardName: '' });
                    }}
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${cardErrors.cardName ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-none'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder={t('paymentMethods.form.brandPlaceholder')}
                  />
                  {cardErrors.cardName && <p className="text-paymint-red text-xs font-black mt-2 px-1">{cardErrors.cardName}</p>}
                </div>

                <button
                  onClick={handleAddCardType}
                  disabled={isSubmitting || !newCardName.trim()}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl hover:scale-[1.02] transition-all tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  {editingCard ? t('common.save') : t('common.add')}
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



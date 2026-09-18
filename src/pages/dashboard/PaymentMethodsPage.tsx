import { useState, useEffect, useMemo } from 'react';
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
  Star,
  Lock,
  RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import api, { API_BASE_URL } from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { BusyOverlay } from '../../components/BusyOverlay';
import { useAuth } from '../../context/AuthContext';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { formatInputPlaceholder } from '../../utils/textCase';
import { formatPaymentBrandName } from '../../utils/paymentCard';
import { SelectInput, Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton, ModalSubmitButton, PageHeader, Badge } from '../../components/ui';
import { OptimizedImage } from '../../components/OptimizedImage';
import { useRealtime } from '../../hooks/useRealtime';
import { DataChangeEventTypes } from '../../services/realtimeService';
import { retryTransientRequest } from '../../utils/retryTransientRequest';

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
  isActive?: boolean;
}

type StatusFilterValue = 'ALL' | 'ACTIVE' | 'INACTIVE';

const isSystemCardBrand = (name: string) =>
  ['visa', 'mastercard', 'american express'].includes(name.trim().toLowerCase());

export function PaymentMethodsPage() {
  const { t } = useTranslation();
  usePermissionGuard(['manage_payment_methods']);
  const location = useLocation();
  const { currentEstablishment } = useAuth();
  const { onRefresh } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [paymentMethodStatusFilter, setPaymentMethodStatusFilter] = useState<StatusFilterValue>('ACTIVE');
  const [cardTypeStatusFilter, setCardTypeStatusFilter] = useState<StatusFilterValue>('ACTIVE');
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
  const isEditingInactiveMethod = !!editingMethod && !editingMethod.isDefault && !editingMethod.isActive;
  const isEditingInactiveCard = !!editingCard && editingCard.isActive === false;
  const isEditingSystemCard = !!editingCard && isSystemCardBrand(editingCard.name);
  const movePaymentMethodsCreateViewToActive = () => {
    if (paymentMethodStatusFilter === 'INACTIVE') {
      setPaymentMethodStatusFilter('ACTIVE');
    }
  };
  const moveCardTypesCreateViewToActive = () => {
    if (cardTypeStatusFilter === 'INACTIVE') {
      setCardTypeStatusFilter('ACTIVE');
    }
  };
  const openCreatePaymentMethodModal = () => {
    setEditingMethod(null);
    reset({ name: '', isActive: true });
    setImagePreview(null);
    setSelectedImage(null);
    movePaymentMethodsCreateViewToActive();
    setShowModal(true);
  };
  const openCreateCardTypeModal = () => {
    setEditingCard(null);
    setNewCardName('');
    setCardImagePreview(null);
    setSelectedCardImage(null);
    moveCardTypesCreateViewToActive();
    setCardErrors({});
    setShowCardModal(true);
  };

  // Keep the common card-brand artwork on our own origin. Third-party logo
  // hosts can be blocked by the CSP attached to an already-open SPA document,
  // which made these tiles appear blank until the user performed a hard reload.
  const CARD_ICON_SET = '/payment-brand-icons';
  const getFallbackLogo = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('visa')) return `${CARD_ICON_SET}/visa.svg`;
    if (lower.includes('mastercard')) return `${CARD_ICON_SET}/mastercard.svg`;
    if (lower.includes('american express') || lower.includes('amex')) return `${CARD_ICON_SET}/amex.svg`;
    if (lower.includes('discover')) return `${CARD_ICON_SET}/discover.svg`;
    if (lower.includes('jcb')) return `${CARD_ICON_SET}/jcb.svg`;
    if (lower.includes('unionpay') || lower.includes('union pay')) return `${CARD_ICON_SET}/unionpay.svg`;
    if (lower.includes('apple pay')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg';
    if (lower.includes('google pay')) return 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg';
    if (lower.includes('paypal')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg';
    if (lower.includes('cash')) return 'https://cdn-icons-png.flaticon.com/512/2331/2331714.png';
    return null;
  };

  const matchesStatusFilter = (isActive: boolean | undefined, filter: StatusFilterValue) => {
    if (filter === 'ALL') return true;
    return filter === 'ACTIVE' ? isActive !== false : isActive === false;
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  /**
   * Resolve the logo for a card-type tile.
   * Known brands (Visa / Mastercard / Amex / …) always use the maintained local
   * set so they paint on first render — no hard refresh, no broken upload paths.
   * Custom brands keep their stored image when present.
   */
  const resolveCardLogoUrl = (card: { name: string; imageUrl?: string; logo?: string }) => {
    const brandFallback = getFallbackLogo(card.name);
    if (brandFallback) return brandFallback;
    return getImageUrl(card.imageUrl || card.logo);
  };

  useEffect(() => {
    void fetchInitialData();
  }, [currentEstablishment?.id]);

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

  // `silent` skips the blocking loading state — used for realtime background
  // refreshes so the busy overlay doesn't flash on every incoming event.
  const fetchPaymentMethods = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await retryTransientRequest(() =>
        api.get('/app-settings/payment-methods', {
          params: { includeInactive: true },
        }),
      );
      setPaymentMethods(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast.error(t('paymentMethods.messages.failedToLoad'));
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const fetchCardTypes = async () => {
    try {
      const response = await retryTransientRequest(() =>
        api.get('/card-types', {
          params: { includeInactive: true },
        }),
      );
      setCardTypes(Array.isArray(response.data) ? response.data : []);
    } catch {
      console.error('Failed to load card types');
      toast.error(t('paymentMethods.messages.failedToLoad'));
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchPaymentMethods(true), fetchCardTypes()]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onRefresh((eventType) => {
      if (eventType === DataChangeEventTypes.SETTINGS_UPDATED) {
        // Background refresh: don't block the UI for realtime events.
        fetchPaymentMethods(true);
        fetchCardTypes();
      }
    });

    return unsubscribe;
  }, [onRefresh, currentEstablishment?.id]);

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
    if (isEditingInactiveMethod) {
      return;
    }

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
        movePaymentMethodsCreateViewToActive();
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
    const impact = await api.get(`/app-settings/payment-methods/${methodId}/delete-impact`)
      .then((res) => res.data)
      .catch(() => ({ action: 'deactivate' }));
    const shouldDelete = impact.action === 'delete';
    setConfirmConfig({
      isOpen: true,
      title: shouldDelete ? 'Delete Payment Method' : t('paymentMethods.confirm.removeTitle'),
      message: shouldDelete
        ? `Delete "${name}" permanently? It has no historical orders or reports.`
        : `Deactivate "${name}"? It is used in historical orders, so it will remain in reports.`,
      type: 'danger',
      confirmText: shouldDelete ? t('common.delete', { defaultValue: 'Delete' }) : t('common.deactivate'),
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

  const reactivatePaymentMethod = async (methodId: string) => {
    try {
      await api.put(`/app-settings/payment-methods/${methodId}`, { isActive: true });
      toast.success(t('paymentMethods.messages.reactivated', { defaultValue: 'Payment method reactivated' }));
      setShowModal(false);
      fetchPaymentMethods();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('paymentMethods.messages.failedToSave'));
    }
  };

  const handleAddCardType = async () => {
    if (isEditingInactiveCard) {
      return;
    }

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
        moveCardTypesCreateViewToActive();
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
    const impact = await api.get(`/card-types/${cardId}/delete-impact`)
      .then((res) => res.data)
      .catch(() => ({ action: 'deactivate' }));
    const shouldDelete = impact.action === 'delete';
    setConfirmConfig({
      isOpen: true,
      title: shouldDelete ? 'Delete Card Type' : t('paymentMethods.confirm.deleteCardTitle'),
      message: shouldDelete
        ? `Delete "${name}" permanently? It has no historical orders or reports.`
        : `Deactivate "${name}"? It is used in historical orders, so it will remain in reports.`,
      type: 'danger',
      confirmText: shouldDelete ? t('common.delete', { defaultValue: 'Delete' }) : t('common.deactivate'),
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

  const reactivateCardType = async (cardId: string) => {
    try {
      await api.patch(`/card-types/${cardId}`, { isActive: true });
      toast.success(t('paymentMethods.messages.brandReactivated', { defaultValue: 'Card brand reactivated' }));
      setShowCardModal(false);
      fetchCardTypes();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('paymentMethods.messages.failedToSaveBrand'));
    }
  };

  const getMethodIcon = (name: string, size: number = 24) => {
    const lower = name.toLowerCase();
    if (lower.includes('cash')) return <DollarSign size={size} />;
    if (lower.includes('card') || lower.includes('visa') || lower.includes('master')) return <CreditCard size={size} />;
    if (lower.includes('mobile') || lower.includes('phone') || lower.includes('wallet')) return <Smartphone size={size} />;
    if (lower.includes('online')) return <Globe size={size} />;
    return <Wallet size={size} />;
  };

  const visibleCardTypes = useMemo(
    () =>
      (Array.isArray(cardTypes) ? cardTypes : []).filter((card) =>
        matchesStatusFilter(card.isActive, cardTypeStatusFilter),
      ),
    [cardTypes, cardTypeStatusFilter],
  );

  const visiblePaymentMethods = useMemo(
    () =>
      (Array.isArray(paymentMethods) ? paymentMethods : []).filter((method) =>
        matchesStatusFilter(method.isActive, paymentMethodStatusFilter),
      ),
    [paymentMethods, paymentMethodStatusFilter],
  );
  const cardTypesEmptyLabel =
    cardTypeStatusFilter !== 'ALL'
      ? t('common.noFilteredResults')
      : t('common.noResults', 'No results');

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Full-screen blocker while a user-triggered load is in flight —
          realtime refreshes stay silent. */}
      <BusyOverlay visible={isLoading} />
      {/* Header */}
      <PageHeader
          title={t('paymentMethods.title')}
          subtitle={
              <>
                  <span>{t('paymentMethods.subtitle')}</span>
                  {currentEstablishment?.name && (
                      <Badge>{currentEstablishment.name}</Badge>
                  )}
              </>
          }
      />

      {/* Card Types Section */}
      <section className="bg-white dark:bg-zinc-900/60 rounded-[32px] border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-mintcom-green/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shrink-0 border border-mintcom-green/20">
              <CreditCard size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight leading-tight">
                {t('paymentMethods.cardBrands')}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-stone-500 dark:text-zinc-400 mt-0.5">
                {t('paymentMethods.cardBrandsSubtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-full sm:w-40">
              <SelectInput
                value={cardTypeStatusFilter === 'ALL' ? null : cardTypeStatusFilter}
                onChange={(value) => setCardTypeStatusFilter((value as StatusFilterValue) || 'ALL')}
                options={[
                  { label: t('common.active', 'Active'), value: 'ACTIVE' },
                  { label: t('common.inactive', 'Inactive'), value: 'INACTIVE' },
                ]}
                allOptionLabel={t('common.allStatuses', 'All Statuses')}
                placeholder={t('common.allStatuses', 'All Statuses')}
                searchable={false}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 relative z-10">
          {cardTypes.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-stone-50/50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-zinc-800">
              <p className="text-stone-400 font-black tracking-[0.2em] text-xs uppercase">{t('paymentMethods.noCardBrands')}</p>
            </div>
          ) : visibleCardTypes.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-stone-50/50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-zinc-800">
              <p className="text-stone-400 font-black tracking-[0.2em] text-xs uppercase">{cardTypesEmptyLabel}</p>
            </div>
          ) : (
            visibleCardTypes.map((card) => (
              <motion.div
                layout
                key={card.id}
                className={`group relative bg-white dark:bg-zinc-800/40 rounded-2xl border border-stone-100 dark:border-zinc-800 transition-all duration-300 flex flex-col overflow-hidden ${
                  card.isActive === false ? 'opacity-60' : 'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5'
                }`}
              >
                {/* Image/Icon Container */}
                <div className="h-24 sm:h-28 flex items-center justify-center p-3 sm:p-4 bg-stone-50/50 dark:bg-black/20 relative group-hover:bg-white dark:group-hover:bg-black/40 transition-colors duration-300">
                  <div className="relative w-full h-full max-w-[120px] max-h-[48px] sm:max-h-[56px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    {(() => {
                      const displayUrl = resolveCardLogoUrl(card);
                      // Plain <img> always at full opacity — OptimizedImage left
                      // Visa/MC tiles blank until a hard refresh.
                      if (!displayUrl) {
                        return <CreditCard size={28} className="text-stone-300 dark:text-zinc-600" />;
                      }
                      return (
                        <img
                          src={displayUrl}
                          alt={card.name}
                          loading="eager"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-contain drop-shadow-sm"
                          onError={(event) => {
                            const el = event.currentTarget;
                            const fallback = getFallbackLogo(card.name);
                            if (fallback && el.dataset.fallbackTried !== '1') {
                              el.dataset.fallbackTried = '1';
                              el.src = fallback;
                              return;
                            }
                            el.style.display = 'none';
                          }}
                        />
                      );
                    })()}
                  </div>
                </div>

                {/* Info & Actions */}
                <div className="p-3 sm:p-3.5 flex flex-col gap-2.5 border-t border-stone-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-zinc-100 truncate" title={formatPaymentBrandName(card.name)}>
                      {formatPaymentBrandName(card.name)}
                    </h3>
                    <Badge tone={card.isActive === false ? 'red' : 'green'}>
                      {card.isActive === false ? t('common.inactive', 'Inactive') : t('common.active', 'Active')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setEditingCard(card); setNewCardName(card.name); setCardImagePreview(resolveCardLogoUrl(card)); setSelectedCardImage(null); setShowCardModal(true); setCardErrors({}); }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-stone-50 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:text-mintcom-green hover:bg-mintcom-green/10 border border-stone-100 dark:border-zinc-800 transition-all font-bold text-[11px] active:scale-95"
                    >
                      <Edit2 size={13} /> {t('common.edit')}
                    </button>
                    {card.isActive === false ? (
                      <button
                        onClick={() => reactivateCardType(card.id)}
                        className="p-1.5 rounded-lg bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-mintcom-green hover:bg-mintcom-green/10 border border-stone-100 dark:border-zinc-800 transition-all active:scale-90 shrink-0"
                        title={t('common.reactivate', { defaultValue: 'Reactivate' })}
                      >
                        <RotateCcw size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteCardType(card.id, card.name)}
                        className="p-1.5 rounded-lg bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-red-500 hover:bg-red-500/10 border border-stone-100 dark:border-zinc-800 transition-all active:scale-90 shrink-0"
                        title={t('common.deactivate')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {/* Add New Network Card */}
          {cardTypeStatusFilter === 'ACTIVE' && (
            <motion.button
              layout
              onClick={openCreateCardTypeModal}
              className="group relative min-h-[145px] sm:min-h-[160px] bg-stone-50/50 dark:bg-zinc-800/40 border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 cursor-pointer hover:border-mintcom-green/50 hover:bg-white dark:hover:bg-zinc-800/40 transition-all flex flex-col items-center justify-center gap-2.5"
            >
              <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-stone-200 dark:border-zinc-800 group-hover:bg-mintcom-green/10 group-hover:border-mintcom-green transition-all shadow-sm">
                <Plus size={20} className="text-stone-400 group-hover:text-mintcom-green transition-colors" />
              </div>
              <span className="text-xs font-bold text-stone-500 dark:text-zinc-400 group-hover:text-stone-900 dark:group-hover:text-zinc-100 transition-colors text-center px-1">{t('paymentMethods.addBrand')}</span>
            </motion.button>
          )}
        </div>
      </section>

      {/* Main Section */}
      <section className="bg-white dark:bg-zinc-900/60 rounded-[32px] border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-mintcom-green/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shrink-0 border border-mintcom-green/20">
              <Wallet size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight leading-tight">
                {t('paymentMethods.paymentTypes')}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-stone-500 dark:text-zinc-400 mt-0.5">
                {t('paymentMethods.paymentTypesSubtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-full sm:w-40">
              <SelectInput
                value={paymentMethodStatusFilter === 'ALL' ? null : paymentMethodStatusFilter}
                onChange={(value) => setPaymentMethodStatusFilter((value as StatusFilterValue) || 'ALL')}
                options={[
                  { label: t('common.active', 'Active'), value: 'ACTIVE' },
                  { label: t('common.inactive', 'Inactive'), value: 'INACTIVE' },
                ]}
                allOptionLabel={t('common.allStatuses', 'All Statuses')}
                placeholder={t('common.allStatuses', 'All Statuses')}
                searchable={false}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 relative z-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="min-h-[145px] sm:min-h-[160px] rounded-2xl bg-stone-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 relative z-10">
            {visiblePaymentMethods.map((method) => (
              <motion.div
                layout
                key={method.id}
                className={`group relative bg-white dark:bg-zinc-800/40 rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${method.isActive
                  ? 'border-stone-100 dark:border-zinc-800 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5'
                  : 'border-stone-100 dark:border-zinc-800 opacity-50 grayscale'
                  }`}
              >
                {/* Icon Container */}
                <div className="h-24 sm:h-28 flex items-center justify-center p-3 sm:p-4 bg-stone-50/50 dark:bg-black/20 relative group-hover:bg-white dark:group-hover:bg-black/40 transition-colors duration-300">
                  <div className="relative w-full h-full max-w-[120px] max-h-[48px] sm:max-h-[56px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    {getImageUrl(method.imageUrl || method.logo) || getFallbackLogo(method.name) ? (
                      <OptimizedImage
                        src={getImageUrl(method.imageUrl || method.logo) || getFallbackLogo(method.name)!}
                        alt={method.name}
                        className="w-full h-full drop-shadow-sm"
                        objectFit="contain"
                      />
                    ) : (
                      <div className="text-stone-400 dark:text-zinc-500">
                        {getMethodIcon(method.name, 32)}
                      </div>
                    )}
                  </div>
                  {method.isDefault && (
                    <div className="absolute top-2 left-2">
                      <div className="px-1.5 py-0.5 rounded-md bg-blue-500 text-white text-[9px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md shadow-blue-500/20">
                        <Star size={9} fill="currentColor" /> {t('paymentMethods.system')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="p-3 sm:p-3.5 flex flex-col gap-2.5 border-t border-stone-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-zinc-100 truncate" title={method.name}>{method.name}</h3>
                    <Badge tone={method.isActive ? 'green' : 'red'}>
                      {method.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {!method.isDefault ? (
                      <>
                        <button
                          onClick={() => { setEditingMethod(method); reset({ name: method.name, isActive: method.isActive }); setImagePreview(method.imageUrl || null); setShowModal(true); }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-stone-50 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:text-mintcom-green hover:bg-mintcom-green/10 border border-stone-100 dark:border-zinc-800 transition-all font-bold text-[11px] active:scale-95"
                        >
                          <Edit2 size={13} /> {t('common.edit')}
                        </button>
                        {method.isActive ? (
                          <button
                            onClick={() => handleDelete(method.id, method.name)}
                            className="p-1.5 rounded-lg bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-red-500 hover:bg-red-500/10 border border-stone-100 dark:border-zinc-800 transition-all active:scale-90 shrink-0"
                            title={t('common.deactivate')}
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => reactivatePaymentMethod(method.id)}
                            className="p-1.5 rounded-lg bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-mintcom-green hover:bg-mintcom-green/10 border border-stone-100 dark:border-zinc-800 transition-all active:scale-90 shrink-0"
                            title={t('common.reactivate', { defaultValue: 'Reactivate' })}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 py-1.5 text-center text-[9px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50 dark:bg-zinc-800 rounded-lg border border-stone-100 dark:border-zinc-800">
                        {t('common.systemDefault', 'System Default')}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add New Method Card */}
            {paymentMethodStatusFilter === 'ACTIVE' && (
              <motion.button
                layout
                onClick={openCreatePaymentMethodModal}
                className="group relative min-h-[145px] sm:min-h-[160px] bg-stone-50/50 dark:bg-zinc-800/40 border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 cursor-pointer hover:border-mintcom-green/50 hover:bg-white dark:hover:bg-zinc-800/40 transition-all flex flex-col items-center justify-center gap-2.5"
              >
                <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-stone-200 dark:border-zinc-800 group-hover:bg-mintcom-green/10 group-hover:border-mintcom-green transition-all shadow-sm">
                  <Plus size={20} className="text-stone-400 group-hover:text-mintcom-green transition-colors" />
                </div>
                <span className="text-xs font-bold text-stone-500 dark:text-zinc-400 group-hover:text-stone-900 dark:group-hover:text-zinc-100 transition-colors text-center px-1">{t('paymentMethods.addPayment')}</span>
              </motion.button>
            )}
          </div>
        )}
      </section>

      {/* Payment Method Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalHeader
          title={editingMethod ? t('paymentMethods.editPayment') : t('paymentMethods.addPayment')}
          icon={<Wallet size={24} />}
          onClose={() => setShowModal(false)}
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 bg-stone-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-stone-200 dark:border-zinc-800 overflow-hidden relative group transition-all hover:border-mintcom-green/50">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-4" loading="lazy" decoding="async" />
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
                        <Upload size={32} className="text-stone-300" />
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{t('common.upload')}</span>
                        <input  maxLength={255}type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-stone-400 dark:text-zinc-500 mt-2 text-center px-4">
                    {t('common.imageRecommendation', { defaultValue: 'Recommended: 512x512px (Square) or 4:3. PNG or SVG for transparency.' })}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-normal text-stone-400 tracking-[0.2em]  px-1 flex items-center gap-2">
                      {t('paymentMethods.form.nameLabel')} <span className="text-mintcom-red">*</span>
                    </label>
                    <input maxLength={255}
                      type="text"
                      {...register('name')}
                      className={`w-full px-5 py-4 bg-stone-50 dark:bg-black/20 border ${errors.name ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl text-stone-900 dark:text-zinc-100 font-normal focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 transition-all shadow-sm`}
                      placeholder={formatInputPlaceholder(t('paymentMethods.form.namePlaceholder'), t('common.locale'))}
                    />
                    {errors.name && <p className="text-mintcom-red text-[10px] font-black mt-2 px-1 uppercase tracking-widest">{errors.name.message}</p>}
                  </div>
                </div>

          </ModalBody>

          <ModalFooter>
            {isEditingInactiveMethod ? (
              <>
                <ModalCancelButton onClick={() => setShowModal(false)} disabled={isSubmitting}>
                  {t('common.cancel')}
                </ModalCancelButton>
                <ModalSubmitButton
                  type="button"
                  onClick={() => editingMethod && reactivatePaymentMethod(editingMethod.id)}
                  loading={isSubmitting}
                >
                  <RotateCcw size={16} />
                  {t('common.reactivate', { defaultValue: 'Reactivate' })}
                </ModalSubmitButton>
              </>
            ) : (
              <>
                {editingMethod && !editingMethod.isDefault && editingMethod.isActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      handleDelete(editingMethod.id, editingMethod.name);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 border border-mintcom-red/20 text-mintcom-red font-semibold text-sm rounded-lg hover:bg-mintcom-red/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    {t('common.deactivate')}
                  </button>
                )}
                <ModalSubmitButton loading={isSubmitting} disabled={!watchName?.trim()}>
                  {editingMethod ? t('common.save') : t('common.add')}
                </ModalSubmitButton>
              </>
            )}
          </ModalFooter>
        </form>
      </Modal>

      {/* Card Type Modal */}
      <Modal isOpen={showCardModal} onClose={() => setShowCardModal(false)} size="md">
        <ModalHeader
          title={editingCard ? t('paymentMethods.editBrand') : t('paymentMethods.addBrand')}
          icon={<CreditCard size={24} />}
          onClose={() => setShowCardModal(false)}
        />

        <ModalBody className="space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-32 h-32 bg-stone-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-stone-200 dark:border-zinc-800 overflow-hidden relative group transition-all ${isEditingSystemCard ? '' : 'hover:border-mintcom-green/50'}`}>
                    {isEditingSystemCard ? (
                      <>
                        <img src={cardImagePreview || resolveCardLogoUrl(editingCard!) || undefined} alt={editingCard!.name} className="w-full h-full object-contain p-4" />
                        <div className="absolute inset-x-0 bottom-0 py-1.5 bg-black/60 text-white flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider">
                          <Lock size={11} /> {t('paymentMethods.system')}
                        </div>
                      </>
                    ) : cardImagePreview ? (
                      <>
                        <img src={cardImagePreview} alt="Preview" className="w-full h-full object-contain p-4" loading="lazy" decoding="async" />
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
                        <Upload size={32} className="text-stone-300" />
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{t('common.upload')}</span>
                        <input  maxLength={255}type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleCardImageChange} />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-stone-400 dark:text-zinc-500 mt-2 text-center px-4">
                    {isEditingSystemCard
                      ? t('paymentMethods.form.systemBrandLocked')
                      : t('common.imageRecommendation', { defaultValue: 'Recommended: 512x512px (Square) or 4:3. PNG or SVG for transparency.' })}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-normal text-stone-400 tracking-[0.2em]  px-1 flex items-center gap-2">
                      {t('paymentMethods.form.nameLabel')} <span className="text-mintcom-red">*</span>
                    </label>
                    <input maxLength={255}
                      type="text"
                      value={newCardName}
                      onChange={(e) => {
                        setNewCardName(e.target.value);
                        if (cardErrors.cardName) setCardErrors({ ...cardErrors, cardName: '' });
                      }}
                      disabled={isEditingSystemCard}
                      className={`w-full px-5 py-4 bg-stone-50 dark:bg-black/20 border ${cardErrors.cardName ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl text-stone-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60`}
                      placeholder={formatInputPlaceholder(t('paymentMethods.form.brandPlaceholder'), t('common.locale'))}
                    />
                    {cardErrors.cardName && <p className="text-mintcom-red text-[10px] font-black mt-2 px-1 uppercase tracking-widest">{cardErrors.cardName}</p>}
                  </div>
                </div>

        </ModalBody>

        <ModalFooter>
          {isEditingInactiveCard ? (
            <>
              <ModalCancelButton onClick={() => setShowCardModal(false)} disabled={isSubmitting}>
                {t('common.cancel')}
              </ModalCancelButton>
              <ModalSubmitButton
                type="button"
                onClick={() => editingCard && reactivateCardType(editingCard.id)}
                loading={isSubmitting}
              >
                <RotateCcw size={16} />
                {t('common.reactivate', { defaultValue: 'Reactivate' })}
              </ModalSubmitButton>
            </>
          ) : (
            <>
              {editingCard && editingCard.isActive !== false && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCardModal(false);
                    handleDeleteCardType(editingCard.id, editingCard.name);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 border border-mintcom-red/20 text-mintcom-red font-semibold text-sm rounded-lg hover:bg-mintcom-red/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {t('common.deactivate')}
                </button>
              )}
              <ModalSubmitButton
                type="button"
                onClick={handleAddCardType}
                loading={isSubmitting}
                disabled={isEditingSystemCard || !newCardName.trim()}
              >
                {editingCard ? t('common.save') : t('common.add')}
              </ModalSubmitButton>
            </>
          )}
        </ModalFooter>
      </Modal>

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

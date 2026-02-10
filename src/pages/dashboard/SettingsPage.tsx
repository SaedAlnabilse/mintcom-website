import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useBlocker } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Save, CreditCard, Receipt, Trash2, AlertTriangle, Clock, Plus, DollarSign } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EstablishmentDeletionWizard, PendingDeletionBanner } from '../../components/EstablishmentDeletionWizard';
import { CustomSelect } from '../../components/CustomSelect';
import { useCurrency } from '../../context/CurrencyContext';
import { useTranslation } from 'react-i18next';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface AppSettings {
  id?: string;
  restaurantName: string;
  restaurantDescription?: string;
  restaurantAddress?: string;
  email?: string;
  logo?: string;
  receiptLogo?: string;
  taxRate: number;
  taxIdNumber?: string;
  currency: string;
  showLogoOnReceipt: boolean;
  receiptHeader?: string;
  farewellMessage?: string;
  // Receipt display options
  showRestaurantName?: boolean;
  showDescription?: boolean;
  showAddress?: boolean;
  showTaxId?: boolean;
  showFarewellMessage?: boolean;
  openingTime?: string;
  closingTime?: string;
  operatingSchedule?: {
    [key: string]: {
      isOpen: boolean;
      open: string;
      close: string;
    };
  };
}





type SettingsTab = 'profile' | 'sales' | 'receipt' | 'loyalty' | 'danger';

interface DeletionStatus {
  id: string;
  name: string;
  status: 'active' | 'pending_deletion' | 'deleted';
  deletionRequestedAt: string | null;
  deletionScheduledFor: string | null;
  deletionExportSentTo: string | null;
  canCancel: boolean;
  daysRemaining: number | null;
}

interface EstablishmentInfo {
  id: string;
  name: string;
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { refreshCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [receiptLogoPreview, setReceiptLogoPreview] = useState<string | null>(null);
  const [selectedReceiptLogo, setSelectedReceiptLogo] = useState<File | null>(null);
  const [initialSettings, setInitialSettings] = useState<AppSettings | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onClose?: () => void;
    type?: 'danger' | 'success' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AppSettings>();

  // Watch all form values for dirty state comparison
  const watchedValues = watch();

  // Watch receipt display options
  const showRestaurantName = watch('showRestaurantName');
  const showDescription = watch('showDescription');

  const showAddress = watch('showAddress');
  const showTaxId = watch('showTaxId');
  const showFarewellMessage = watch('showFarewellMessage');





  // Check if form has changes by comparing watched values with initial settings
  const hasFormChanges = (() => {
    if (!initialSettings) return false;
    // Compare relevant form fields that are actually in the form
    const fieldsToCompare = [
      'restaurantName', 'restaurantDescription', 'restaurantAddress', 'email',
      'taxIdNumber', 'taxRate', 'currency', 'showLogoOnReceipt', 'receiptHeader',
      'farewellMessage', 'showRestaurantName', 'showDescription', 'showAddress',
      'showTaxId', 'showFarewellMessage'
    ];
    for (const field of fieldsToCompare) {
      const watchedVal = watchedValues[field as keyof AppSettings];
      const initialVal = initialSettings[field as keyof AppSettings];

      // Normalize values for comparison (handle null/undefined/empty string)
      const normWatched = (watchedVal === undefined || watchedVal === null) ? '' : watchedVal;
      const normInitial = (initialVal === undefined || initialVal === null) ? '' : initialVal;

      if (normWatched !== normInitial) return true;
    }
    // Compare operating schedule separately with deep equality
    if (JSON.stringify(watchedValues.operatingSchedule) !== JSON.stringify(initialSettings.operatingSchedule)) {
      return true;
    }
    return false;
  })();

  // Combined dirty state
  const hasUnsavedChanges = hasFormChanges || !!selectedLogo || !!selectedReceiptLogo;

  // Navigation blocker with proper dependency tracking
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
      if (blocker.state === 'blocked') {
      setConfirmConfig({
        isOpen: true,
        title: t('common.notice'),
        message: t('common.validationError'),
        type: 'warning',
        onConfirm: () => {
          blocker.proceed();
        },
        onClose: () => {
          blocker.reset();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else if (blocker.state === 'unblocked') {
      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    }
  }, [blocker.state]);




  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchSettings = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const response = await api.get('/app-settings');
      const data = response.data;

      // Initialize schedule if missing from backend
      if (!data.operatingSchedule || Object.keys(data.operatingSchedule).length === 0) {
        const defaultSchedule: Record<string, { isOpen: boolean; open: string; close: string }> = {};
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
          defaultSchedule[day] = {
            isOpen: true,
            open: data.openingTime || '09:00',
            close: data.closingTime || '22:00'
          };
        });
        data.operatingSchedule = defaultSchedule;
      }

      // Set logo previews
      if (data.logo) {
        setPreviewImage(data.logo);
      } else {
        setPreviewImage(null);
      }

      if (data.receiptLogo) {
        setReceiptLogoPreview(data.receiptLogo);
      } else {
        setReceiptLogoPreview(null);
      }

      // Convert taxRate from decimal (0.16) to percentage (16) for display
      const formData = {
        ...data,
        taxRate: data.taxRate ? Math.round(data.taxRate * 100 * 100) / 100 : 0
      };

      // Populate form with fetched data
      reset(formData);
      setInitialSettings(formData);
      setSettings(data);
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || t('settings.messages.loadFailed'));
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };





  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReceiptLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedReceiptLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: AppSettings) => {
    const isCurrencyChanged = initialSettings && data.currency !== initialSettings.currency;

    if (isCurrencyChanged) {
      triggerTwoStepConfirm(
        t('settings.confirm.changeCurrencyTitle'),
        t('settings.confirm.changeCurrencyMessage', { from: initialSettings?.currency, to: data.currency }),
        () => saveSettings(data)
      );
      return;
    }

    saveSettings(data);
  };

  const saveSettings = async (data: AppSettings) => {
    try {
      setIsSaving(true);

      if (selectedLogo) {
        const formData = new FormData();
        formData.append('file', selectedLogo);
        formData.append('type', 'logo');

        try {
          const uploadRes = await api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          data.logo = uploadRes.data.url;
        } catch (err) {
          console.error('Logo upload failed');
        }
      }

      if (selectedReceiptLogo) {
        const formData = new FormData();
        formData.append('file', selectedReceiptLogo);
        formData.append('type', 'receipt-logo');

        try {
          const uploadRes = await api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          data.receiptLogo = uploadRes.data.url;
        } catch (err) {
          console.error('Receipt Logo upload failed');
        }
      }

      const submissionData = {
        ...data,
        taxRate: Number(data.taxRate) / 100
      };

      await api.put('/app-settings', submissionData);



      setConfirmConfig({
        isOpen: true,
        title: t('settings.confirm.taxUpdatedTitle'),
        message: t('settings.confirm.taxUpdatedMessage'),
        type: 'success',
        confirmText: t('common.yes'),
        showCancel: false,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      setSelectedLogo(null);
      setSelectedReceiptLogo(null);

      // Refresh data without showing loading spinner to keep form mounted for proper reset
      // Also refresh currency context to sync with POS
      await Promise.all([
        fetchSettings(false),
        refreshCurrency()
      ]);
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || t('settings.messages.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const triggerTwoStepConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      type: 'warning',
      onConfirm: () => {
        setTimeout(() => {
          setConfirmConfig({
            isOpen: true,
            title: t('common.finalConfirmation'),
            message: t('settings.confirm.criticalChange'),
            type: 'danger',
            onConfirm,
          });
        }, 300);
      }
    });
  };

  const updateTaxRate = async () => {
    const rawValue = watch('taxRate');
    const rateNum = Number(rawValue);

    if (isNaN(rateNum) || rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
      setConfirmConfig({
        isOpen: true,
        title: t('common.entryError'),
        message: t('settings.sales.enterValidTax'),
        type: 'warning',
        onConfirm: () => { },
        onClose: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    if (rateNum < 0 || rateNum > 100) {
      setConfirmConfig({
        isOpen: true,
        title: t('settings.sales.invalidTaxTitle'),
        message: t('settings.sales.invalidTaxMessage'),
        type: 'danger',
        confirmText: t('common.gotIt'),
        showCancel: false,
        onConfirm: () => { },
        onClose: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const isChanged = initialSettings && rateNum !== Number(initialSettings.taxRate);

    if (isChanged) {
      triggerTwoStepConfirm(
        t('settings.confirm.updateTaxTitle'),
        t('settings.confirm.updateTaxMessage', { from: initialSettings.taxRate, to: rateNum }),
        async () => {
          try {
            await api.put('/app-settings/tax-rate', { taxRate: rateNum / 100 });
            setConfirmConfig({
              isOpen: true,
              title: t('settings.confirm.taxUpdatedTitle'),
              message: t('settings.confirm.taxUpdatedMessage'),
              type: 'success',
              confirmText: t('common.yes'),
              showCancel: false,
              onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            });
            fetchSettings(false);
          } catch (err) {
            toast.error((err as ApiError).response?.data?.message || t('settings.messages.saveFailed'));
          }
        }
      );
      return;
    }

    toast.error(t('settings.messages.taxRateNoChange'));
  };

  // Deletion state
  const [showDeletionWizard, setShowDeletionWizard] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [establishmentInfo, setEstablishmentInfo] = useState<EstablishmentInfo | null>(null);
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);

  useEffect(() => {
    fetchEstablishmentInfo();
  }, []);

  const fetchEstablishmentInfo = async () => {
    try {
      const currentEstablishment = sessionStorage.getItem('currentEstablishment');
      if (currentEstablishment) {
        const parsed = JSON.parse(currentEstablishment);
        setEstablishmentInfo({ id: parsed.id, name: parsed.name });
        const response = await api.get(`/api/establishments/${parsed.id}/deletion-status`);
        setDeletionStatus(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch establishment info:', err);
    }
  };

  const handleCancelDeletion = async () => {
    if (!establishmentInfo) return;
    try {
      setIsCancellingDeletion(true);
      await api.post(`/api/establishments/${establishmentInfo.id}/cancel-deletion`);
      setConfirmConfig({
        isOpen: true,
        title: t('settings.confirm.actionCancelledTitle'),
        message: t('settings.confirm.actionCancelledMessage'),
        type: 'success',
        confirmText: t('common.gotIt'),
        showCancel: false,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      fetchEstablishmentInfo();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.danger.cancelFailed'));
    } finally {
      setIsCancellingDeletion(false);
    }
  };

  const handleTabChange = (newTab: SettingsTab) => {
    if (activeTab === newTab) return;

    if (hasUnsavedChanges) {
      setConfirmConfig({
        isOpen: true,
        title: t('common.notice'),
        message: t('common.validationError'),
        type: 'warning',
        onConfirm: () => {
          // Reset form data to initial state
          if (initialSettings) reset(initialSettings);

          // Reset image preview if it was changed
          if (initialSettings?.logo) {
            setPreviewImage(initialSettings.logo);
          } else {
            setPreviewImage(null);
          }
          if (initialSettings?.receiptLogo) {
            setReceiptLogoPreview(initialSettings.receiptLogo);
          } else {
            setReceiptLogoPreview(null);
          }
          setSelectedLogo(null);
          setSelectedReceiptLogo(null);

          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          setActiveTab(newTab);
        },
        showCancel: true,
        confirmText: t('common.continue'),
        cancelText: t('common.cancel'),
        onClose: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setActiveTab(newTab);
  };

  const tabs = [
    { id: 'profile', label: t('settings.tabs.profile'), icon: Store },
    { id: 'sales', label: t('settings.tabs.sales'), icon: CreditCard },
    { id: 'receipt', label: t('settings.tabs.receipts'), icon: Receipt },

    { id: 'danger', label: t('settings.tabs.danger'), icon: Trash2, isDanger: true },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-paymint-green/20 rounded-full" />
          <div className="w-16 h-16 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <p className="text-xs font-black text-gray-400 tracking-widest">{t('settings.messages.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
              {t('settings.badge')}
            </span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green" />
              </span>
              <span className="text-xs font-bold text-gray-400 tracking-widest">{t('common.live')}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">
            {t('settings.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit(onSubmit, (errs) => {
            if (errs.taxRate) {
              setConfirmConfig({
                isOpen: true,
                title: t('common.error'),
                message: errs.taxRate.message as string || t('settings.confirm.invalidTaxMessage'),
                type: 'danger',
                confirmText: t('common.gotIt'),
                showCancel: false,
                onConfirm: () => { },
                onClose: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
              });
            } else {
              toast.error(t('settings.messages.formErrors'));
            }
          })}
          disabled={isSaving || !hasUnsavedChanges}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
        >
          {isSaving ? <div className="w-[18px] h-[18px] border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save size={18} />}
          <span>{t('settings.saveChanges')}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-1 p-1.5 bg-gray-100 dark:bg-black/40 rounded-2xl border border-gray-200 dark:border-white/[0.1] w-full relative isolate shadow-2xl backdrop-blur-xl ring-1 ring-black/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id as SettingsTab)}
            className={`relative flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all duration-300 ${activeTab === tab.id
              ? tab.isDanger
                ? 'text-paymint-red'
                : 'text-black'
              : tab.isDanger
                ? 'text-paymint-red hover:bg-paymint-red/10'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-settings-tab"
                className={`absolute inset-0 rounded-xl -z-10 shadow-[0_8px_20px_-4px_rgba(124,195,159,0.3)] ${tab.isDanger ? 'bg-paymint-red/10 border border-paymint-red/20' : 'bg-paymint-green'
                  }`}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <tab.icon size={16} />
            <span className="hidden md:inline">{tab.label}</span>
            <span className="md:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, (errs) => {
        if (errs.taxRate) {
          setConfirmConfig({
            isOpen: true,
            title: t('settings.confirm.entryErrorTitle'),
            message: errs.taxRate.message as string || t('settings.confirm.invalidTaxMessage'),
            type: 'danger',
            confirmText: t('common.gotIt'),
            showCancel: false,
            onConfirm: () => { },
            onClose: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      })} className="space-y-8">
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] p-8 space-y-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.tabs.profile')}</h3>
            <div>
              <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">{t('settings.profile.logo')}</label>
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/5">
                  {previewImage ? <img src={previewImage} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
                </div>
                <label className="px-5 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.03] rounded-xl text-gray-900 dark:text-white font-bold text-sm shadow-sm transition-all">
                  {t('settings.profile.changeLogo')}
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">{t('settings.profile.name')}</label>
              <input type="text" {...register('restaurantName')} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-medium" />
            </div>
            <div>
              <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">{t('settings.profile.about')}</label>
              <textarea {...register('restaurantDescription')} rows={3} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-medium resize-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">{t('settings.profile.address')}</label>
                <input type="text" {...register('restaurantAddress')} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-medium" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">{t('settings.profile.email')}</label>
                <input type="email" {...register('email')} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-medium" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">{t('settings.profile.taxId')}</label>
                <input type="text" {...register('taxIdNumber')} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-medium" />
              </div>
            </div>
            <div className="pt-8 border-t border-gray-100 dark:border-white/5 relative overflow-hidden">
              {/* Coming Soon Overlay for Opening Hours */}
              <div className="absolute inset-0 z-20 bg-white/60 dark:bg-[#0B1120]/80 backdrop-blur-[2px] flex items-center justify-center">
                <div className="bg-white dark:bg-gray-900 px-6 py-3 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex items-center gap-3 animate-bounce-slow">
                  <div className="w-2 h-2 rounded-full bg-paymint-green animate-pulse" />
                  <span className="text-sm font-black text-gray-900 dark:text-white tracking-widest uppercase">{t('settings.profile.comingSoon')}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 opacity-40">
                <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green shadow-sm">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white tracking-widest px-1">{t('settings.profile.openingHours')}</h4>
                  <p className="text-xs text-gray-400 font-black tracking-widest px-1">{t('settings.profile.setServiceTimes')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6 opacity-40 grayscale-[0.5]">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const currentSchedule = watch('operatingSchedule') || {};
                  const dayConfig = currentSchedule[day];
                  const isOpen = dayConfig ? dayConfig.isOpen : !!watch('openingTime');
                  return (
                    <button key={day} type="button" disabled className={`relative flex-1 min-w-[3.5rem] h-14 rounded-xl flex flex-col items-center justify-center gap-1 border bg-white dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/10 cursor-not-allowed`}>
                      <span className="text-xs font-black tracking-widest uppercase">{t(`common.daysShort.${day}`)}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-paymint-green/50' : 'bg-gray-300 dark:bg-white/20'}`} />
                    </button>
                  );
                })}
              </div>
              <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/50 dark:bg-black/5 opacity-40">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center mx-auto mb-4 text-gray-400 shadow-sm">
                  <Plus size={24} />
                </div>
                <p className="text-xs font-black text-gray-400 tracking-widest">{t('settings.profile.selectDay')}</p>
                <p className="text-xs font-black text-gray-400 mt-1 tracking-widest">{t('settings.profile.chooseDays')}</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'sales' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] p-8 space-y-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.sales.title')}</h3>
                  <p className="text-xs text-gray-400 font-black tracking-widest px-1">{t('settings.sales.subtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-200 dark:border-white/[0.05] flex flex-col justify-between shadow-lg backdrop-blur-sm transition-all hover:border-paymint-green/20 group/card">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-black text-paymint-green tracking-[0.2em] mb-1">{t('settings.sales.taxLabel')}</p>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.sales.taxRate')}</h4>
                    </div>
                    <button type="button" onClick={updateTaxRate} className="px-4 py-2 bg-paymint-green text-black text-xs font-black tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-paymint-green/10">{t('settings.sales.update')}</button>
                  </div>
                  <div className={`relative group transition-all`}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const target = e.target as HTMLInputElement;
                        if (Number(target.value) < 0) {
                          target.value = '0';
                        }
                        // Limit to 5 decimal places to allow high-precision entry (e.g., .11111 -> 11.111)
                        if (target.value.includes('.')) {
                          const parts = target.value.split('.');
                          if (parts[1].length > 5) {
                            target.value = `${parts[0]}.${parts[1].slice(0, 5)}`;
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      {...register('taxRate', {
                        required: true,
                        valueAsNumber: true,
                        max: { value: 100, message: t('settings.sales.taxErrorRange') },
                        min: { value: 0, message: t('settings.sales.taxErrorRange') },
                        onBlur: (e) => {
                          const val = parseFloat(e.target.value);
                          if (val > 0 && val < 1) {
                            setValue('taxRate', parseFloat((val * 100).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 5 })), { shouldDirty: true });
                          } else if (!isNaN(val)) {
                            setValue('taxRate', parseFloat(val.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 5 })), { shouldDirty: true });
                          }
                        }
                      })}
                      className={`w-full h-16 bg-white dark:bg-white/[0.03] border ${errors.taxRate ? 'border-red-500 bg-red-500/5' : 'border-gray-200 dark:border-white/[0.08]'} rounded-2xl px-6 font-bold text-3xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${errors.taxRate ? 'focus:ring-red-500/20' : 'focus:ring-paymint-green/20'} transition-all pr-16 group-hover:border-paymint-green/50 shadow-sm`}
                    />
                    <div className={`absolute ${t('common.locale') === 'ar' ? 'left-6' : 'right-6'} top-1/2 -translate-y-1/2 font-bold text-xl transition-colors ${errors.taxRate ? 'text-red-500' : 'text-gray-400 group-focus-within:text-paymint-green'}`}>%</div>
                  </div>
                  {errors.taxRate && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={18} className="text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-red-500 tracking-widest leading-none mb-1">{t('settings.sales.invalidInput')}</p>
                        <p className="text-xs font-bold text-red-500/80 tracking-tight">{errors.taxRate.message as string || t('settings.sales.taxErrorGeneric')}</p>
                      </div>
                    </motion.div>
                  )}
                  <p className="text-xs font-black text-gray-400 mt-6 leading-relaxed tracking-tight flex items-start gap-2">
                    <span className="text-paymint-green">•</span>
                    {t('settings.sales.taxWarning')}
                  </p>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-200 dark:border-white/[0.05] flex flex-col justify-between shadow-lg backdrop-blur-sm transition-all hover:border-paymint-green/20 group/card">
                  <div className="mb-6">
                    <p className="text-xs font-black text-blue-500 tracking-[0.2em] mb-1">{t('settings.sales.currencyLabel')}</p>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('settings.sales.currency')}</h4>
                  </div>
                  <div className="relative">
                    <input type="hidden" {...register('currency')} />
                    <CustomSelect
                      value={watch('currency')}
                      onChange={(val) => { setValue('currency', String(val), { shouldDirty: true }); }}
                      options={[
                        { label: t('onboarding.step1.currencies.JOD'), value: 'JOD' },
                        { label: t('onboarding.step1.currencies.USD'), value: 'USD' },
                        { label: t('onboarding.step1.currencies.AED'), value: 'AED' },
                        { label: t('onboarding.step1.currencies.SAR'), value: 'SAR' },
                        { label: t('onboarding.step1.currencies.KWD'), value: 'KWD' },
                        { label: t('onboarding.step1.currencies.QAR'), value: 'QAR' },
                        { label: t('onboarding.step1.currencies.BHD'), value: 'BHD' },
                        { label: t('onboarding.step1.currencies.OMR'), value: 'OMR' },
                        { label: t('onboarding.step1.currencies.EGP'), value: 'EGP' },
                        { label: t('onboarding.step1.currencies.GBP'), value: 'GBP' },
                        { label: t('onboarding.step1.currencies.EUR'), value: 'EUR' },
                        { label: t('onboarding.step1.currencies.TRY'), value: 'TRY' },
                      ]}
                    />
                  </div>
                  <p className="text-xs font-black text-gray-400 mt-6 leading-relaxed tracking-tight flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    {t('settings.sales.currencyDesc')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'receipt' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-paymint-green" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.receipts.title')}</h3>
                <p className="text-sm text-gray-500 font-medium">{t('settings.receipts.subtitle')}</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="space-y-4 p-6 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-200 dark:border-white/5">
                <h4 className="text-sm font-black text-gray-900 dark:text-white tracking-widest mb-6 px-1">{t('settings.receipts.options')}</h4>
                <div className="space-y-4">
                  {/* Identity Visibility */}
                  <div className="p-4 bg-white dark:bg-[#0B1120] rounded-xl border border-gray-100 dark:border-white/[0.03] shadow-sm space-y-4 transition-all">
                    <div className="space-y-4">
                      {/* Restaurant Name */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="block text-xs font-black text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.showName')}</span>
                            <span className="block text-xs font-bold text-gray-400 mt-0.5">{t('settings.receipts.showNameDesc')}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" {...register('showRestaurantName')} className="sr-only peer" />
                            <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                          </label>
                        </div>
                        <input
                          type="text"
                          {...register('restaurantName')}
                          disabled={!showRestaurantName}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                          placeholder={t('settings.profile.namePlaceholder')}
                        />
                      </div>
                      {/* Description / Tagline */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="block text-xs font-black text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.showTagline')}</span>
                            <span className="block text-xs font-bold text-gray-400 mt-0.5">{t('settings.receipts.showTaglineDesc')}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" {...register('showDescription')} className="sr-only peer" />
                            <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                          </label>
                        </div>
                        <input
                          type="text"
                          {...register('restaurantDescription')}
                          disabled={!showDescription}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                          placeholder={t('settings.profile.aboutPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Branding */}
                  <div className="p-4 bg-white dark:bg-[#0B1120] rounded-xl border border-gray-100 dark:border-white/[0.03] shadow-sm space-y-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-black text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.showLogo')}</span>
                        <span className="block text-xs font-bold text-gray-400 mt-0.5">{t('settings.receipts.showLogoDesc')}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" {...register('showLogoOnReceipt')} className="sr-only peer" />
                        <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                      </label>
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${watch('showLogoOnReceipt') ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                      <div className="flex items-center gap-6 p-2">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/5">
                          {receiptLogoPreview ? <img src={receiptLogoPreview} alt="Receipt Logo" className="w-full h-full object-cover" /> : <Store className="w-8 h-8 text-gray-300 dark:text-gray-600" />}
                        </div>
                        <label className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 cursor-pointer text-xs font-black tracking-widest transition-all">
                          {t('settings.receipts.uploadLogo')}
                          <input type="file" accept="image/*" onChange={handleReceiptLogoChange} className="hidden" disabled={!watch('showLogoOnReceipt')} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="p-4 bg-white dark:bg-[#0B1120] rounded-xl border border-gray-100 dark:border-white/[0.03] shadow-sm space-y-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-black text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.showAddress')}</span>
                        <span className="block text-xs font-bold text-gray-400 mt-0.5">{t('settings.receipts.showAddressDesc')}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" {...register('showAddress')} className="sr-only peer" />
                        <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                      </label>
                    </div>
                    <input
                      type="text"
                      {...register('restaurantAddress')}
                      disabled={!showAddress}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                      placeholder={t('settings.profile.addressPlaceholder')}
                    />
                  </div>

                  {/* Tax Info */}
                  <div className="p-4 bg-white dark:bg-[#0B1120] rounded-xl border border-gray-100 dark:border-white/[0.03] shadow-sm space-y-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-black text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.showTaxId')}</span>
                        <span className="block text-xs font-bold text-gray-400 mt-0.5">{t('settings.receipts.showTaxIdDesc')}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" {...register('showTaxId')} className="sr-only peer" />
                        <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                      </label>
                    </div>
                    <input
                      type="text"
                      {...register('taxIdNumber')}
                      disabled={!showTaxId}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                      placeholder={t('settings.profile.taxIdPlaceholder')}
                    />
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-white dark:bg-[#0B1120] rounded-xl border border-gray-100 dark:border-white/[0.03] shadow-sm space-y-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-black text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.footerMessage')}</span>
                        <span className="block text-xs font-bold text-gray-400 mt-0.5">{t('settings.receipts.footerMessageDesc')}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" {...register('showFarewellMessage')} className="sr-only peer" />
                        <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                      </label>
                    </div>
                    <textarea
                      {...register('farewellMessage')}
                      rows={2}
                      disabled={!showFarewellMessage}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                      placeholder={t('settings.receipts.footerPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}





        {activeTab === 'danger' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50/30 dark:bg-red-900/5 rounded-2xl border border-red-200/50 dark:border-red-900/20 p-8 space-y-10 shadow-sm">

            <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900/10 pb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.danger.title')}</h3>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 font-black tracking-widest px-1">{t('settings.danger.subtitle')}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-black tracking-widest border border-red-200 dark:border-red-900/30">
                {t('settings.danger.warning')}
              </span>
            </div>

            {deletionStatus?.status === 'pending_deletion' ? (
              <div>
                <PendingDeletionBanner deletionStatus={deletionStatus} onCancelDeletion={handleCancelDeletion} isCancelling={isCancellingDeletion} />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-red-200/50 dark:border-red-900/20 shadow-sm">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    {t('settings.danger.description', { name: establishmentInfo?.name || t('settings.danger.thisLocation') })}
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs font-black text-red-500 tracking-tight">
                      <AlertTriangle size={14} />
                      {t('settings.danger.undoWarning')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeletionWizard(true)}
                  className="w-full md:w-auto px-8 py-4 bg-red-600 text-white font-black tracking-widest text-xs rounded-xl hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-red-600/20"
                >
                  {t('settings.danger.startDeletion')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </form>



      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => confirmConfig.onClose ? confirmConfig.onClose() : setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        showCancel={confirmConfig.showCancel}
      />
      {showDeletionWizard && establishmentInfo && (
        <EstablishmentDeletionWizard establishmentId={establishmentInfo.id} establishmentName={establishmentInfo.name} onClose={() => setShowDeletionWizard(false)} onDeletionRequested={() => { fetchEstablishmentInfo(); setShowDeletionWizard(false); }} />
      )}
    </div>
  );
}

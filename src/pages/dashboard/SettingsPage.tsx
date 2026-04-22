import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useBlocker, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Save, CreditCard, Receipt, Trash2, AlertTriangle, DollarSign, Copy, Key } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EstablishmentDeletionWizard, PendingDeletionBanner } from '../../components/EstablishmentDeletionWizard';
import { RestoreLocationModal } from '../../components/RestoreLocationModal';
import { CustomSelect } from '../../components/CustomSelect';
import { useCurrency } from '../../context/CurrencyContext';
import { useTranslation } from 'react-i18next';
import { usePermissionGuard, checkPermission } from '../../hooks/usePermissionGuard';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../hooks/useRealtime';
import { DataChangeEventTypes } from '../../services/realtimeService';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface AppSettings {
  id?: string;
  loginId?: string;
  restaurantName: string;
  restaurantDescription?: string;
  restaurantAddress?: string;
  email?: string;
  logo?: string | null;
  receiptLogo?: string | null;
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
  holdOrderTableCount?: number;
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
  const location = useLocation();
  const { account, currentEstablishment, establishments, setCurrentEstablishment, refreshEstablishments } = useAuth();
  usePermissionGuard([
    'manage_settings',
    'manage_taxes_backoffice',
    'manage_kitchen_printers',
    'manage_pos_devices',
    'manage_establishment_profile',
    'manage_tax_currency',
    'manage_receipt_settings',
    'delete_establishment',
  ]);
  const { refreshCurrency } = useCurrency();
  const accessToken = localStorage.getItem('accessToken');
  const { onRefresh } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
    authToken: accessToken || undefined,
    enabled: !!currentEstablishment?.id,
  });

  const tabs = useMemo(() => {
    const availableTabs = [
      { id: 'profile', label: t('settings.tabs.profile'), icon: Store, permission: 'manage_establishment_profile' },
      { id: 'sales', label: t('settings.tabs.sales'), icon: CreditCard, permission: 'manage_tax_currency' },
      { id: 'receipt', label: t('settings.tabs.receipts'), icon: Receipt, permission: 'manage_receipt_settings' },
      { id: 'danger', label: t('settings.tabs.danger'), icon: Trash2, isDanger: true, permission: 'delete_establishment' },
    ];

    // If owner or has specific permissions, show the tabs
    return availableTabs.filter(tab => checkPermission(account, [tab.permission]));
  }, [account, t]);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const syncTabQueryParam = (tab: SettingsTab) => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === tab) return;

    params.set('tab', tab);
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, document.title, nextUrl);
  };

  // Auto-select first available tab if current is not available
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((t: any) => t.id === activeTab)) {
      const fallbackTab = tabs[0].id as SettingsTab;
      setActiveTab(fallbackTab);
      syncTabQueryParam(fallbackTab);
    }
  }, [tabs, activeTab]);

  // Support deep-linking directly to a settings tab from widget tasks.
  useEffect(() => {
    const state = location.state as { openSettingsTab?: SettingsTab } | null;
    const queryTab = new URLSearchParams(location.search).get('tab') as SettingsTab | null;
    const requestedTab = state?.openSettingsTab || queryTab;
    if (!requestedTab) return;

    if (tabs.some((tab: any) => tab.id === requestedTab)) {
      setActiveTab(requestedTab);
      syncTabQueryParam(requestedTab);
    }

    if (state?.openSettingsTab) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state, location.search, tabs]);

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
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

  const { register, handleSubmit, reset, watch, setValue, clearErrors, formState: { errors } } = useForm<AppSettings>();

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
      'showTaxId', 'showFarewellMessage', 'holdOrderTableCount'
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
  const hasUnsavedChanges = hasFormChanges || !!selectedLogo || !!selectedReceiptLogo || removeLogo;

  // Navigation blocker with proper dependency tracking
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
    setConfirmConfig({
      isOpen: true,
      title: t('settings.messages.unsavedChangesTitle', 'Unsaved Changes'),
      message: t('settings.messages.unsavedChangesMessage', 'You have unsaved changes to your settings. Are you sure you want to leave without saving?'),
      type: 'warning',
      onConfirm: () => {
        blocker.proceed();
      },
      onClose: () => {
        blocker.reset();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      showCancel: true,
      confirmText: t('common.continue', 'Leave'),
      cancelText: t('common.cancel', 'Cancel')
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
      setRemoveLogo(false);

      if (data.receiptLogo) {
        setReceiptLogoPreview(data.receiptLogo);
      } else {
        setReceiptLogoPreview(null);
      }

      // Convert taxRate from decimal (0.16) to percentage (16) for display
      const formData = {
        ...data,
        taxRate: data.taxRate ? Math.round(data.taxRate * 100 * 100) / 100 : 0,
        holdOrderTableCount: Number.isFinite(data.holdOrderTableCount)
          ? Math.min(300, Math.max(0, Math.floor(Number(data.holdOrderTableCount))))
          : 20,
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
      setRemoveLogo(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const unsubscribe = onRefresh((eventType) => {
      if (eventType === DataChangeEventTypes.SETTINGS_UPDATED) {
        fetchSettings(false);
      }
    });

    return unsubscribe;
  }, [onRefresh]);

  const handleRemoveLogo = () => {
    setPreviewImage(null);
    setSelectedLogo(null);
    setRemoveLogo(true);
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

      if (removeLogo) {
        data.logo = null;
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
        taxRate: Number(data.taxRate) / 100,
        holdOrderTableCount: Number.isFinite(data.holdOrderTableCount)
          ? Math.min(300, Math.max(0, Math.floor(Number(data.holdOrderTableCount))))
          : 20,
      };

      await api.put('/app-settings', submissionData);

      const nextRestaurantName = String(data.restaurantName || '').trim();
      if (nextRestaurantName && currentEstablishment && nextRestaurantName !== currentEstablishment.name) {
        // Keep shared establishment state in sync so the new name appears across the app immediately.
        setCurrentEstablishment({ ...currentEstablishment, name: nextRestaurantName });
      }
      if (nextRestaurantName) {
        setEstablishmentInfo(prev => (prev ? { ...prev, name: nextRestaurantName } : prev));
      }



      setConfirmConfig({
        isOpen: true,
        title: t('common.saveChanges'),
        message: t('settings.messages.saveSuccess'),
        type: 'success',
        confirmText: t('common.yes'),
        showCancel: false,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      setSelectedLogo(null);
      setSelectedReceiptLogo(null);
      setRemoveLogo(false);

      // Refresh data without showing loading spinner to keep form mounted for proper reset
      // Also refresh currency context to sync with POS
      await Promise.all([
        fetchSettings(false),
        refreshCurrency()
      ]);
      refreshEstablishments().catch((error) => {
        console.error('[Settings] Failed to refresh establishments after save:', error);
      });
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
  const [showRestoreModal, setShowRestoreModal] = useState(false);

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
    setShowRestoreModal(true);
  };

  const handleRestore = async (data: any) => {
    if (!establishmentInfo) return;
    try {
      setIsCancellingDeletion(true);
      await api.post(`/api/establishments/${establishmentInfo.id}/cancel-deletion`, data);
      
      toast.success(t('security.restore.success'));
      setShowRestoreModal(false);
      
      // Refresh context to update establishment data (new loginId)
      const updatedEstablishments = await refreshEstablishments();
      
      // If the current establishment was updated, we might need to update session storage
      if (updatedEstablishments && updatedEstablishments.length > 0) {
          const updated = updatedEstablishments.find((e: any) => e.id === establishmentInfo.id);
          if (updated) {
              setCurrentEstablishment(updated);
          }
      }

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
        title: t('settings.messages.unsavedChangesTitle', 'Unsaved Changes'),
        message: t('settings.messages.unsavedChangesMessage', 'You have unsaved changes to your settings. Are you sure you want to leave without saving?'),
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
          setRemoveLogo(false);

          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          setActiveTab(newTab);
          syncTabQueryParam(newTab);
        },
        showCancel: true,
        confirmText: t('common.continue'),
        cancelText: t('common.cancel'),
        onClose: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setActiveTab(newTab);
    syncTabQueryParam(newTab);
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('settings.subtitle')}</span>
                        {currentEstablishment?.name && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                                {currentEstablishment.name}
                            </span>
                        )}
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
            } else if (errs.holdOrderTableCount) {
              setConfirmConfig({
                isOpen: true,
                title: t('common.error'),
                message: errs.holdOrderTableCount.message as string || t('settings.sales.holdOrderTableCountErrorRange'),
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
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-[#68B390] transition-all shadow-sm disabled:opacity-50 disabled:shadow-none"
        >
          {isSaving ? <div className="w-[18px] h-[18px] border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save size={18} />}
          <span>{t('settings.saveChanges')}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-1 p-1.5 bg-gray-100 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/[0.1] w-full relative isolate shadow-sm backdrop-blur-xl ring-1 ring-black/20">
        {tabs.map((tab: any) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as SettingsTab)}
              className={`relative flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all duration-300 ${isSelected
                ? tab.isDanger
                  ? 'bg-paymint-red text-white shadow-lg shadow-paymint-red/20'
                  : 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                : tab.isDanger                  ? 'text-paymint-red hover:bg-paymint-red/10'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
            >
              <tab.icon size={16} />
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
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
        } else if (errs.holdOrderTableCount) {
          setConfirmConfig({
            isOpen: true,
            title: t('settings.confirm.entryErrorTitle'),
            message: errs.holdOrderTableCount.message as string || t('settings.sales.holdOrderTableCountErrorRange'),
            type: 'danger',
            confirmText: t('common.gotIt'),
            showCancel: false,
            onConfirm: () => { },
            onClose: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      })} className="space-y-8">
        {activeTab === 'profile' && (() => {
          const profileEstablishments = (account as any)?.establishments || [];
          const contextEstablishments = establishments || [];
          
          let estLoginId = settings?.loginId || currentEstablishment?.establishmentLoginId || (currentEstablishment as any)?.loginId || (currentEstablishment as any)?.locationLoginId || '';
          
          if (!estLoginId && currentEstablishment?.id) {
             const profileMatch = profileEstablishments.find((e: any) => e.id === currentEstablishment.id);
             if (profileMatch) {
                 estLoginId = profileMatch.establishmentLoginId || profileMatch.loginId || profileMatch.locationLoginId || '';
             }
             if (!estLoginId) {
                 const contextMatch = contextEstablishments.find((e: any) => e.id === currentEstablishment.id);
                 if (contextMatch) {
                     estLoginId = (contextMatch as any).establishmentLoginId || (contextMatch as any).loginId || (contextMatch as any).locationLoginId || '';
                 }
             }
          }
          
          return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] p-8 space-y-10 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-gray-100 dark:border-white/5">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('settings.tabs.profile')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('settings.profile.detailsDesc' as any) || 'Manage your establishment identity and branding'}</p>
              </div>
              
              {/* Login ID Section */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 group-hover:border-blue-500/20 transition-colors">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 tracking-widest flex items-center gap-1.5 mb-1">
                    <Key size={12} className="text-gray-400" />
                    {t('owner.account.loginId') || 'Login ID'}
                  </label>
                  <code className="block text-sm font-mono font-bold text-gray-900 dark:text-white truncate select-all">
                    {estLoginId || t('common.na')}
                  </code>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-medium leading-relaxed">
                    {t('settings.profile.passwordResetNote') || 'Password reset can only be done from the owner portal'}
                  </p>
                </div>
                <div className="pl-4 border-l border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      if (estLoginId) {
                        navigator.clipboard.writeText(estLoginId);
                        toast.success(t('common.copied') || 'Copied to clipboard');
                      }
                    }}
                    disabled={!estLoginId}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                  >
                    <Copy size={14} /> 
                    {t('common.copy')}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-black text-gray-900 dark:text-white tracking-widest uppercase">{t('settings.profile.logo')}</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('settings.profile.logoGuidelines')}</p>
              </div>
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/5">
                  {previewImage ? <img src={previewImage} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="px-5 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.03] rounded-xl text-gray-900 dark:text-white font-bold text-sm shadow-sm transition-all cursor-pointer hover:bg-gray-100 dark:hover:bg-black/40 hover:scale-[1.02] active:scale-[0.98] hover:border-paymint-green/30">
                    {t('settings.profile.changeLogo')}
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                  {previewImage && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-5 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 font-bold text-sm shadow-sm transition-all hover:bg-red-100 dark:hover:bg-red-500/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {t('settings.profile.deleteLogo')}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 tracking-widest uppercase block">{t('settings.profile.name')}</label>
              <input type="text" {...register('restaurantName')} maxLength={255} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 tracking-widest uppercase block">{t('settings.profile.about')}</label>
              <textarea {...register('restaurantDescription')} rows={3} maxLength={2000} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-medium resize-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 tracking-widest uppercase block">{t('settings.profile.address')}</label>
                <input type="text" {...register('restaurantAddress')} maxLength={255} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 tracking-widest uppercase block">{t('settings.profile.email')}</label>
                <input type="email" {...register('email')} maxLength={255} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 tracking-widest uppercase block">{t('settings.profile.taxId')}</label>
                <input type="text" {...register('taxIdNumber')} maxLength={255} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-medium" />
              </div>
            </div>
          </motion.div>
          );
        })()}

        {activeTab === 'sales' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] p-8 space-y-8 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.sales.title')}</h3>
                  <p className="text-sm text-gray-500 font-medium">{t('settings.sales.subtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-200 dark:border-white/[0.05] flex flex-col justify-between shadow-lg backdrop-blur-sm transition-all hover:border-paymint-green/20 group/card">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-black text-paymint-green tracking-[0.2em] mb-1">{t('settings.sales.taxLabel')}</p>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.sales.taxRate')}</h4>
                    </div>
                    <button type="button" onClick={updateTaxRate} className="px-4 py-2 bg-paymint-green text-black text-xs font-bold tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-paymint-green/10">{t('settings.sales.update')}</button>
                  </div>
                  <div className={`relative group transition-all`}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={watch('taxRate') === 0 ? '' : watch('taxRate').toFixed(2)}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length > 19) return;
                        const numericValue = parseInt(val || '0', 10) / 100;
                        setValue('taxRate', numericValue, { shouldDirty: true });
                        if (errors.taxRate) clearErrors('taxRate');
                      }}
                      className={`w-full h-16 bg-white dark:bg-white/[0.03] border ${errors.taxRate ? 'border-red-500 bg-red-500/5' : 'border-gray-200 dark:border-white/[0.08]'} rounded-2xl px-6 font-semibold text-3xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${errors.taxRate ? 'focus:ring-red-500/20' : 'focus:ring-paymint-green/20'} transition-all pr-16 group-hover:border-paymint-green/50 shadow-sm`}
                    />
                    <div className={`absolute ${t('common.locale') === 'ar' ? 'left-6' : 'right-6'} top-1/2 -translate-y-1/2 font-semibold text-xl transition-colors ${errors.taxRate ? 'text-red-500' : 'text-gray-400 group-focus-within:text-paymint-green'}`}>%</div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-paymint-green tracking-widest px-1">{t('attributes.form.atmStyle', { defaultValue: 'Digits shift right to left (ATM style)' })}</p>
                  {errors.taxRate && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={18} className="text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-red-500 tracking-widest leading-none mb-1">{t('settings.sales.invalidInput')}</p>
                        <p className="text-xs font-medium text-red-500/80 tracking-tight">{errors.taxRate.message as string || t('settings.sales.taxErrorGeneric')}</p>
                      </div>
                    </motion.div>
                  )}
                  <p className="text-xs font-medium text-gray-400 mt-6 leading-relaxed tracking-tight flex items-start gap-2">
                    <span className="text-paymint-green">•</span>
                    {t('settings.sales.taxWarning')}
                  </p>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-200 dark:border-white/[0.05] flex flex-col justify-between shadow-lg backdrop-blur-sm transition-all group/card relative overflow-hidden">
                  <div className="mb-6">
                    <p className="text-xs font-black text-blue-500 tracking-[0.2em] mb-1">{t('settings.sales.currencyLabel')}</p>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t('settings.sales.currency')}</h4>
                  </div>
                  <div className="relative">
                    <input type="hidden" {...register('currency')} />
                    <CustomSelect
                      value={watch('currency')}
                      disabled={true}
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
                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-medium text-gray-400 leading-relaxed tracking-tight flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      {t('settings.sales.currencyDesc')}
                    </p>
                    <div className="flex items-start gap-2.5 p-3.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] rounded-xl transition-all hover:bg-gray-100/50 dark:hover:bg-white/[0.05]">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                        {t('settings.sales.currencyOwnerOnly')}
                        <a
                          href="/owner/account"
                          className="ml-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-bold hover:underline transition-all underline-offset-2"
                        >
                          {t('nav.owner')}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-200 dark:border-white/[0.05] flex flex-col justify-between shadow-lg backdrop-blur-sm transition-all hover:border-indigo-500/20 group/card">
                  <div className="mb-6">
                    <p className="text-xs font-black text-indigo-500 tracking-[0.2em] mb-1">{t('settings.sales.holdOrderTableCountLabel')}</p>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t('settings.sales.holdOrderTableCountTitle')}</h4>
                  </div>
                  <div className="relative group transition-all">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const target = e.target as HTMLInputElement;
                        if (target.value.length > 19) {
                          target.value = target.value.slice(0, 19);
                        }
                        const onlyDigits = target.value.replace(/[^\d]/g, '');                        target.value = onlyDigits;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      {...register('holdOrderTableCount', {
                        valueAsNumber: true,
                        min: { value: 0, message: t('settings.sales.holdOrderTableCountErrorRange') },
                        max: { value: 300, message: t('settings.sales.holdOrderTableCountErrorRange') },
                        setValueAs: (value) => {
                          const parsed = Number(value);
                          if (!Number.isFinite(parsed)) return 10;
                          return Math.min(300, Math.max(0, Math.floor(parsed)));
                        },
                      })}
                      className={`w-full h-14 bg-white dark:bg-white/[0.03] border ${errors.holdOrderTableCount ? 'border-red-500 bg-red-500/5' : 'border-gray-200 dark:border-white/[0.08]'} rounded-2xl px-5 font-semibold text-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${errors.holdOrderTableCount ? 'focus:ring-red-500/20' : 'focus:ring-indigo-500/20'} transition-all group-hover:border-indigo-500/50 shadow-sm`}
                      placeholder={t('settings.sales.holdOrderTableCountPlaceholder')}
                    />
                  </div>
                  {errors.holdOrderTableCount && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={18} className="text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-red-500 tracking-widest leading-none mb-1">{t('settings.sales.invalidInput')}</p>
                        <p className="text-xs font-medium text-red-500/80 tracking-tight">{errors.holdOrderTableCount.message as string || t('settings.sales.holdOrderTableCountErrorRange')}</p>
                      </div>
                    </motion.div>
                  )}
                  <p className="text-xs font-medium text-gray-400 mt-6 leading-relaxed tracking-tight flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    {t('settings.sales.holdOrderTableCountDesc')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'receipt' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] p-8 space-y-8">
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
                  <div className="p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-white/[0.03] shadow-sm space-y-4 transition-all">
                    <div className="space-y-4">
                      {/* Restaurant Name */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.showName')}</span>
                            <span className="block text-xs text-gray-400 mt-0.5">{t('settings.receipts.showNameDesc')}</span>
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
                          maxLength={255}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                          placeholder={t('settings.profile.namePlaceholder')}
                        />
                      </div>
                      {/* Description / Tagline */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.showTagline')}</span>
                            <span className="block text-xs text-gray-400 mt-0.5">{t('settings.receipts.showTaglineDesc')}</span>
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
                          maxLength={255}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                          placeholder={t('settings.profile.aboutPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Branding */}
                  <div className="p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-white/[0.03] shadow-sm space-y-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.showLogo')}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">{t('settings.receipts.showLogoDesc')}</span>
                        <p className="text-[10px] text-gray-400 font-bold mt-1.5">{t('settings.profile.logoGuidelines')}</p>
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
                        <label className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 cursor-pointer text-xs font-black tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg">
                          {t('settings.receipts.uploadLogo')}
                          <input type="file" accept="image/*" onChange={handleReceiptLogoChange} className="hidden" disabled={!watch('showLogoOnReceipt')} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-white/[0.03] shadow-sm space-y-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.showAddress')}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">{t('settings.receipts.showAddressDesc')}</span>
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
                      maxLength={255}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                      placeholder={t('settings.profile.addressPlaceholder')}
                    />
                  </div>

                  {/* Tax Info */}
                  <div className="p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-white/[0.03] shadow-sm space-y-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.showTaxId')}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">{t('settings.receipts.showTaxIdDesc')}</span>
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
                      maxLength={255}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                      placeholder={t('settings.profile.taxIdPlaceholder')}
                    />
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-white/[0.03] shadow-sm space-y-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 tracking-tight">{t('settings.receipts.footerMessage')}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">{t('settings.receipts.footerMessageDesc')}</span>
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
                      maxLength={2000}
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
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-none mb-1">{t('settings.danger.title')}</h3>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 font-medium tracking-widest">{t('settings.danger.subtitle')}</p>
                </div>
              </div>
            </div>

            {deletionStatus?.status === 'pending_deletion' ? (
              <div>
                <PendingDeletionBanner deletionStatus={deletionStatus} onCancelDeletion={handleCancelDeletion} isCancelling={isCancellingDeletion} />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-red-200/50 dark:border-red-900/20 shadow-sm">
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
                  className="w-full md:w-auto px-8 py-4 bg-red-600 text-white font-black tracking-widest text-xs rounded-xl hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
      <RestoreLocationModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onRestore={handleRestore}
        isRestoring={isCancellingDeletion}
      />
    </div>
  );
}



import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Save, CreditCard, Receipt, Trash2, AlertTriangle, Copy, Key, Shield, ShieldCheck, MonitorSmartphone, BookOpen, ArrowLeft } from 'lucide-react';
import api, { extractErrorMessage } from '../../config/api';
import { FiscalComplianceCard } from '../../components/FiscalComplianceCard';
import { AccountingSettingsTab } from '../../components/settings/AccountingSettingsTab';
import { SettingsOverviewHub } from '../../components/settings/SettingsOverviewHub';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ChangeCurrencyModal } from '../../components/ChangeCurrencyModal';
import { BusyOverlay } from '../../components/BusyOverlay';
import { EstablishmentDeletionWizard, PendingDeletionBanner } from '../../components/EstablishmentDeletionWizard';
import {
  RestoreLocationModal,
  type RestoreLocationFormData,
} from '../../components/RestoreLocationModal';
import { CustomSelect } from '../../components/CustomSelect';
import { useCurrency } from '../../context/CurrencyContext';
import { useTranslation } from 'react-i18next';
import { usePermissionGuard, checkPermission } from '../../hooks/usePermissionGuard';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../hooks/useRealtime';
import { DataChangeEventTypes } from '../../services/realtimeService';
import { SectionLoader } from '../../components/LoadingState';
import { TaxRatesManager } from '../../components/settings/TaxRatesManager';
import { CURRENCIES } from '../../data/globalLocaleOptions';
import { formatInputPlaceholder, formatInputLabel } from '../../utils/textCase';
import {
  buildLocationDeletionRecoveryPath,
  getDaysUntilDeletion,
  getEstablishmentSlug,
  isLocationDeletionRecoveryDeepLink,
  isManualEstablishmentDeletionPending,
} from '../../utils/deletionRecovery';
import {
  MAX_ESTABLISHMENT_NAME_LENGTH,
  MAX_ESTABLISHMENT_TAGLINE_LENGTH,
  MAX_ESTABLISHMENT_ADDRESS_LENGTH,
  MAX_ESTABLISHMENT_EMAIL_LENGTH,
  MAX_ESTABLISHMENT_TAX_ID_LENGTH,
  MAX_RECEIPT_FAREWELL_LENGTH,
  MAX_TAX_RATE_PERCENT,
  MAX_TAX_RATE_INPUT_DIGITS,
  MAX_HOLD_ORDER_TABLE_COUNT,
  MAX_HOLD_ORDER_TABLE_DIGITS,
  MAX_SERVICE_CHARGE_NAME_LENGTH,
  MAX_SERVICE_CHARGE_VALUE,
  MAX_SERVICE_CHARGE_PERCENT,
  formatServiceChargePercentATM,
  formatServiceChargeFixedATM,
  normalizeServiceChargeValue,
  buildAppSettingsUpdatePayload,
  clampTaxRatePercent,
  getChangedAppSettingsKeys,
  normalizeBackendTaxRateForForm,
  normalizeHoldOrderTableCount,
  sanitizeTaxId,
  sanitizeLimitedText,
} from '../../utils/settingsPayload';

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
  serviceChargeEnabled?: boolean;
  serviceChargeName?: string;
  serviceChargeType?: 'PERCENTAGE' | 'FIXED';
  serviceChargeValue?: number;
  serviceChargeTaxable?: boolean;
  serviceChargeAutoApply?: boolean;
  serviceChargeAllowCashierOverride?: boolean;
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
  allowMultipleShifts?: boolean;
  // E-Invoicing & Tax Compliance (universal fiscal compliance)
  fiscalEnabled?: boolean;
  fiscalCountryCode?: string | null;
  fiscalCredentials?: string | null;
  fiscalAutoSubmit?: boolean;
  fiscalBlockOnFailure?: boolean;
  fiscalTaxPresets?: string | null;
}





type SettingsTab =
  | 'overview'
  | 'profile'
  | 'sales'
  | 'pos'
  | 'receipt'
  | 'einvoicing'
  | 'accounting'
  | 'loyalty'
  | 'danger';

/** Normalizes route param, query param, or deep-link tab name. */
const normalizeSettingsTab = (tab: string | null | undefined): SettingsTab | null => {
  if (!tab) return null;
  const lower = tab.toLowerCase();
  if (lower === 'overview') return 'overview';
  if (lower === 'tax' || lower === 'fiscal' || lower === 'einvoicing') return 'einvoicing';
  if (lower === 'receipt' || lower === 'receipts') return 'receipt';
  if (lower === 'danger' || lower === 'danger-zone') return 'danger';
  if (
    lower === 'profile' ||
    lower === 'sales' ||
    lower === 'pos' ||
    lower === 'accounting' ||
    lower === 'loyalty'
  ) {
    return lower as SettingsTab;
  }
  return null;
};

interface DeletionStatus {
  id: string;
  name: string;
  status: 'active' | 'pending_deletion' | 'deleting' | 'deleted';
  reason?: string | null;
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
  const navigate = useNavigate();
  const { locationSlug, section } = useParams<{ locationSlug?: string; section?: string }>();
  const {
    account,
    currentEstablishment,
    establishments,
    setCurrentEstablishment,
    refreshEstablishments,
    isLoading: isAuthLoading,
  } = useAuth();
  const manualDeletionPending = isManualEstablishmentDeletionPending(currentEstablishment);
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
  const { refreshCurrency, currencySymbol } = useCurrency();
  const { onRefresh } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
    enabled: Boolean(currentEstablishment?.id && !manualDeletionPending),
  });

  const tabs = useMemo(() => {
    const availableTabs = [
      { id: 'profile', label: t('settings.tabs.profile'), icon: Store, permission: 'manage_establishment_profile' },
      { id: 'sales', label: t('settings.tabs.sales'), icon: CreditCard, permission: 'manage_tax_currency' },
      // POS & Shifts is floor-operations, not tax/currency — gate it on the
      // register/terminal permission rather than manage_tax_currency.
      { id: 'pos', label: t('settings.tabs.pos', { defaultValue: 'POS & Shifts' }), icon: MonitorSmartphone, permission: 'manage_pos_devices' },
      { id: 'receipt', label: t('settings.tabs.receipts'), icon: Receipt, permission: 'manage_receipt_settings' },
      { id: 'einvoicing', label: t('settings.tabs.tax', 'E-Invoicing'), icon: ShieldCheck, permission: 'manage_settings' },
      { id: 'accounting', label: t('settings.tabs.accounting', { defaultValue: 'Accounting & VAT' }), icon: BookOpen, permission: 'manage_settings' },
      { id: 'danger', label: t('settings.tabs.danger'), icon: Trash2, isDanger: true, permission: 'delete_establishment' },
    ];

    // If owner or has specific permissions, show the tabs
    const permittedTabs = availableTabs.filter(tab => checkPermission(account, [tab.permission]));
    return manualDeletionPending
      ? permittedTabs.filter((tab) => tab.id === 'danger')
      : permittedTabs;
  }, [account, manualDeletionPending, t]);

  const routeTab = normalizeSettingsTab(section);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryTab = normalizeSettingsTab(searchParams.get('tab') || searchParams.get('section'));
  const isOAuthCallback = searchParams.has('code') || searchParams.has('realmId');
  const deepLinkTab = isLocationDeletionRecoveryDeepLink(location.search)
    ? 'danger'
    : normalizeSettingsTab((location.state as any)?.openSettingsTab) ||
      queryTab ||
      (isOAuthCallback ? 'accounting' : null);

  const activeTab: SettingsTab = manualDeletionPending
    ? 'danger'
    : routeTab || deepLinkTab || 'overview';

  const navigateToSection = (target: SettingsTab) => {
    const slug =
      locationSlug ||
      (currentEstablishment ? getEstablishmentSlug(currentEstablishment) : '');
    if (!slug) return;

    if (target === 'overview') {
      navigate(`/dashboard/${encodeURIComponent(slug)}/settings`);
    } else if (target === 'receipt') {
      navigate(`/dashboard/${encodeURIComponent(slug)}/settings/receipts`);
    } else if (target === 'einvoicing') {
      navigate(`/dashboard/${encodeURIComponent(slug)}/settings/fiscal`);
    } else {
      navigate(`/dashboard/${encodeURIComponent(slug)}/settings/${target}`);
    }
  };

  // If a deep-link was passed via query param or state while sitting at root /settings, redirect smoothly
  useEffect(() => {
    if (!currentEstablishment || routeTab || manualDeletionPending) return;
    if (deepLinkTab && deepLinkTab !== 'overview') {
      const slug = locationSlug || getEstablishmentSlug(currentEstablishment);
      const targetSubPath =
        deepLinkTab === 'receipt'
          ? 'receipts'
          : deepLinkTab === 'einvoicing'
          ? 'fiscal'
          : deepLinkTab;
      navigate(`/dashboard/${encodeURIComponent(slug)}/settings/${targetSubPath}`, {
        replace: true,
      });
    }
  }, [currentEstablishment, deepLinkTab, routeTab, manualDeletionPending, locationSlug, navigate]);

  // If navigated to an unpermitted sub-section, send back to overview
  useEffect(() => {
    if (activeTab === 'overview' || manualDeletionPending) return;
    if (tabs.length > 0 && !tabs.find((t: any) => t.id === activeTab)) {
      navigateToSection('overview');
    }
  }, [tabs, activeTab, manualDeletionPending]);

  // Clean state after reading openSettingsTab
  useEffect(() => {
    if ((location.state as any)?.openSettingsTab) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(!manualDeletionPending);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [receiptLogoPreview, setReceiptLogoPreview] = useState<string | null>(null);
  const [selectedReceiptLogo, setSelectedReceiptLogo] = useState<File | null>(null);
  const [initialSettings, setInitialSettings] = useState<AppSettings | null>(null);
  const [pendingCurrencyData, setPendingCurrencyData] = useState<AppSettings | null>(null);

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

  const serviceChargeSectionRef = useRef<HTMLDivElement | null>(null);
  const serviceChargePanelRef = useRef<HTMLDivElement | null>(null);
  const serviceChargeEnabled = !!watch('serviceChargeEnabled');
  const serviceChargeType = (watch('serviceChargeType') || 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED';
  const serviceChargeValue = Number(watch('serviceChargeValue') || 0);

  const restaurantNameField = register('restaurantName', {
    maxLength: { value: MAX_ESTABLISHMENT_NAME_LENGTH, message: t('common.maxLength', { count: MAX_ESTABLISHMENT_NAME_LENGTH }) },
    setValueAs: (value) => sanitizeLimitedText(value, MAX_ESTABLISHMENT_NAME_LENGTH),
  });
  const restaurantDescriptionField = register('restaurantDescription', {
    maxLength: { value: MAX_ESTABLISHMENT_TAGLINE_LENGTH, message: t('common.maxLength', { count: MAX_ESTABLISHMENT_TAGLINE_LENGTH }) },
    setValueAs: (value) => sanitizeLimitedText(value, MAX_ESTABLISHMENT_TAGLINE_LENGTH),
  });
  const restaurantAddressField = register('restaurantAddress', {
    maxLength: { value: MAX_ESTABLISHMENT_ADDRESS_LENGTH, message: t('common.maxLength', { count: MAX_ESTABLISHMENT_ADDRESS_LENGTH }) },
    setValueAs: (value) => sanitizeLimitedText(value, MAX_ESTABLISHMENT_ADDRESS_LENGTH),
  });
  const emailField = register('email', {
    maxLength: { value: MAX_ESTABLISHMENT_EMAIL_LENGTH, message: t('common.maxLength', { count: MAX_ESTABLISHMENT_EMAIL_LENGTH }) },
    setValueAs: (value) => sanitizeLimitedText(value, MAX_ESTABLISHMENT_EMAIL_LENGTH),
  });
  const taxIdField = register('taxIdNumber', {
    maxLength: { value: MAX_ESTABLISHMENT_TAX_ID_LENGTH, message: t('common.maxLength', { count: MAX_ESTABLISHMENT_TAX_ID_LENGTH }) },
    setValueAs: (value) => sanitizeTaxId(value, MAX_ESTABLISHMENT_TAX_ID_LENGTH),
  });
  const farewellMessageField = register('farewellMessage', {
    maxLength: { value: MAX_RECEIPT_FAREWELL_LENGTH, message: t('common.maxLength', { count: MAX_RECEIPT_FAREWELL_LENGTH }) },
    setValueAs: (value) => sanitizeLimitedText(value, MAX_RECEIPT_FAREWELL_LENGTH),
  });
  const taxRateField = register('taxRate', {
    setValueAs: (value) => clampTaxRatePercent(value),
    validate: (value) =>
      (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= MAX_TAX_RATE_PERCENT) ||
      t('settings.sales.invalidTaxMessage'),
  });

  // Watch all form values for dirty state comparison
  const watchedValues = watch();

  // Watch receipt display options
  const showRestaurantName = watch('showRestaurantName');
  const showDescription = watch('showDescription');

  const showAddress = watch('showAddress');
  const showTaxId = watch('showTaxId');
  const showFarewellMessage = watch('showFarewellMessage');





  const changedSettingKeys = useMemo(
    () => (initialSettings ? getChangedAppSettingsKeys(watchedValues, initialSettings) : new Set<string>()),
    [watchedValues, initialSettings],
  );

  // Stable initial snapshot for the self-contained E-Invoicing card. Only changes
  // when a fiscal field actually changes (e.g. after the card saves and we refetch),
  // so the card doesn't reset the owner's in-progress edits on every render.
  const fiscalInitial = useMemo(
    () => ({
      fiscalEnabled: settings?.fiscalEnabled,
      fiscalCountryCode: settings?.fiscalCountryCode,
      fiscalCredentials: settings?.fiscalCredentials,
      fiscalAutoSubmit: settings?.fiscalAutoSubmit,
      fiscalBlockOnFailure: settings?.fiscalBlockOnFailure,
      fiscalTaxPresets: settings?.fiscalTaxPresets,
    }),
    [
      settings?.fiscalEnabled,
      settings?.fiscalCountryCode,
      settings?.fiscalCredentials,
      settings?.fiscalAutoSubmit,
      settings?.fiscalBlockOnFailure,
      settings?.fiscalTaxPresets,
    ],
  );

  const hasFormChanges = changedSettingKeys.size > 0;

  // Combined dirty state
  const hasUnsavedChanges = hasFormChanges || !!selectedLogo || !!selectedReceiptLogo || removeLogo;
  const hasValidatedCurrentEstablishment = !!currentEstablishment?.id &&
    establishments.some((est) => est.id === currentEstablishment.id);

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
    if (manualDeletionPending) {
      // Billing deliberately blocks normal settings for an inactive location.
      // The deletion-status endpoint is independent, so never let a failed
      // /app-settings request hide the one screen that can restore the data.
      setIsLoading(false);
      return;
    }

    if (!isAuthLoading && hasValidatedCurrentEstablishment) {
      fetchSettings();
    }
  }, [isAuthLoading, hasValidatedCurrentEstablishment, currentEstablishment?.id, manualDeletionPending]);

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
    if (manualDeletionPending) {
      if (showLoading) setIsLoading(false);
      return;
    }

    try {
      if (showLoading) setIsLoading(true);
      const response = await api.get('/app-settings');
      const data = response.data;

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
        restaurantName: sanitizeLimitedText(data.restaurantName, MAX_ESTABLISHMENT_NAME_LENGTH),
        restaurantDescription: sanitizeLimitedText(data.restaurantDescription, MAX_ESTABLISHMENT_TAGLINE_LENGTH),
        restaurantAddress: sanitizeLimitedText(data.restaurantAddress, MAX_ESTABLISHMENT_ADDRESS_LENGTH),
        email: sanitizeLimitedText(data.email, MAX_ESTABLISHMENT_EMAIL_LENGTH),
        taxIdNumber: sanitizeTaxId(data.taxIdNumber, MAX_ESTABLISHMENT_TAX_ID_LENGTH),
        farewellMessage: sanitizeLimitedText(data.farewellMessage, MAX_RECEIPT_FAREWELL_LENGTH),
        taxRate: normalizeBackendTaxRateForForm(data.taxRate),
        serviceChargeEnabled: Boolean(data.serviceChargeEnabled),
        serviceChargeName: data.serviceChargeName || 'Service Charge',
        serviceChargeType: data.serviceChargeType || 'PERCENTAGE',
        serviceChargeValue: Number(data.serviceChargeValue || 0),
        serviceChargeTaxable: Boolean(data.serviceChargeTaxable),
        serviceChargeAutoApply: data.serviceChargeAutoApply !== false,
        serviceChargeAllowCashierOverride: Boolean(data.serviceChargeAllowCashierOverride),
        showTaxId: Boolean(data.showTaxId),
        holdOrderTableCount: normalizeHoldOrderTableCount(data.holdOrderTableCount),
        allowMultipleShifts: data.allowMultipleShifts !== false,
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
      if (!manualDeletionPending && eventType === DataChangeEventTypes.SETTINGS_UPDATED) {
        fetchSettings(false);
      }
    });

    return unsubscribe;
  }, [manualDeletionPending, onRefresh]);

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
      setPendingCurrencyData(data);
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

      const changedKeys = initialSettings
        ? getChangedAppSettingsKeys(data, initialSettings)
        : new Set<string>();
      if (selectedLogo || removeLogo) changedKeys.add('logo');
      if (selectedReceiptLogo) changedKeys.add('receiptLogo');

      const submissionData = buildAppSettingsUpdatePayload(data, changedKeys);

      await api.put('/app-settings', submissionData);

      const nextRestaurantName = String(submissionData.restaurantName || '').trim();
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
        confirmText: t('common.confirm'),
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
      toast.error(extractErrorMessage(err) || t('settings.messages.saveFailed'));
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

  // Deletion state
  const [showDeletionWizard, setShowDeletionWizard] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [establishmentInfo, setEstablishmentInfo] = useState<EstablishmentInfo | null>(null);
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fallbackDeletionStatus: DeletionStatus | null = manualDeletionPending && currentEstablishment
    ? {
        id: currentEstablishment.id,
        name: currentEstablishment.name,
        status: 'pending_deletion',
        reason: currentEstablishment.accessLockReason || 'PENDING_DELETION',
        deletionRequestedAt: currentEstablishment.deletionRequestedAt || null,
        deletionScheduledFor: currentEstablishment.deletionScheduledFor || null,
        deletionExportSentTo: currentEstablishment.deletionExportSentTo || null,
        canCancel: true,
        daysRemaining: getDaysUntilDeletion(currentEstablishment.deletionScheduledFor),
      }
    : null;
  const effectiveDeletionStatus = deletionStatus || fallbackDeletionStatus;

  useEffect(() => {
    if (!isAuthLoading && hasValidatedCurrentEstablishment) {
      fetchEstablishmentInfo();
    }
  }, [isAuthLoading, hasValidatedCurrentEstablishment, currentEstablishment?.id]);

  const fetchEstablishmentInfo = async () => {
    try {
      if (!currentEstablishment?.id) return;
      setEstablishmentInfo({
        id: currentEstablishment.id,
        name: currentEstablishment.name,
      });
      const response = await api.get(
        `/api/establishments/${currentEstablishment.id}/deletion-status`,
      );
      const status = response.data?.data || response.data;
      setDeletionStatus({
        ...status,
        // Never reconstruct the deadline from the request date or a fixed
        // grace period. The server's scheduled timestamp is authoritative.
        daysRemaining: getDaysUntilDeletion(status.deletionScheduledFor),
      });
    } catch (err) {
      console.error('Failed to fetch establishment info:', err);
    }
  };

  const handleCancelDeletion = () => {
    setRestoreError(null);
    setShowRestoreModal(true);
  };

  const handleRestore = async (data: RestoreLocationFormData) => {
    if (!establishmentInfo) return;
    let restoreSucceeded = false;
    try {
      setIsCancellingDeletion(true);
      setRestoreError(null);
      await api.post(
        `/api/establishments/${establishmentInfo.id}/cancel-deletion`,
        data,
        { headers: { 'X-Skip-Auth-Redirect': 'true' } },
      );
      restoreSucceeded = true;
      
      // Refresh context to update establishment data (new loginId)
      const updatedEstablishments = await refreshEstablishments();
      
      // If the current establishment was updated, we might need to update session storage
      if (updatedEstablishments && updatedEstablishments.length > 0) {
          const updated = updatedEstablishments.find((establishment) => establishment.id === establishmentInfo.id);
          if (updated) {
              setCurrentEstablishment(updated);
              setShowRestoreModal(false);
              toast.success(t('security.restore.success'));
              navigate(`/dashboard/${encodeURIComponent(getEstablishmentSlug(updated))}`, {
                replace: true,
              });
              return;
          }
      }

      setShowRestoreModal(false);
      toast.success(t('security.restore.success'));
      navigate('/select-establishment', { replace: true });
    } catch (err) {
      const message = extractErrorMessage(err) ||
        (err instanceof Error ? err.message : '') ||
        t('settings.danger.cancelFailed');
      if (restoreSucceeded) {
        setShowRestoreModal(false);
        toast.success(t('security.restore.success'));
        toast.error(
          t('settings.danger.refreshFailed', {
            defaultValue: 'The location was restored, but its updated login could not be loaded. Please refresh the page.',
          }),
        );
        navigate('/select-establishment', { replace: true });
      } else {
        setRestoreError(message);
      }
    } finally {
      setIsCancellingDeletion(false);
    }
  };

  const handleDeletionRequested = async () => {
    setShowDeletionWizard(false);
    const updatedEstablishments = await refreshEstablishments();
    const updated = updatedEstablishments.find(
      (establishment) => establishment.id === currentEstablishment?.id,
    );

    if (updated) {
      setCurrentEstablishment(updated);
      navigate(buildLocationDeletionRecoveryPath(getEstablishmentSlug(updated)), {
        replace: true,
      });
    }

    await fetchEstablishmentInfo();
  };

  const showFormValidationError = (errs: any) => {
    const message =
      errs.taxRate?.message ||
      errs.holdOrderTableCount?.message ||
      errs.serviceChargeName?.message ||
      errs.serviceChargeValue?.message;

    if (!message) {
      toast.error(t('settings.messages.formErrors'));
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: t('settings.confirm.entryErrorTitle', t('common.error')),
      message,
      type: 'danger',
      confirmText: t('common.gotIt'),
      showCancel: false,
      onConfirm: () => { },
      onClose: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
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

          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          navigateToSection(newTab);
        },
        showCancel: true,
        confirmText: t('common.continue'),
        cancelText: t('common.cancel'),
        onClose: () => setConfirmConfig((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    navigateToSection(newTab);
  };

  if (isLoading && !manualDeletionPending) {
    return <SectionLoader message={t('settings.messages.loading')} />;
  }

  const currentTabMeta = tabs.find((tab: any) => tab.id === activeTab);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Full-screen blocker while settings load or save, so no second action
          can be stacked on an in-flight request. */}
      <BusyOverlay visible={isLoading || isSaving} />

      {activeTab === 'overview' ? (
        <SettingsOverviewHub
          settings={settings}
          currentEstablishment={currentEstablishment}
          permittedTabIds={tabs.map((t: any) => t.id)}
          onNavigateToSection={(target) => handleTabChange(target as SettingsTab)}
          currencySymbol={currencySymbol}
        />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Breadcrumb & Sub-screen Header */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => handleTabChange('overview')}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-mintcom-green transition-colors group"
            >
              <ArrowLeft
                size={16}
                className={`transition-transform ${
                  t('common.locale') === 'ar' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'
                }`}
              />
              <span>{t('settings.overview.backToSettings', 'Back to Settings')}</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3.5">
                {currentTabMeta?.icon && (
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      currentTabMeta.isDanger
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-mintcom-green/15 text-mintcom-green'
                    }`}
                  >
                    <currentTabMeta.icon size={24} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                      {currentTabMeta?.label || t('settings.title')}
                    </h1>
                    {currentEstablishment?.name && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 text-mintcom-green font-semibold text-xs border border-mintcom-green/20">
                        {currentEstablishment.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {activeTab === 'profile' && t('settings.profile.detailsDesc', 'Manage your location identity')}
                    {activeTab === 'sales' && t('settings.sales.subtitle', 'Configure Taxes, Currency, and Table Structure')}
                    {activeTab === 'pos' && t('settings.tabs.pos', 'POS Terminal & Shift Operations')}
                    {activeTab === 'receipt' && t('settings.receipts.subtitle', 'Edit Receipt Look & Customer Notes')}
                    {activeTab === 'einvoicing' && t('settings.fiscal.subtitle', 'Universal electronic invoicing & tax compliance')}
                    {activeTab === 'accounting' && t('settings.accounting.subtitle', 'Z-Report sync with Xero and QuickBooks')}
                    {activeTab === 'danger' && t('settings.danger.subtitle', 'Permanent Location Deletion')}
                  </p>
                </div>
              </div>

              {activeTab !== 'einvoicing' && activeTab !== 'danger' && activeTab !== 'accounting' && (
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit, showFormValidationError)}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-mintcom-green text-black font-bold text-sm hover:bg-[#5fa888] transition-all shadow-sm disabled:opacity-50 disabled:shadow-none shrink-0"
                >
                  {isSaving ? (
                    <div className="w-[18px] h-[18px] border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  <span>{t('settings.saveChanges')}</span>
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit, showFormValidationError)} className="space-y-8">
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

          // Override for demo purposes
          if (estLoginId === 'demo-mall' || !estLoginId) {
            estLoginId = 'demo-downtown';
          }
          
          return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] p-8 space-y-10 rounded-2xl shadow-sm">
            {/* Location Login ID Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-blue-50/70 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-blue-700 dark:text-blue-300 tracking-wide flex items-center gap-1.5">
                    <Key size={13} className="text-blue-600 dark:text-blue-400" />
                    {t('settings.profile.locationLoginId', 'Location Login ID')}
                  </label>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    <Shield size={10} />
                    {t('owner.account.locationLoginBadge', 'Location')}
                  </span>
                </div>
                <code className="block text-sm sm:text-base font-mono font-bold text-gray-900 dark:text-white truncate select-all">
                  {estLoginId}
                </code>
                <p className="text-xs text-blue-700/80 dark:text-blue-200/80 font-medium leading-relaxed">
                  {t('settings.profile.locationLoginHint', 'Use this ID to sign in to this location dashboard.')} •{' '}
                  <span className="text-gray-500 dark:text-gray-400">
                    {t('settings.profile.passwordResetNote', 'Password reset can only be done from the owner portal')}
                  </span>
                </p>
              </div>
              <div className="sm:pl-4 sm:border-l border-gray-200 dark:border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (estLoginId) {
                      navigator.clipboard.writeText(estLoginId);
                      toast.success(t('common.copied', 'Copied to clipboard'));
                    }
                  }}
                  disabled={!estLoginId}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-white/10 text-blue-600 dark:text-blue-300 border border-blue-200/80 dark:border-blue-400/20 hover:bg-blue-50 dark:hover:bg-white/15 transition-all shadow-xs"
                >
                  <Copy size={13} />
                  <span>{t('common.copy', 'Copy')}</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-normal text-gray-900 dark:text-white tracking-normal ">{formatInputLabel(t('settings.profile.logo'), t('common.locale'))}</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('settings.profile.logoGuidelines')}</p>
              </div>
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/5">
                  {previewImage ? <img src={previewImage} alt="Logo" className="w-full h-full object-cover" loading="lazy" decoding="async" /> : <Store className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="px-5 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.03] rounded-xl text-gray-900 dark:text-white font-normal text-sm shadow-sm transition-all cursor-pointer hover:bg-gray-100 dark:hover:bg-black/40 hover:scale-[1.02] active:scale-[0.98] hover:border-mintcom-green/30">
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
              <label className="label-strong font-sans  block">{formatInputLabel(t('settings.profile.name'), t('common.locale'))}</label>
              <input type="text" {...restaurantNameField} maxLength={MAX_ESTABLISHMENT_NAME_LENGTH} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all font-normal" />
            </div>
            <div className="space-y-2">
              <label className="label-strong font-sans  block">{formatInputLabel(t('settings.profile.about'), t('common.locale'))}</label>
              <textarea {...restaurantDescriptionField} rows={3} maxLength={MAX_ESTABLISHMENT_TAGLINE_LENGTH} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all font-normal resize-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="label-strong font-sans  block">{formatInputLabel(t('settings.profile.address'), t('common.locale'))}</label>
                <input type="text" {...restaurantAddressField} maxLength={MAX_ESTABLISHMENT_ADDRESS_LENGTH} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all font-normal" />
              </div>
              <div className="space-y-2">
                <label className="label-strong font-sans  block">{formatInputLabel(t('settings.profile.email'), t('common.locale'))}</label>
                <input type="email" {...emailField} maxLength={MAX_ESTABLISHMENT_EMAIL_LENGTH} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all font-normal" />
              </div>
              <div className="space-y-2">
                <label className="label-strong font-sans  block">{formatInputLabel(t('settings.profile.taxId'), t('common.locale'))}</label>
                <input type="text" {...taxIdField} autoCapitalize="characters" maxLength={MAX_ESTABLISHMENT_TAX_ID_LENGTH} onInput={(e) => { const target = e.target as HTMLInputElement; target.value = sanitizeTaxId(target.value, MAX_ESTABLISHMENT_TAX_ID_LENGTH); }} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all font-normal" />
                <p className="text-xs text-gray-400 mt-1">{t('settings.profile.taxIdDisclaimer')}</p>
              </div>
            </div>
          </motion.div>
          );
        })()}

        {activeTab === 'sales' && (() => {
          const isRTL = t('common.locale') === 'ar';
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] p-6 sm:p-8 space-y-8 rounded-2xl shadow-sm font-sans">
              {/* Tax rates — single source of truth: the default row in the table below is applied to new products */}
              <div>
                <input type="hidden" {...taxRateField} />
                <TaxRatesManager />
              </div>

                {/* Currency */}
                <div className="flex flex-col min-w-0">
                  <label className="label-strong font-sans block h-5 leading-5 mb-2 truncate">
                    {formatInputLabel(t('settings.sales.currency'), t('common.locale'))}
                  </label>
                  <div className="h-11 shrink-0">
                    <input type="hidden" {...register('currency')} />
                    <CustomSelect
                      size="compact"
                      className="w-full h-11"
                      value={watch('currency')}
                      disabled={true}
                      onChange={(val) => { setValue('currency', String(val), { shouldDirty: true }); }}
                      options={CURRENCIES.map((currencyOption) => ({
                        label: currencyOption.label,
                        value: currencyOption.code,
                      }))}
                    />
                  </div>
                  <div className="mt-2 min-h-[2.75rem]">
                    <p className="text-[11px] font-medium text-gray-400 leading-snug">
                      {t('settings.sales.currencyOwnerOnly')}{' '}
                      <a
                        href="/owner/account"
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-bold hover:underline underline-offset-2"
                      >
                        {t('nav.owner')}
                      </a>
                    </p>
                  </div>
                </div>

              {/* Service Charge — separate card; fields always visible, disabled when off */}
              <div
                ref={serviceChargeSectionRef}
                className="mt-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02] p-5 sm:p-6 scroll-mt-24 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200/80 dark:border-white/10">
                  <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">
                      {t('settings.sales.serviceChargeTitle', { defaultValue: 'Service Charge' })}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                      {t('settings.sales.serviceChargeEnabled', { defaultValue: 'Enable a service charge on orders' })}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" {...register('serviceChargeEnabled')} className="sr-only peer" />
                    <div className="h-7 w-12 rounded-full bg-slate-300/90 ring-1 ring-inset ring-slate-400/40 shadow-inner transition-all duration-200 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-mintcom-green/50 peer-focus-visible:ring-offset-2 dark:bg-white/15 dark:ring-white/20 peer-checked:bg-mintcom-green peer-checked:ring-mintcom-green/40 peer-checked:shadow-[0_0_0_3px_rgba(125,198,162,0.22)] after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.18)] after:transition-all after:content-[''] peer-checked:after:translate-x-5" />
                  </label>
                </div>

                <div
                  ref={serviceChargePanelRef}
                  className={`pt-5 space-y-5 transition-opacity duration-200 ${
                    serviceChargeEnabled
                      ? 'opacity-100'
                      : 'opacity-50 pointer-events-none select-none'
                  }`}
                  aria-disabled={!serviceChargeEnabled}
                >
                  {/* Row: Name · Type · Value — equal width + matching h-11 controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="space-y-2 min-w-0">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block">
                        {t('settings.sales.serviceChargeName', { defaultValue: 'Charge name' })}
                      </label>
                      <input
                        type="text"
                        disabled={!serviceChargeEnabled}
                        maxLength={MAX_SERVICE_CHARGE_NAME_LENGTH}
                        {...register('serviceChargeName', {
                          maxLength: {
                            value: MAX_SERVICE_CHARGE_NAME_LENGTH,
                            message: t('common.maxLength', { count: MAX_SERVICE_CHARGE_NAME_LENGTH }),
                          },
                          setValueAs: (value) => sanitizeLimitedText(value, MAX_SERVICE_CHARGE_NAME_LENGTH),
                        })}
                        placeholder={formatInputPlaceholder(t('settings.sales.serviceChargeName', { defaultValue: 'e.g. Service Charge' }), t('common.locale'))}
                        className={`w-full h-11 px-3 box-border bg-white dark:bg-white/5 border ${errors.serviceChargeName ? 'border-red-500 bg-red-500/5 focus:ring-red-500/20' : 'border-gray-200 dark:border-white/10 focus:ring-mintcom-green/20 focus:border-mintcom-green'} rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/[0.03] disabled:text-gray-400`}
                      />
                      {errors.serviceChargeName && serviceChargeEnabled && (
                        <p className="text-[11px] font-medium text-red-500 leading-relaxed flex items-start gap-1.5">
                          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                          {errors.serviceChargeName.message as string}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 min-w-0">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block">
                        {t('settings.sales.serviceChargeType', { defaultValue: 'Charge type' })}
                      </label>
                      <CustomSelect
                        size="compact"
                        className="w-full"
                        value={watch('serviceChargeType') || 'PERCENTAGE'}
                        onChange={(val) => {
                          if (!serviceChargeEnabled) return;
                          const nextType = String(val) as 'PERCENTAGE' | 'FIXED';
                          setValue('serviceChargeType', nextType, { shouldDirty: true });
                          // Re-clamp current value to the new type's max (e.g. 100% when switching to percentage).
                          setValue(
                            'serviceChargeValue',
                            normalizeServiceChargeValue(serviceChargeValue, nextType),
                            { shouldDirty: true, shouldValidate: true },
                          );
                        }}
                        disabled={!serviceChargeEnabled}
                        options={[
                          { label: t('settings.sales.percentage', { defaultValue: 'Percentage (%)' }), value: 'PERCENTAGE' },
                          { label: t('settings.sales.fixedAmount', { defaultValue: 'Fixed Amount' }), value: 'FIXED' },
                        ]}
                        placeholder={formatInputPlaceholder(t('settings.sales.serviceChargeType', { defaultValue: 'Type' }), t('common.locale'))}
                      />
                    </div>

                    <div className="space-y-2 min-w-0">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block">
                        {t('settings.sales.serviceChargeValue', { defaultValue: 'Charge value' })}
                      </label>
                      <div className="relative group">
                        <input type="hidden" {...register('serviceChargeValue', {
                          setValueAs: (value) =>
                            normalizeServiceChargeValue(value, serviceChargeType),
                          validate: (value) => {
                            if (!serviceChargeEnabled) return true;
                            const max =
                              serviceChargeType === 'PERCENTAGE'
                                ? MAX_SERVICE_CHARGE_PERCENT
                                : MAX_SERVICE_CHARGE_VALUE;
                            const n = Number(value);
                            if (!Number.isFinite(n) || n < 0 || n > max) {
                              return t('settings.sales.serviceChargeValueErrorRange', {
                                max,
                                defaultValue:
                                  serviceChargeType === 'PERCENTAGE'
                                    ? `Charge value must be between 0 and ${max}%.`
                                    : `Charge value must be between 0 and ${max}.`,
                              });
                            }
                            return true;
                          },
                        })} />
                        <input
                          type="text"
                          inputMode="decimal"
                          disabled={!serviceChargeEnabled}
                          value={
                            !serviceChargeValue
                              ? ''
                              : serviceChargeValue.toFixed(2)
                          }
                          onChange={(e) => {
                            if (!serviceChargeEnabled) return;
                            const next =
                              serviceChargeType === 'PERCENTAGE'
                                ? formatServiceChargePercentATM(e.target.value)
                                : formatServiceChargeFixedATM(e.target.value);
                            if (next === null) return;
                            setValue(
                              'serviceChargeValue',
                              normalizeServiceChargeValue(next, serviceChargeType),
                              { shouldDirty: true, shouldValidate: true },
                            );
                            if (errors.serviceChargeValue) clearErrors('serviceChargeValue');
                          }}
                          placeholder={formatInputPlaceholder(
                            serviceChargeType === 'PERCENTAGE'
                              ? t('common.zeroDecimal', { defaultValue: '0.00' })
                              : t('common.zeroDecimal', { defaultValue: '0.00' }),
                            t('common.locale'),
                          )}
                          className={`w-full h-11 px-3 box-border bg-white dark:bg-white/5 border ${
                            errors.serviceChargeValue
                              ? 'border-red-500 bg-red-500/5 focus:ring-red-500/20'
                              : 'border-gray-200 dark:border-white/10 focus:ring-mintcom-green/20 focus:border-mintcom-green'
                          } rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/[0.03] disabled:text-gray-400 ${
                            isRTL ? 'pl-12' : 'pr-12'
                          }`}
                        />
                        <div
                          className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-black pointer-events-none ${
                            serviceChargeEnabled
                              ? 'bg-mintcom-green/10 border border-mintcom-green/20 text-mintcom-green'
                              : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400'
                          }`}
                        >
                          {serviceChargeType === 'PERCENTAGE'
                            ? t('common.percent', { defaultValue: '%' })
                            : currencySymbol || ''}
                        </div>
                      </div>
                      {errors.serviceChargeValue && serviceChargeEnabled ? (
                        <p className="text-[11px] font-medium text-red-500 leading-relaxed flex items-start gap-1.5">
                          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                          {errors.serviceChargeValue.message as string}
                        </p>
                      ) : serviceChargeEnabled ? (
                        <p className="text-[10px] font-bold text-mintcom-green tracking-widest">
                          {serviceChargeType === 'PERCENTAGE'
                            ? t('settings.sales.serviceChargePercentHint', {
                                defaultValue: `Max ${MAX_SERVICE_CHARGE_PERCENT}% · ATM style entry`,
                                max: MAX_SERVICE_CHARGE_PERCENT,
                              })
                            : t('attributes.form.atmStyle', {
                                defaultValue: 'Digits shift right to left (ATM style)',
                              })}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Nested option toggles */}
                  <div className="pt-3 mt-1 border-t border-gray-200/80 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/5">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <span className="block text-xs font-bold text-gray-700 dark:text-gray-200">{t('settings.sales.serviceChargeTaxable', { defaultValue: 'Taxable Service Charge' })}</span>
                        <span className="block text-[10px] text-gray-400 mt-0.5">{t('settings.sales.serviceChargeTaxableDesc', { defaultValue: 'Apply sales tax to this service charge' })}</span>
                      </div>
                      <label className={`relative inline-flex items-center ${serviceChargeEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <input
                          type="checkbox"
                          disabled={!serviceChargeEnabled}
                          {...register('serviceChargeTaxable')}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-mintcom-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm peer-disabled:opacity-60"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <span className="block text-xs font-bold text-gray-700 dark:text-gray-200">{t('settings.sales.serviceChargeAutoApply', { defaultValue: 'Auto apply to orders' })}</span>
                        <span className="block text-[10px] text-gray-400 mt-0.5">{t('settings.sales.serviceChargeAutoApplyDesc', { defaultValue: 'Add charge to all new orders automatically' })}</span>
                      </div>
                      <label className={`relative inline-flex items-center ${serviceChargeEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <input
                          type="checkbox"
                          disabled={!serviceChargeEnabled}
                          {...register('serviceChargeAutoApply')}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-mintcom-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm peer-disabled:opacity-60"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <span className="block text-xs font-bold text-gray-700 dark:text-gray-200">{t('settings.sales.serviceChargeOverride', { defaultValue: 'Allow cashier override' })}</span>
                        <span className="block text-[10px] text-gray-400 mt-0.5">{t('settings.sales.serviceChargeOverrideDesc', { defaultValue: 'Allow cashiers to remove or modify this charge' })}</span>
                      </div>
                      <label className={`relative inline-flex items-center ${serviceChargeEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <input
                          type="checkbox"
                          disabled={!serviceChargeEnabled}
                          {...register('serviceChargeAllowCashierOverride')}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-mintcom-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm peer-disabled:opacity-60"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          );
        })()}

        {activeTab === 'pos' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] p-6 sm:p-8 space-y-8 rounded-2xl shadow-sm font-sans">
            {/* Multiple Cash Drawers (Simultaneous Shifts) Toggle Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02] p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('settings.pos.allowMultipleShiftsTitle', { defaultValue: 'Multiple Cash Drawers' })}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                    {t('settings.pos.allowMultipleShiftsDesc', {
                      defaultValue:
                        'Allow multiple employees to open and operate independent cash shifts simultaneously at this location.',
                    })}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">
                    {t('settings.pos.allowMultipleShiftsOffHint', {
                      defaultValue:
                        'Turning this off closes any extra open drawers and keeps the most recently opened one.',
                    })}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    {...register('allowMultipleShifts')}
                    className="sr-only peer"
                  />
                  <div className="h-7 w-12 rounded-full bg-slate-300/90 ring-1 ring-inset ring-slate-400/40 shadow-inner transition-all duration-200 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-mintcom-green/50 peer-focus-visible:ring-offset-2 dark:bg-white/15 dark:ring-white/20 peer-checked:bg-mintcom-green peer-checked:ring-mintcom-green/40 peer-checked:shadow-[0_0_0_3px_rgba(125,198,162,0.22)] after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.18)] after:transition-all after:content-[''] peer-checked:after:translate-x-5" />
                </label>
              </div>
            </div>

            {/* Hold Order / Table Count */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02] p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col min-w-0 max-w-sm">
                <label className="label-strong font-sans block h-5 leading-5 mb-2 truncate">
                  {formatInputLabel(t('settings.pos.holdOrderTableCountTitle'), t('common.locale'))}
                </label>
                <div className="h-11 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max={MAX_HOLD_ORDER_TABLE_COUNT}
                    step="1"
                    maxLength={MAX_HOLD_ORDER_TABLE_DIGITS}
                    inputMode="numeric"
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      const target = e.target as HTMLInputElement;
                      const onlyDigits = target.value.replace(/[^\d]/g, '').slice(0, MAX_HOLD_ORDER_TABLE_DIGITS);
                      if (!onlyDigits) {
                        target.value = '';
                        return;
                      }
                      const parsed = parseInt(onlyDigits, 10);
                      target.value = String(Math.min(parsed, MAX_HOLD_ORDER_TABLE_COUNT));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    {...register('holdOrderTableCount', {
                      valueAsNumber: true,
                      min: { value: 0, message: t('settings.pos.holdOrderTableCountErrorRange', { max: MAX_HOLD_ORDER_TABLE_COUNT }) },
                      max: { value: MAX_HOLD_ORDER_TABLE_COUNT, message: t('settings.pos.holdOrderTableCountErrorRange', { max: MAX_HOLD_ORDER_TABLE_COUNT }) },
                      setValueAs: (value) => normalizeHoldOrderTableCount(value),
                    })}
                    className={`w-full h-11 px-3 box-border bg-white dark:bg-[#0F172A] border shadow-sm ${errors.holdOrderTableCount ? 'border-red-500 bg-red-500/5 focus:ring-red-500/20' : 'border-gray-200 dark:border-white/15 hover:border-gray-300 dark:hover:border-white/25 focus:ring-mintcom-green/25 focus:border-mintcom-green'} rounded-xl text-sm font-bold text-gray-900 dark:text-white caret-mintcom-green placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    placeholder={formatInputPlaceholder(t('settings.pos.holdOrderTableCountPlaceholder'), t('common.locale'))}
                  />
                </div>
                <div className="mt-2 min-h-[2.75rem]">
                  {errors.holdOrderTableCount ? (
                    <p className="text-[11px] font-medium text-red-500 leading-snug flex items-start gap-1.5">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      {errors.holdOrderTableCount.message as string || t('settings.pos.holdOrderTableCountErrorRange', { max: MAX_HOLD_ORDER_TABLE_COUNT })}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-gray-400 leading-snug">
                        {t('settings.pos.holdOrderTableCountDesc')}
                      </p>
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 leading-snug">
                        {t('settings.pos.holdOrderTableCountMaxHint', {
                          defaultValue: `Maximum is ${MAX_HOLD_ORDER_TABLE_COUNT} tables.`,
                          max: MAX_HOLD_ORDER_TABLE_COUNT,
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'receipt' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] p-6 sm:p-8 rounded-2xl shadow-sm font-sans divide-y divide-gray-100 dark:divide-white/5">
            {/* Identity Visibility */}
            <div className="space-y-6 pb-6">
              {/* Restaurant Name */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="block text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{t('settings.receipts.showName')}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('settings.receipts.showNameDesc')}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" {...register('showRestaurantName')} className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-mintcom-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                  </label>
                </div>
                <input
                  type="text"
                  {...restaurantNameField}
                  disabled={!showRestaurantName}
                  maxLength={MAX_ESTABLISHMENT_NAME_LENGTH}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-normal text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                  placeholder={formatInputPlaceholder(t('settings.profile.namePlaceholder'), t('common.locale'))}
                />
              </div>

              {/* Description / Tagline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="block text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{t('settings.receipts.showTagline')}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('settings.receipts.showTaglineDesc')}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" {...register('showDescription')} className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-mintcom-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                  </label>
                </div>
                <input
                  type="text"
                  {...restaurantDescriptionField}
                  disabled={!showDescription}
                  maxLength={MAX_ESTABLISHMENT_TAGLINE_LENGTH}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-normal text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                  placeholder={formatInputPlaceholder(t('settings.profile.aboutPlaceholder'), t('common.locale'))}
                />
              </div>
            </div>

            {/* Branding */}
            <div className="pt-6 pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{t('settings.receipts.showLogo')}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('settings.receipts.showLogoDesc')}</span>
                  <p className="text-[10px] text-gray-400 font-bold mt-1.5">{t('settings.profile.logoGuidelines')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" {...register('showLogoOnReceipt')} className="sr-only peer" />
                  <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-mintcom-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                </label>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${watch('showLogoOnReceipt') ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                <div className="flex items-center gap-6 p-2">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/5">
                    {receiptLogoPreview ? <img src={receiptLogoPreview} alt={t('settings.receipts.logoAlt')} className="w-full h-full object-cover" loading="lazy" decoding="async" /> : <Store className="w-8 h-8 text-gray-300 dark:text-gray-600" />}
                  </div>
                  <label className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 cursor-pointer label-strong font-sans transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg">
                    {t('settings.receipts.uploadLogo')}
                    <input type="file" accept="image/*" onChange={handleReceiptLogoChange} className="hidden" disabled={!watch('showLogoOnReceipt')} />
                  </label>
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div className="pt-6 pb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{t('settings.receipts.showAddress')}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('settings.receipts.showAddressDesc')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" {...register('showAddress')} className="sr-only peer" />
                  <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-mintcom-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                </label>
              </div>
              <input
                type="text"
                {...restaurantAddressField}
                disabled={!showAddress}
                maxLength={MAX_ESTABLISHMENT_ADDRESS_LENGTH}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-normal text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                placeholder={formatInputPlaceholder(t('settings.profile.addressPlaceholder'), t('common.locale'))}
              />
            </div>

            {/* Tax Info */}
            <div className="pt-6 pb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{t('settings.receipts.showTaxId')}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('settings.receipts.showTaxIdDesc')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" {...register('showTaxId')} className="sr-only peer" />
                  <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-mintcom-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                </label>
              </div>
              <input
                type="text"
                {...taxIdField}
                disabled={!showTaxId}
                autoCapitalize="characters"
                maxLength={MAX_ESTABLISHMENT_TAX_ID_LENGTH}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.value = sanitizeTaxId(target.value, MAX_ESTABLISHMENT_TAX_ID_LENGTH);
                }}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-normal text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                placeholder={formatInputPlaceholder(t('settings.profile.taxIdPlaceholder'), t('common.locale'))}
              />
              <p className="text-xs text-gray-400 mt-1">{t('settings.profile.taxIdDisclaimer')}</p>
            </div>

            {/* Footer */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{t('settings.receipts.footerMessage')}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('settings.receipts.footerMessageDesc')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" {...register('showFarewellMessage')} className="sr-only peer" />
                  <div className="w-10 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-mintcom-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 shadow-sm"></div>
                </label>
              </div>
              <textarea
                {...farewellMessageField}
                rows={2}
                disabled={!showFarewellMessage}
                maxLength={MAX_RECEIPT_FAREWELL_LENGTH}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-normal text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-white/5"
                placeholder={formatInputPlaceholder(t('settings.receipts.footerPlaceholder'), t('common.locale'))}
              />
            </div>
          </motion.div>
        )}





        {activeTab === 'einvoicing' && (
          <div className="space-y-6">
            <FiscalComplianceCard
              initial={fiscalInitial}
              establishmentCountry={currentEstablishment?.country ?? null}
              onSaved={() => fetchSettings(false)}
            />
          </div>
        )}

        {activeTab === 'accounting' && (
          <div className="space-y-6">
            <AccountingSettingsTab />
          </div>
        )}

        {activeTab === 'danger' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50/30 dark:bg-red-900/5 rounded-2xl border border-red-200/50 dark:border-red-900/20 p-6 sm:p-8 space-y-8 shadow-sm font-sans">

            {effectiveDeletionStatus && ['pending_deletion', 'deleting'].includes(effectiveDeletionStatus.status) ? (
              <div>
                <PendingDeletionBanner deletionStatus={effectiveDeletionStatus} onCancelDeletion={handleCancelDeletion} isCancelling={isCancellingDeletion} />
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
        </div>
      )}



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
      <ChangeCurrencyModal
        isOpen={pendingCurrencyData !== null}
        onClose={() => setPendingCurrencyData(null)}
        onConfirm={() => {
          const data = pendingCurrencyData;
          setPendingCurrencyData(null);
          if (data) saveSettings(data);
        }}
        fromCurrency={initialSettings?.currency || ''}
        toCurrency={pendingCurrencyData?.currency || ''}
        isSubmitting={isSaving}
      />
      {showDeletionWizard && establishmentInfo && (
        <EstablishmentDeletionWizard establishmentId={establishmentInfo.id} establishmentName={establishmentInfo.name} onClose={() => setShowDeletionWizard(false)} onDeletionRequested={handleDeletionRequested} />
      )}
      <RestoreLocationModal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setRestoreError(null);
        }}
        onRestore={handleRestore}
        isRestoring={isCancellingDeletion}
        errorMessage={restoreError}
      />
    </div>
  );
}

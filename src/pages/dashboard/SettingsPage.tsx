import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Store, Save, CreditCard, Receipt, Award, Shield, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EstablishmentDeletionWizard, PendingDeletionBanner } from '../../components/EstablishmentDeletionWizard';

interface AppSettings {
  id?: string;
  restaurantName: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  taxRate: number;
  taxId?: string;
  currency: string;
  showLogoOnReceipt: boolean;
  receiptHeader?: string;
  receiptFooter?: string;
  // Receipt display options
  showRestaurantName?: boolean;
  showDescription?: boolean;
  showAddress?: boolean;
  showTaxId?: boolean;
  showFarewellMessage?: boolean;
}

interface LoyaltyConfig {
  enabled: boolean;
  pointsPerCurrency: number;  // Points customer gets per currency unit spent
  currencyPerPoint: number;   // Currency amount required to earn 1 point
  rewards?: LoyaltyReward[];
}

interface LoyaltyReward {
  id: string;
  type: 'DISCOUNT' | 'FREE_ITEM';
  name: string;
  pointsRequired: number;
  discountPercentage?: number;
  freeCategoryId?: string;
  freeCategoryName?: string;
}

interface Category {
  id: string;
  name: string;
}

interface RewardFormState {
  type: 'DISCOUNT' | 'FREE_ITEM';
  pointsRequired: string;
  discountPercentage: string;
  freeCategoryId: string;
  freeCategoryName: string;
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
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [, setSettings] = useState<AppSettings | null>(null);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [initialSettings, setInitialSettings] = useState<AppSettings | null>(null);
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

  const { register, handleSubmit, reset, watch, formState: { isDirty } } = useForm<AppSettings>();

  // Watch receipt display options
  const showRestaurantName = watch('showRestaurantName');
  const showDescription = watch('showDescription');
  const showAddress = watch('showAddress');
  const showTaxId = watch('showTaxId');
  const showFarewellMessage = watch('showFarewellMessage');

  // Rewards state
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [initialRewards, setInitialRewards] = useState<LoyaltyReward[]>([]);
  const [initialLoyaltyConfig, setInitialLoyaltyConfig] = useState<LoyaltyConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [rewardForm, setRewardForm] = useState<RewardFormState>({
    type: 'DISCOUNT',
    pointsRequired: '',
    discountPercentage: '',
    freeCategoryId: '',
    freeCategoryName: '',
  });

  // ATM-style input state for currencyPerPoint (stores value in cents)
  const [currencyPerPointCents, setCurrencyPerPointCents] = useState(0);
  const lastSyncedCurrencyPerPoint = useRef<number | null>(null);

  // ATM display value (formatted as decimal)
  const currencyPerPointDisplay = (currencyPerPointCents / 100).toFixed(2);

  // ATM-style input handler
  const handleCurrencyPerPointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
    const cents = parseInt(digitsOnly, 10) || 0;
    if (cents <= 999999999) {
      setCurrencyPerPointCents(cents);
      lastSyncedCurrencyPerPoint.current = cents / 100;
      // Update loyalty config with the actual value
      setLoyaltyConfig(prev => prev ? { ...prev, currencyPerPoint: cents / 100 } : null);
    }
  };

  // Check if loyalty config has changes
  const hasLoyaltyChanges =
    JSON.stringify(loyaltyConfig) !== JSON.stringify(initialLoyaltyConfig) ||
    JSON.stringify(rewards) !== JSON.stringify(initialRewards);

  // Combined dirty state
  const hasUnsavedChanges = isDirty || hasLoyaltyChanges;

  // Sync ATM cents state when loyalty config is loaded from API (only if not from our own update)
  useEffect(() => {
    if (loyaltyConfig?.currencyPerPoint !== undefined &&
      loyaltyConfig.currencyPerPoint !== lastSyncedCurrencyPerPoint.current) {
      lastSyncedCurrencyPerPoint.current = loyaltyConfig.currencyPerPoint;
      setCurrencyPerPointCents(Math.round(loyaltyConfig.currencyPerPoint * 100));
    }
  }, [loyaltyConfig?.currencyPerPoint]);

  useEffect(() => {
    fetchSettings();
    fetchLoyaltyConfig();
    fetchCategories();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/app-settings');
      const data = response.data;
      setSettings(data);
      setInitialSettings(data);
      reset(data);
      if (data.logoUrl) {
        setPreviewImage(data.logoUrl);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoyaltyConfig = async () => {
    try {
      const response = await api.get('/app-settings/loyalty-config');
      setLoyaltyConfig(response.data);
      setInitialLoyaltyConfig(JSON.parse(JSON.stringify(response.data)));
      // Set rewards from loyalty config
      if (response.data?.rewards) {
        setRewards(response.data.rewards);
        setInitialRewards(JSON.parse(JSON.stringify(response.data.rewards)));
      } else {
        setRewards([]);
        setInitialRewards([]);
      }
    } catch (err) {
      console.error('Failed to load loyalty config');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      // Categories endpoint returns array directly
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Reward handlers
  const handleEditReward = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setRewardForm({
      type: reward.type,
      pointsRequired: String(reward.pointsRequired),
      discountPercentage: reward.discountPercentage ? String(reward.discountPercentage) : '',
      freeCategoryId: reward.freeCategoryId || '',
      freeCategoryName: reward.freeCategoryName || '',
    });
    setShowRewardModal(true);
  };

  const handleDeleteReward = async (rewardId: string) => {
    const updatedRewards = rewards.filter(r => r.id !== rewardId);
    try {
      await api.put('/app-settings/loyalty-config', {
        ...loyaltyConfig,
        rewards: updatedRewards,
      });
      setRewards(updatedRewards);
      toast.success('Reward deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete reward');
    }
  };

  const handleSaveReward = async () => {
    // Validation
    const pointsValue = parseInt(rewardForm.pointsRequired, 10);
    if (!rewardForm.pointsRequired || pointsValue < 1) {
      toast.error('Points required must be at least 1');
      return;
    }

    if (rewardForm.type === 'FREE_ITEM' && !rewardForm.freeCategoryId) {
      toast.error('Please select a category for free item reward');
      return;
    }

    if (rewardForm.type === 'DISCOUNT') {
      const discountValue = parseFloat(rewardForm.discountPercentage);
      if (!rewardForm.discountPercentage || discountValue <= 0 || discountValue > 100) {
        toast.error('Discount percentage must be between 1 and 100');
        return;
      }
    }

    // Create reward object
    const newReward: LoyaltyReward = {
      id: editingReward?.id || `reward_${Date.now()}`,
      type: rewardForm.type,
      name: rewardForm.type === 'DISCOUNT'
        ? `Discount ${parseFloat(rewardForm.discountPercentage)}%`
        : 'Free Item',
      pointsRequired: pointsValue,
      discountPercentage: rewardForm.type === 'DISCOUNT' ? parseFloat(rewardForm.discountPercentage) : undefined,
      freeCategoryId: rewardForm.type === 'FREE_ITEM' ? rewardForm.freeCategoryId : undefined,
      freeCategoryName: rewardForm.type === 'FREE_ITEM' ? rewardForm.freeCategoryName : undefined,
    };

    let updatedRewards: LoyaltyReward[];
    if (editingReward) {
      updatedRewards = rewards.map(r => r.id === editingReward.id ? newReward : r);
    } else {
      updatedRewards = [...rewards, newReward];
    }

    try {
      await api.put('/app-settings/loyalty-config', {
        ...loyaltyConfig,
        rewards: updatedRewards,
      });
      setRewards(updatedRewards);
      setShowRewardModal(false);
      setEditingReward(null);
      setRewardForm({ type: 'DISCOUNT', pointsRequired: '', discountPercentage: '', freeCategoryId: '', freeCategoryName: '' });
      toast.success(editingReward ? 'Reward updated successfully' : 'Reward added successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save reward');
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

  const onSubmit = async (data: AppSettings) => {
    const isCurrencyChanged = initialSettings && data.currency !== initialSettings.currency;

    if (isCurrencyChanged) {
      triggerTwoStepConfirm(
        'Change System Currency',
        `You are changing the system currency from ${initialSettings?.currency} to ${data.currency}. This affects all future transactions and financial reports.`,
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
          data.logoUrl = uploadRes.data.url;
        } catch (err) {
          console.error('Logo upload failed');
        }
      }

      // Save app settings
      await api.put('/app-settings', data);

      // If on loyalty tab, also save loyalty config
      if (activeTab === 'loyalty' && loyaltyConfig) {
        await api.put('/app-settings/loyalty-config', {
          ...loyaltyConfig,
          rewards: rewards,
        });
      }

      toast.success('Settings saved successfully');
      setSelectedLogo(null);
      fetchSettings();
      if (activeTab === 'loyalty') {
        fetchLoyaltyConfig();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
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
            title: 'Final Confirmation',
            message: 'Are you absolutely sure? This is a critical system change that affects your financial data.',
            type: 'danger',
            onConfirm,
          });
        }, 300);
      }
    });
  };

  const updateTaxRate = async () => {
    const taxRate = watch('taxRate');
    const isChanged = initialSettings && Number(taxRate) !== initialSettings.taxRate;

    if (isChanged) {
      triggerTwoStepConfirm(
        'Update Tax Rate',
        `You are changing the tax rate from ${initialSettings?.taxRate}% to ${taxRate}%.`,
        async () => {
          try {
            await api.put('/app-settings/tax-rate', { taxRate: Number(taxRate) });
            toast.success('Tax rate updated');
            fetchSettings();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update tax rate');
          }
        }
      );
      return;
    }

    toast.error('Tax rate has not changed');
  };

  // Deletion state
  const [showDeletionWizard, setShowDeletionWizard] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [establishmentInfo, setEstablishmentInfo] = useState<EstablishmentInfo | null>(null);
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);

  // Fetch establishment info and deletion status
  useEffect(() => {
    fetchEstablishmentInfo();
  }, []);

  const fetchEstablishmentInfo = async () => {
    try {
      // Get current establishment from localStorage or context
      const currentEstablishment = localStorage.getItem('currentEstablishment');
      if (currentEstablishment) {
        const parsed = JSON.parse(currentEstablishment);
        setEstablishmentInfo({ id: parsed.id, name: parsed.name });
        // Fetch deletion status
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
      toast.success('Deletion cancelled successfully!');
      fetchEstablishmentInfo();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel deletion');
    } finally {
      setIsCancellingDeletion(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Restaurant Profile', icon: Store },
    { id: 'sales', label: 'Sales Settings', icon: CreditCard },
    { id: 'receipt', label: 'Receipt Design', icon: Receipt },
    { id: 'loyalty', label: 'Loyalty Program', icon: Award },
    { id: 'danger', label: 'Danger Zone', icon: Trash2, isDanger: true },
  ];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-cream-50 dark:bg-paymint-dark">
        <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative z-10 p-4 lg:p-10 bg-cream-50 dark:bg-paymint-dark transition-colors duration-300 min-h-full">
      <div className="w-full">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cream-50 via-cream-100 to-cream-50 dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-cream-300 dark:border-white/5 shadow-sm mb-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
                <Store size={28} className="text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Manage your restaurant profile, sales configurations, and loyalty program</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-cream-100 dark:bg-white/5 rounded-2xl w-fit mb-10 border border-cream-300 dark:border-white/10 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                ? tab.isDanger
                  ? 'bg-red-50 dark:bg-red-500/10 text-red-500 shadow-md border border-red-200 dark:border-red-500/20'
                  : 'bg-cream-50 dark:bg-white/10 text-paymint-green shadow-md border border-cream-200 dark:border-white/10'
                : tab.isDanger
                  ? 'text-red-400 hover:text-red-500 dark:hover:text-red-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
          {/* Restaurant Profile */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cream-50 dark:bg-white/5 rounded-3xl border border-cream-300 dark:border-white/10 p-8 shadow-sm dark:shadow-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Restaurant Profile</h3>

              {/* Logo */}
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wider">Logo</label>
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32 bg-cream-100 dark:bg-black/20 rounded-2xl overflow-hidden flex items-center justify-center border border-cream-300 dark:border-white/5 shadow-inner">
                    {previewImage ? (
                      <img src={previewImage} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <label className="px-6 py-2.5 bg-cream-50 dark:bg-white/5 border border-cream-300 dark:border-white/10 text-gray-900 dark:text-white rounded-xl hover:bg-cream-100 dark:hover:bg-white/10 cursor-pointer font-bold shadow-sm transition-all">
                    Change Logo
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Restaurant Name */}
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Restaurant Name</label>
                <input
                  type="text"
                  {...register('restaurantName')}
                  className="w-full px-4 py-3 bg-cream-100 dark:bg-[#2a2a2a] border border-cream-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium resize-none"
                />
              </div>

              {/* Address & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Address</label>
                  <input
                    type="text"
                    {...register('address')}
                    className="w-full px-4 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Phone</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="w-full px-4 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sales' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cream-50 dark:bg-white/5 rounded-3xl border border-cream-300 dark:border-white/10 p-8 shadow-sm dark:shadow-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sales & Logic</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tax Rate */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Tax Rate (%)</label>
                    <button
                      type="button"
                      onClick={updateTaxRate}
                      className="text-xs font-black text-paymint-green hover:underline uppercase tracking-widest"
                    >
                      Update Ledger
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    {...register('taxRate')}
                    className="w-full px-4 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Updating this affects historical revenue calculation.</p>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Currency</label>
                  <select
                    {...register('currency')}
                    className="w-full px-4 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-paymint-green transition-colors"
                  >
                    <option value="JOD">JOD - Jordanian Dinar</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="AED">AED - UAE Dirham</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Receipt Settings */}
          {activeTab === 'receipt' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cream-50 dark:bg-white/5 rounded-3xl border border-cream-300 dark:border-white/10 p-8 shadow-sm dark:shadow-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-paymint-green/10 flex items-center justify-center">
                  <Receipt className="w-7 h-7 text-paymint-green" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Receipt Design</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customize what appears on printed receipts</p>
                </div>
              </div>

              {/* Display Options Section */}
              <div className="border-t border-cream-300 dark:border-white/10 pt-6">
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-paymint-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Display Options
                </h4>
                <div className="space-y-4">
                  {/* Show Logo */}
                  <div className="p-4 bg-cream-100 dark:bg-white/5 rounded-2xl border border-cream-300 dark:border-white/10">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="showLogoOnReceipt"
                        {...register('showLogoOnReceipt')}
                        className="w-5 h-5 rounded border-gray-300 text-paymint-green focus:ring-paymint-green cursor-pointer"
                      />
                      <div>
                        <label htmlFor="showLogoOnReceipt" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Show Logo</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Display your restaurant logo on receipts (set logo in Restaurant Profile)</p>
                      </div>
                    </div>
                  </div>

                  {/* Restaurant Name */}
                  <div className="p-4 bg-cream-100 dark:bg-white/5 rounded-2xl border border-cream-300 dark:border-white/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <input
                        type="checkbox"
                        id="showRestaurantName"
                        {...register('showRestaurantName')}
                        className="w-5 h-5 rounded border-gray-300 text-paymint-green focus:ring-paymint-green cursor-pointer"
                      />
                      <label htmlFor="showRestaurantName" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Show Restaurant Name</label>
                    </div>
                    <input
                      type="text"
                      {...register('restaurantName')}
                      disabled={!showRestaurantName}
                      placeholder="Enter restaurant name"
                      className={`w-full px-4 py-3 bg-cream-50 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-all font-medium ${!showRestaurantName ? 'opacity-50 grayscale cursor-not-allowed bg-gray-100 dark:bg-gray-800/30' : ''}`}
                    />
                  </div>

                  {/* Description */}
                  <div className="p-4 bg-cream-100 dark:bg-white/5 rounded-2xl border border-cream-300 dark:border-white/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <input
                        type="checkbox"
                        id="showDescription"
                        {...register('showDescription')}
                        className="w-5 h-5 rounded border-gray-300 text-paymint-green focus:ring-paymint-green cursor-pointer"
                      />
                      <label htmlFor="showDescription" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Show Description</label>
                    </div>
                    <textarea
                      {...register('description')}
                      disabled={!showDescription}
                      rows={2}
                      placeholder="Enter restaurant description"
                      className={`w-full px-4 py-3 bg-cream-50 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-all font-medium resize-none ${!showDescription ? 'opacity-50 grayscale cursor-not-allowed bg-gray-100 dark:bg-gray-800/30' : ''}`}
                    />
                  </div>

                  {/* Address */}
                  <div className="p-4 bg-cream-100 dark:bg-white/5 rounded-2xl border border-cream-300 dark:border-white/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <input
                        type="checkbox"
                        id="showAddress"
                        {...register('showAddress')}
                        className="w-5 h-5 rounded border-gray-300 text-paymint-green focus:ring-paymint-green cursor-pointer"
                      />
                      <label htmlFor="showAddress" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Show Address</label>
                    </div>
                    <input
                      type="text"
                      {...register('address')}
                      disabled={!showAddress}
                      placeholder="Enter restaurant address"
                      className={`w-full px-4 py-3 bg-cream-50 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-all font-medium ${!showAddress ? 'opacity-50 grayscale cursor-not-allowed bg-gray-100 dark:bg-gray-800/30' : ''}`}
                    />
                  </div>

                  {/* Tax ID */}
                  <div className="p-4 bg-cream-100 dark:bg-white/5 rounded-2xl border border-cream-300 dark:border-white/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <input
                        type="checkbox"
                        id="showTaxId"
                        {...register('showTaxId')}
                        className="w-5 h-5 rounded border-gray-300 text-paymint-green focus:ring-paymint-green cursor-pointer"
                      />
                      <label htmlFor="showTaxId" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Show Tax ID</label>
                    </div>
                    <input
                      type="text"
                      {...register('taxId')}
                      disabled={!showTaxId}
                      placeholder="Enter tax ID number (e.g. 123-456-789)"
                      className={`w-full px-4 py-3 bg-cream-50 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-all font-medium ${!showTaxId ? 'opacity-50 grayscale cursor-not-allowed bg-gray-100 dark:bg-gray-800/30' : ''}`}
                    />
                  </div>

                  {/* Farewell Message */}
                  <div className="p-4 bg-cream-100 dark:bg-white/5 rounded-2xl border border-cream-300 dark:border-white/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <input
                        type="checkbox"
                        id="showFarewellMessage"
                        {...register('showFarewellMessage')}
                        className="w-5 h-5 rounded border-gray-300 text-paymint-green focus:ring-paymint-green cursor-pointer"
                      />
                      <label htmlFor="showFarewellMessage" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Show Farewell Message</label>
                    </div>
                    <textarea
                      {...register('receiptFooter')}
                      disabled={!showFarewellMessage}
                      rows={2}
                      placeholder="Enter farewell message (e.g. Thank you for visiting!)"
                      className={`w-full px-4 py-3 bg-cream-50 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-all font-medium resize-none ${!showFarewellMessage ? 'opacity-50 grayscale cursor-not-allowed bg-gray-100 dark:bg-gray-800/30' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Header Message Section */}
              <div className="border-t border-cream-300 dark:border-white/10 pt-6">
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-paymint-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Header Message
                </h4>
                <div className="bg-cream-100 dark:bg-white/5 rounded-2xl border border-cream-300 dark:border-white/10 p-6">
                  <textarea
                    {...register('receiptHeader')}
                    rows={2}
                    className="w-full px-4 py-3 bg-cream-50 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium resize-none"
                    placeholder="e.g. Welcome to our Restaurant"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This message appears at the top of the receipt, below the restaurant info</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loyalty Program */}
          {activeTab === 'loyalty' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cream-50 dark:bg-white/5 rounded-3xl border border-cream-300 dark:border-white/10 p-8 shadow-sm dark:shadow-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-paymint-green/10 flex items-center justify-center">
                  <Award size={24} className="text-paymint-green" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Loyalty Program</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Configure how customers earn and redeem points</p>
                </div>
              </div>

              {/* Earning Rule Section */}
              <div className="border-t border-cream-300 dark:border-white/10 pt-6">
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-paymint-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Earning Rule
                </h4>
                <div className="bg-cream-100 dark:bg-white/5 rounded-2xl border border-cream-300 dark:border-white/10 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">For every</label>
                      <div className="flex items-stretch rounded-xl border border-cream-300 dark:border-white/10 overflow-hidden bg-cream-50 dark:bg-[#1a1a1a]">
                        <div className="px-4 bg-paymint-green/10 flex items-center justify-center border-r border-cream-300 dark:border-white/10">
                          <span className="text-sm font-bold text-paymint-green">{watch('currency') || 'JOD'}</span>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={currencyPerPointDisplay}
                          onChange={handleCurrencyPerPointChange}
                          placeholder="0.00"
                          className="flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-white font-semibold focus:outline-none text-right"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Customer gets</label>
                      <div className="flex items-stretch rounded-xl border border-cream-300 dark:border-white/10 overflow-hidden bg-cream-50 dark:bg-[#1a1a1a]">
                        <div className="px-4 bg-paymint-green/10 flex items-center justify-center border-r border-cream-300 dark:border-white/10">
                          <span className="text-xs font-bold text-paymint-green">PTS</span>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={Math.max(0, loyaltyConfig?.pointsPerCurrency ?? 0)}
                          onChange={(e) => {
                            const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                            const value = parseInt(digitsOnly, 10) || 0;
                            setLoyaltyConfig(prev => prev ? { ...prev, pointsPerCurrency: value } : null);
                          }}
                          placeholder="0"
                          className="flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-white font-semibold focus:outline-none text-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards Section */}
              <div className="border-t border-cream-300 dark:border-white/10 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-paymint-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    Rewards
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowRewardModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-paymint-green text-black rounded-xl font-bold text-sm hover:bg-paymint-green/90 transition-colors shadow-lg shadow-paymint-green/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Reward
                  </button>
                </div>

                {/* Rewards List */}
                {(!rewards || rewards.length === 0) ? (
                  <div className="bg-cream-100 dark:bg-white/5 rounded-2xl border border-cream-300 dark:border-white/10 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No rewards yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add rewards to let customers redeem their points</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rewards.map((reward) => (
                      <div key={reward.id} className="flex items-center gap-4 bg-cream-100 dark:bg-white/5 rounded-xl border border-cream-300 dark:border-white/10 p-4">
                        <div className="w-11 h-11 rounded-full bg-paymint-green/10 flex items-center justify-center">
                          {reward.type === 'DISCOUNT' ? (
                            <svg className="w-5 h-5 text-paymint-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-paymint-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{reward.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {reward.type === 'DISCOUNT' ? `${reward.discountPercentage}% off` : `Free item from ${reward.freeCategoryName}`} • {reward.pointsRequired} pts
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditReward(reward)}
                            className="p-2 text-paymint-green hover:bg-paymint-green/10 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReward(reward.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Add/Edit Reward Modal */}
          {showRewardModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-cream-50 dark:bg-[#1a1a1a] rounded-3xl border border-cream-300 dark:border-white/10 p-8 w-full max-w-md mx-4 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {editingReward ? 'Edit Reward' : 'Add Reward'}
                </h3>

                {/* Reward Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Reward Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRewardForm({ ...rewardForm, type: 'DISCOUNT' })}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-semibold transition-all ${rewardForm.type === 'DISCOUNT'
                        ? 'bg-paymint-green text-black border-paymint-green'
                        : 'bg-cream-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-cream-300 dark:border-white/10 hover:border-paymint-green'
                        }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Discount
                    </button>
                    <button
                      type="button"
                      onClick={() => setRewardForm({ ...rewardForm, type: 'FREE_ITEM' })}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-semibold transition-all ${rewardForm.type === 'FREE_ITEM'
                        ? 'bg-paymint-green text-black border-paymint-green'
                        : 'bg-cream-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-cream-300 dark:border-white/10 hover:border-paymint-green'
                        }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      Free Item
                    </button>
                  </div>
                </div>

                {/* Points Required */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Points Required</label>
                  <div className="flex items-stretch rounded-xl border border-cream-300 dark:border-white/10 overflow-hidden bg-cream-100 dark:bg-white/5">
                    <div className="px-4 bg-paymint-green/10 flex items-center justify-center border-r border-cream-300 dark:border-white/10">
                      <span className="text-xs font-bold text-paymint-green">PTS</span>
                    </div>
                    <input
                      type="number"
                      value={rewardForm.pointsRequired}
                      onChange={(e) => setRewardForm({ ...rewardForm, pointsRequired: e.target.value })}
                      placeholder="0"
                      className="flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-white font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Discount Percentage (for DISCOUNT type) */}
                {rewardForm.type === 'DISCOUNT' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Discount Percentage</label>
                    <div className="flex items-stretch rounded-xl border border-cream-300 dark:border-white/10 overflow-hidden bg-cream-100 dark:bg-white/5">
                      <div className="px-4 bg-paymint-green/10 flex items-center justify-center border-r border-cream-300 dark:border-white/10">
                        <span className="text-lg font-bold text-paymint-green">%</span>
                      </div>
                      <input
                        type="number"
                        value={rewardForm.discountPercentage}
                        onChange={(e) => setRewardForm({ ...rewardForm, discountPercentage: e.target.value })}
                        placeholder="0"
                        max="100"
                        className="flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-white font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Category Selection (for FREE_ITEM type) */}
                {rewardForm.type === 'FREE_ITEM' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Select Category</label>
                    <select
                      value={rewardForm.freeCategoryId}
                      onChange={(e) => {
                        const cat = categories.find(c => c.id === e.target.value);
                        setRewardForm({
                          ...rewardForm,
                          freeCategoryId: e.target.value,
                          freeCategoryName: cat?.name || ''
                        });
                      }}
                      className="w-full px-4 py-3 bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-paymint-green"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRewardModal(false);
                      setEditingReward(null);
                      setRewardForm({ type: 'DISCOUNT', pointsRequired: '', discountPercentage: '', freeCategoryId: '', freeCategoryName: '' });
                    }}
                    className="flex-1 px-4 py-3 bg-cream-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold border border-cream-300 dark:border-white/10 hover:bg-cream-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReward}
                    className="flex-1 px-4 py-3 bg-paymint-green text-black rounded-xl font-bold hover:bg-paymint-green/90 transition-colors shadow-lg shadow-paymint-green/20"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {/* Pending Deletion Banner */}
              {deletionStatus && (
                <PendingDeletionBanner
                  deletionStatus={deletionStatus}
                  onCancelDeletion={handleCancelDeletion}
                  isCancelling={isCancellingDeletion}
                />
              )}

              {/* Delete Establishment Card */}
              <div className="bg-red-50 dark:bg-red-500/5 rounded-3xl border-2 border-red-200 dark:border-red-500/20 p-8 shadow-sm dark:shadow-none">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                    <Trash2 className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Delete Establishment</h3>
                    <p className="text-sm text-red-600 dark:text-red-300/80">Permanently delete this establishment and all its data</p>
                  </div>
                </div>

                {/* Warning Box */}
                <div className="bg-white dark:bg-red-500/5 rounded-2xl p-6 border border-red-200 dark:border-red-500/10 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold text-red-700 dark:text-red-400 mb-2">Before you proceed, understand that:</h4>
                      <ul className="space-y-2 text-sm text-red-600 dark:text-red-300/80">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>All orders, customers, products, and employee records will be permanently deleted</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>You'll have a 30-day grace period to cancel the deletion</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>Data exports will be sent to your email before deletion</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>This action cannot be undone after the grace period</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setShowDeletionWizard(true)}
                  disabled={deletionStatus?.status === 'pending_deletion'}
                  className="px-8 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={20} />
                  {deletionStatus?.status === 'pending_deletion'
                    ? 'Deletion Already Scheduled'
                    : 'Delete This Establishment'
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 sticky bottom-8 z-20">
            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-amber-200 dark:border-amber-900/50 shadow-xl"
              >
                <Shield size={14} /> UNSAVED MODIFICATIONS
              </motion.div>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-10 py-4 bg-paymint-green text-black font-black rounded-2xl shadow-xl shadow-paymint-green/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Save size={20} />
              )}
              Save All Settings
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />

      {/* Deletion Wizard Modal */}
      {showDeletionWizard && establishmentInfo && (
        <EstablishmentDeletionWizard
          establishmentId={establishmentInfo.id}
          establishmentName={establishmentInfo.name}
          onClose={() => setShowDeletionWizard(false)}
          onDeletionRequested={fetchEstablishmentInfo}
        />
      )}
    </div>
  );
}
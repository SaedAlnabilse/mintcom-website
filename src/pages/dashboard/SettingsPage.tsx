import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Store, Save, CreditCard, Receipt, Award } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';

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
  invoicePrefix?: string;
  currency: string;
  showLogoOnReceipt: boolean;
  receiptHeader?: string;
  receiptFooter?: string;
  loyaltyEnabled: boolean;
  pointsPerUnit: number;
  minimumSpend: number;
}

interface LoyaltyConfig {
  enabled: boolean;
  pointsPerCurrencyUnit: number;
  minimumSpendForPoints: number;
  tiers: {
    name: string;
    minPoints: number;
    multiplier: number;
  }[];
}

type SettingsTab = 'profile' | 'sales' | 'receipt' | 'loyalty';

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

  useEffect(() => {
    fetchSettings();
    fetchLoyaltyConfig();
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
    } catch (err) {
      console.error('Failed to load loyalty config');
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

      await api.put('/app-settings', data);
      toast.success('Settings saved successfully');
      setSelectedLogo(null);
      fetchSettings();
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

  const updateLoyaltyConfig = async (enabled: boolean) => {
    try {
      await api.put('/app-settings/loyalty-config', {
        enabled,
        pointsPerCurrencyUnit: loyaltyConfig?.pointsPerCurrencyUnit || 1,
        minimumSpendForPoints: loyaltyConfig?.minimumSpendForPoints || 0,
      });
      toast.success(`Loyalty program ${enabled ? 'enabled' : 'disabled'}`);
      fetchLoyaltyConfig();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update loyalty config');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Restaurant Profile', icon: Store },
    { id: 'sales', label: 'Sales Settings', icon: CreditCard },
    { id: 'receipt', label: 'Receipt Design', icon: Receipt },
    { id: 'loyalty', label: 'Loyalty Program', icon: Award },
  ];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-[#050505]">
        <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-[#050505] p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your restaurant profile, sales configurations, and loyalty program</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit mb-10 border border-gray-200 dark:border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm'
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
              className="bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 p-8 shadow-sm dark:shadow-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Restaurant Profile</h3>

              {/* Logo */}
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wider">Logo</label>
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32 bg-gray-50 dark:bg-black/20 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 dark:border-white/5 shadow-inner">
                    {previewImage ? (
                      <img src={previewImage} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <label className="px-6 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer font-bold shadow-sm transition-all">
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium resize-none"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Address</label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Phone</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sales' && (
            <div className="bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 p-8 shadow-sm dark:shadow-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sales & Financials</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Tax Rate (%)</label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      step="0.01"
                      {...register('taxRate', { valueAsNumber: true })}
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-black focus:outline-none focus:border-paymint-green transition-colors"
                    />
                    <button
                      type="button"
                      onClick={updateTaxRate}
                      className="px-6 py-2 bg-paymint-green/10 text-paymint-green font-bold rounded-xl hover:bg-paymint-green hover:text-black transition-all shadow-sm"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Currency</label>
                  <select
                    {...register('currency')}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:border-paymint-green transition-colors"
                  >
                    <option value="JOD">JOD - Jordanian Dinar</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Invoice Prefix</label>
                  <input
                    type="text"
                    {...register('invoicePrefix')}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-mono focus:outline-none focus:border-paymint-green transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Tax ID / VAT</label>
                  <input
                    type="text"
                    {...register('taxId')}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-paymint-green transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Receipt Settings */}
          {activeTab === 'receipt' && (
            <div className="bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 p-8 shadow-sm dark:shadow-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Receipt Design</h3>
              
              <div className="bg-gray-50 dark:bg-[#2a2a2a] p-4 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-transparent transition-colors">
                <div>
                  <p className="text-gray-900 dark:text-white font-bold text-sm">Print Logo</p>
                  <p className="text-gray-500 text-xs mt-0.5">Show restaurant logo on receipts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="showLogoOnReceipt"
                    {...register('showLogoOnReceipt')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-paymint-green"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Receipt Header</label>
                <textarea
                  {...register('receiptHeader')}
                  placeholder="Text shown at the top of receipts"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Receipt Footer</label>
                <textarea
                  {...register('receiptFooter')}
                  placeholder="Text shown at the bottom of receipts (e.g., Thank you for visiting!)"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green transition-colors font-medium resize-none"
                />
              </div>
            </div>
          )}

          {/* Loyalty Program */}
          {activeTab === 'loyalty' && (
            <div className="bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 p-8 shadow-sm dark:shadow-none space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Loyalty Program</h3>
                  <p className="text-gray-500 text-sm mt-1">Reward regular customers with points</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loyaltyConfig?.enabled}
                    onChange={() => updateLoyaltyConfig(!loyaltyConfig?.enabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-paymint-green"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Points per 1 JOD spent</label>
                  <input
                    type="number"
                    value={loyaltyConfig?.pointsPerCurrencyUnit || 1}
                    onChange={(e) => setLoyaltyConfig(prev => prev ? {...prev, pointsPerCurrencyUnit: Number(e.target.value)} : null)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-black focus:outline-none focus:border-paymint-green transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Min. Spend for Points</label>
                  <input
                    type="number"
                    value={loyaltyConfig?.minimumSpendForPoints || 0}
                    onChange={(e) => setLoyaltyConfig(prev => prev ? {...prev, minimumSpendForPoints: Number(e.target.value)} : null)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-black focus:outline-none focus:border-paymint-green transition-colors"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">Program Tiers</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(loyaltyConfig?.tiers || []).map((tier, index) => (
                    <div key={index} className="p-5 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 transition-all hover:border-paymint-green/30 group">
                      <p className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">{tier.name}</p>
                      <p className="text-sm text-gray-500 font-medium mt-1">Min: {tier.minPoints} points</p>
                      <p className="text-paymint-green font-black mt-3 text-xl">{tier.multiplier}x <span className="text-xs uppercase font-bold text-gray-400 tracking-widest">Multiplier</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="px-10 py-4 bg-paymint-green text-black font-bold rounded-2xl hover:bg-paymint-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-paymint-green/30 flex items-center gap-3 active:scale-95"
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
    </div>
  );
}
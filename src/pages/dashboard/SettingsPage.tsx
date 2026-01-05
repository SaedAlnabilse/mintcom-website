import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../config/api';
import toast from 'react-hot-toast';

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
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch } = useForm<AppSettings>();

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
      reset(data);
      if (data.logoUrl) {
        setLogoPreview(data.logoUrl);
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
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: AppSettings) => {
    try {
      setIsSaving(true);

      // If there's a new logo, upload it first
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

  const updateTaxRate = async () => {
    const taxRate = watch('taxRate');
    try {
      await api.put('/app-settings/tax-rate', { taxRate: Number(taxRate) });
      toast.success('Tax rate updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update tax rate');
    }
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
    { id: 'profile', label: 'Restaurant Profile', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'sales', label: 'Sales Settings', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'receipt', label: 'Receipt Settings', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'loyalty', label: 'Loyalty Program', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' },
  ];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <svg className="animate-spin h-8 w-8 text-green-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm">Configure your restaurant settings</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SettingsTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Restaurant Profile */}
        {activeTab === 'profile' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white">Restaurant Profile</h3>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <label className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 cursor-pointer">
                  Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Restaurant Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Restaurant Name</label>
              <input
                type="text"
                {...register('restaurantName')}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
              <input
                type="text"
                {...register('address')}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sales Settings */}
        {activeTab === 'sales' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white">Sales Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tax Rate (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    {...register('taxRate', { valueAsNumber: true })}
                    className="flex-1 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={updateTaxRate}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Update
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tax ID / VAT Number</label>
                <input
                  type="text"
                  {...register('taxId')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Invoice Prefix</label>
                <input
                  type="text"
                  {...register('invoicePrefix')}
                  placeholder="e.g., INV-"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                <select
                  {...register('currency')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="ILS">ILS - Israeli Shekel</option>
                  <option value="AED">AED - UAE Dirham</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Settings */}
        {activeTab === 'receipt' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white">Receipt Settings</h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('showLogoOnReceipt')}
                id="showLogoOnReceipt"
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
              />
              <label htmlFor="showLogoOnReceipt" className="text-gray-300">Show logo on receipt</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Receipt Header</label>
              <textarea
                {...register('receiptHeader')}
                rows={2}
                placeholder="Text shown at the top of receipts"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Receipt Footer</label>
              <textarea
                {...register('receiptFooter')}
                rows={2}
                placeholder="Text shown at the bottom of receipts (e.g., Thank you for visiting!)"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        )}

        {/* Loyalty Program */}
        {activeTab === 'loyalty' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Loyalty Program</h3>
              <button
                type="button"
                onClick={() => updateLoyaltyConfig(!loyaltyConfig?.enabled)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  loyaltyConfig?.enabled
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {loyaltyConfig?.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {loyaltyConfig?.enabled && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Points per $1 spent</label>
                    <input
                      type="number"
                      value={loyaltyConfig?.pointsPerCurrencyUnit || 1}
                      onChange={(e) => setLoyaltyConfig(prev => prev ? {...prev, pointsPerCurrencyUnit: Number(e.target.value)} : null)}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Minimum spend for points</label>
                    <input
                      type="number"
                      value={loyaltyConfig?.minimumSpendForPoints || 0}
                      onChange={(e) => setLoyaltyConfig(prev => prev ? {...prev, minimumSpendForPoints: Number(e.target.value)} : null)}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Tiers */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Loyalty Tiers</h4>
                  <div className="space-y-2">
                    {(loyaltyConfig?.tiers || []).map((tier, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg">
                        <span className="text-white font-medium">{tier.name}</span>
                        <span className="text-gray-400">Min: {tier.minPoints} points</span>
                        <span className="text-green-400">{tier.multiplier}x multiplier</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

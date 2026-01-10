import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  MapPin,
  DollarSign,
  User,
  Lock,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CreditCard,
  CheckCircle2,
  Building2,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  KeyRound,
  Hash,
  ShieldCheck,
  Plus,
  ChevronDown
} from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Step 1: Establishment Details
const step1Schema = z.object({
  name: z.string().min(1, 'Establishment name is required'),
  type: z.string().min(1, 'Business type is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  currency: z.string().min(1, 'Currency is required'),
});

// Step 2: Payment Method (Mock)
const step2Schema = z.object({
  cardNumber: z.string().min(16, 'Card number must be 16 digits').max(19),
  expiryDate: z.string().min(5, 'MM/YY required'),
  cvc: z.string().min(3, 'CVC required'),
  cardName: z.string().min(1, 'Name on card is required'),
});

// Step 3: Establishment Access Credentials
const step3Schema = z.object({
  ownerPosId: z.string()
    .min(4, 'POS ID must be at least 4 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'POS ID can only contain letters, numbers, underscores, and hyphens'),
  ownerPosPassword: z.string().min(6, 'POS Password must be at least 6 characters'),
});

// Step 4: Admin Access
const step4Schema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshEstablishments, account, needsOnboarding, setCurrentEstablishment, establishments, updateAccount } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [useSavedCard, setUseSavedCard] = useState(true); // Default to using saved card if available
  const [selectedCountry, setSelectedCountry] = useState({ code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Country codes list
  const countries = [
    { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
    { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
    { code: 'US', name: 'USA', dialCode: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'UK', dialCode: '+44', flag: '🇬🇧' },
    { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
    { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧' },
    { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
    { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
    { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭' },
    { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
    { code: 'IQ', name: 'Iraq', dialCode: '+964', flag: '🇮🇶' },
    { code: 'PS', name: 'Palestine', dialCode: '+970', flag: '🇵🇸' },
    { code: 'SY', name: 'Syria', dialCode: '+963', flag: '🇸🇾' },
    { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
    { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
    { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  ];

  // Determine if this is a Trial (first est) or Paid (additional est) flow
  const isTrialFlow = needsOnboarding;

  // Check if user has a saved payment method
  // If user has existing establishments, they must have a payment method on file
  const hasSavedCard = !!account?.defaultPaymentMethod || establishments.length > 0;
  const savedCardLast4 = account?.defaultPaymentMethod || '****';

  // Forms
  const form1 = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { currency: 'JOD', type: 'restaurant' }
  });

  const form2 = useForm({
    resolver: zodResolver(step2Schema)
  });

  const form3 = useForm({
    resolver: zodResolver(step3Schema)
  });

  const form4 = useForm({
    resolver: zodResolver(step4Schema)
  });

  // Format card number with spaces (0000 0000 0000 0000)
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Format CVC (max 4 digits)
  const formatCVC = (value: string) => {
    return value.replace(/[^0-9]/gi, '').substring(0, 4);
  };

  const onStep1Submit = (data: any) => {
    // Combine country dial code with phone number
    const fullPhone = `${selectedCountry.dialCode} ${data.phone}`;
    setFormData((prev: any) => ({ ...prev, ...data, phone: fullPhone }));
    setStep(2);
  };

  const onStep2Submit = async (data: any) => {
    // Handle payment method
    if (hasSavedCard && useSavedCard) {
      // Use existing saved card - no need to update
      setFormData((prev: any) => ({ ...prev, paymentMethodToken: 'use_saved_card', useSavedCard: true }));
    } else {
      // New card - save the last 4 digits
      const cardNumber = data.cardNumber?.replace(/\s/g, '') || '';
      const last4Digits = cardNumber.slice(-4);

      try {
        // Save the last 4 digits to the account
        const response = await api.post('/api/accounts/payment-method', { last4Digits });

        // Update local account state
        if (response.data?.defaultPaymentMethod) {
          updateAccount({ defaultPaymentMethod: response.data.defaultPaymentMethod });
        }

        // In a real app, we would tokenize the card here via Stripe/Payment Provider
        // For now, we just mock it and generate a fake token
        setFormData((prev: any) => ({ ...prev, paymentMethodToken: 'tok_mock_' + Date.now(), useSavedCard: false }));
      } catch (err: any) {
        console.error('Failed to save payment method:', err);
        // Continue anyway - non-critical
        setFormData((prev: any) => ({ ...prev, paymentMethodToken: 'tok_mock_' + Date.now(), useSavedCard: false }));
      }
    }

    // Always show Step 3 - each establishment gets its own unique Owner POS ID
    setStep(3);
  };

  const onStep3Submit = (data: any) => {
    // Store Owner POS credentials locally for this establishment
    // Each establishment gets its own unique Owner POS ID
    setFormData((prev: any) => ({ ...prev, ...data }));
    setStep(4);
  };


  const onStep4Submit = async (data: any) => {
    setIsLoading(true);
    try {
      // 1. Create Establishment with user-provided Owner POS ID
      const establishmentPayload = {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        phone: formData.phone,
        currency: formData.currency,
        ownerPosId: formData.ownerPosId, // User-provided unique ID for this establishment
        ownerPosPassword: formData.ownerPosPassword, // User-provided password
        paymentMethodToken: formData.paymentMethodToken
      };

      const estRes = await api.post('/api/establishments', establishmentPayload);
      const estId = estRes.data.establishment?.id || estRes.data.id;

      if (!estId) {
        throw new Error('Failed to get establishment ID');
      }

      // Save the establishment ID for navigation
      setFormData((prev: any) => ({ ...prev, establishmentId: estId }));

      // 2. Create Admin Employee
      await api.post('/api/employees', {
        username: data.username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        email: account?.email, // Link to main account email
        establishmentId: estId,
        role: 'ADMIN',
        permissions: [],
        allowedDiscounts: []
      });

      setStep(5); // Success Step
      toast.success('Onboarding complete!');
      await refreshEstablishments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };


  const businessTypes = [
    { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
    { id: 'cafe', label: 'Cafe', icon: Coffee },
    { id: 'retail', label: 'Retail', icon: ShoppingBag },
    { id: 'other', label: 'Other', icon: Building2 },
  ];

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col transition-colors duration-300">
      {/* Navbar */}
      <div className="p-6 flex justify-between items-center border-b border-gray-200 dark:border-white/5 bg-white dark:bg-transparent shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-paymint-green rounded-lg flex items-center justify-center">
            <span className="text-black font-black">P</span>
          </div>
          <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">PayMint</span>
        </div>

        {step <= totalSteps && (
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-paymint-green' : 'w-4 bg-gray-200 dark:bg-white/10'
                    }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step} of {totalSteps}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">

          {/* STEP 1: Establishment Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl w-full"
            >
              <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 lg:p-12 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                <div className="mb-10">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Establishment Setup</h2>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Add your first establishment details.</p>
                </div>

                <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Establishment Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                        <input
                          type="text"
                          {...form1.register('name')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${form1.formState.errors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="e.g. The Coffee House"
                        />
                      </div>
                      {form1.formState.errors.name && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{form1.formState.errors.name.message as string}</p>}
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Business Category</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {businessTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => form1.setValue('type', type.id)}
                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${form1.watch('type') === type.id ? 'border-paymint-green bg-paymint-green/5 text-paymint-green' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-transparent text-gray-400'
                              }`}
                          >
                            <type.icon size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Phone Number Row */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {/* Country Code Selector */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCountryDropdown(!showCountryDropdown);
                              if (showCountryDropdown) setCountrySearch('');
                            }}
                            className={`flex items-center gap-2 bg-gray-50 dark:bg-black/20 border ${form1.formState.errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 px-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all min-w-[130px]`}
                          >
                            <span className="text-xl">{selectedCountry.flag}</span>
                            <span className="text-sm">{selectedCountry.dialCode}</span>
                            <ChevronDown size={16} className="text-gray-400" />
                          </button>
                          <AnimatePresence>
                            {showCountryDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                              >
                                {/* Search Input */}
                                <div className="p-3 border-b border-gray-100 dark:border-white/5">
                                  <input
                                    type="text"
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    placeholder="Search country..."
                                    className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
                                    autoFocus
                                  />
                                </div>
                                {/* Filtered Countries List */}
                                <div className="max-h-52 overflow-y-auto">
                                  {countries
                                    .filter((country) =>
                                      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                      country.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                      country.dialCode.includes(countrySearch)
                                    )
                                    .map((country) => (
                                      <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => {
                                          setSelectedCountry(country);
                                          setShowCountryDropdown(false);
                                          setCountrySearch('');
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-paymint-green/10 transition-colors ${selectedCountry.code === country.code ? 'bg-paymint-green/5 text-paymint-green' : 'text-gray-700 dark:text-gray-300'}`}
                                      >
                                        <span className="text-xl">{country.flag}</span>
                                        <span className="font-bold text-sm">{country.name}</span>
                                        <span className="text-gray-400 text-sm ml-auto">{country.dialCode}</span>
                                      </button>
                                    ))}
                                  {countries.filter((country) =>
                                    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                    country.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                    country.dialCode.includes(countrySearch)
                                  ).length === 0 && (
                                      <p className="text-center text-gray-400 text-sm py-4">No countries found</p>
                                    )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {/* Phone Number Input */}
                        <div className="relative flex-1">
                          <input
                            type="tel"
                            {...form1.register('phone')}
                            onChange={(e) => {
                              // Only allow numbers
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              form1.setValue('phone', value);
                            }}
                            className={`w-full bg-gray-50 dark:bg-black/20 border ${form1.formState.errors.phone ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 px-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>
                      {form1.formState.errors.phone && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{form1.formState.errors.phone.message as string}</p>}
                    </div>

                    {/* Base Currency Row */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Base Currency <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select
                          {...form1.register('currency')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${form1.formState.errors.currency ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all appearance-none`}
                        >
                          <option value="JOD">JOD - Jordanian Dinar</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="AED">AED - UAE Dirham</option>
                        </select>
                      </div>
                      {form1.formState.errors.currency && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{form1.formState.errors.currency.message as string}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Location Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          {...form1.register('address')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${form1.formState.errors.address ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="City, Area, Building"
                        />
                      </div>
                      {form1.formState.errors.address && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{form1.formState.errors.address.message as string}</p>}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-5 bg-paymint-green text-black font-black text-xl rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      Next Step
                      <ArrowRight size={24} />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Trial & Payment */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md w-full"
            >
              <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 lg:p-12 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                <div className="mb-8">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 font-bold text-xs uppercase tracking-widest">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isTrialFlow ? 'bg-yellow-400/10' : 'bg-paymint-green/10'}`}>
                      <ShieldCheck className={isTrialFlow ? 'text-yellow-500' : 'text-paymint-green'} size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        {isTrialFlow ? 'Start Free Trial' : 'Activate Subscription'}
                      </h2>
                      {isTrialFlow ? (
                        <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">7 Days Free</span>
                      ) : (
                        <span className="bg-paymint-green text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">$20/month</span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                    {isTrialFlow
                      ? "You won't be charged today. Cancel anytime before your trial ends."
                      : "Your card will be charged $20.00 immediately for this new establishment."
                    }
                  </p>
                </div>

                <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-6">
                  <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Due Today</span>
                      <span className="text-xl font-black text-gray-900 dark:text-white">{isTrialFlow ? '$0.00' : '$20.00'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>{isTrialFlow ? 'After 7 days' : 'Monthly'}</span>
                      <span>$20.00/mo</span>
                    </div>
                  </div>

                  {/* Saved Card Option */}
                  {hasSavedCard && (
                    <div className="space-y-4 mb-6">
                      <div
                        onClick={() => setUseSavedCard(true)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${useSavedCard
                          ? 'border-paymint-green bg-paymint-green/5'
                          : 'border-gray-200 dark:border-white/10 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${useSavedCard ? 'bg-paymint-green' : 'bg-gray-100 dark:bg-white/5'}`}>
                            <CreditCard size={24} className={useSavedCard ? 'text-black' : 'text-gray-400'} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-gray-900 dark:text-white">Use Saved Card</p>
                            <p className="text-xs text-gray-500">•••• •••• •••• {savedCardLast4}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${useSavedCard ? 'border-paymint-green bg-paymint-green' : 'border-gray-300'
                            }`}>
                            {useSavedCard && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setUseSavedCard(false)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${!useSavedCard
                          ? 'border-paymint-green bg-paymint-green/5'
                          : 'border-gray-200 dark:border-white/10 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${!useSavedCard ? 'bg-paymint-green' : 'bg-gray-100 dark:bg-white/5'}`}>
                            <Plus size={24} className={!useSavedCard ? 'text-black' : 'text-gray-400'} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-gray-900 dark:text-white">Add New Card</p>
                            <p className="text-xs text-gray-500">Use a different payment method</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!useSavedCard ? 'border-paymint-green bg-paymint-green' : 'border-gray-300'
                            }`}>
                            {!useSavedCard && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Card Form - Only show if no saved card OR user chose to add new */}
                  {(!hasSavedCard || !useSavedCard) && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Card Number</label>
                        <div className="relative group">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            {...form2.register('cardNumber')}
                            onChange={(e) => {
                              const formatted = formatCardNumber(e.target.value);
                              form2.setValue('cardNumber', formatted);
                            }}
                            maxLength={19}
                            placeholder="0000 0000 0000 0000"
                            className={`w-full bg-gray-100 dark:bg-black/20 border ${form2.formState.errors.cardNumber ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl py-4 pl-12 pr-4 text-gray-700 dark:text-white placeholder-gray-400 tracking-widest focus:outline-none focus:ring-2 focus:ring-paymint-green/50`}
                          />
                        </div>
                        {form2.formState.errors.cardNumber && <p className="text-red-500 text-xs mt-1 ml-1">{form2.formState.errors.cardNumber.message as string}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Expiry</label>
                          <input
                            type="text"
                            {...form2.register('expiryDate')}
                            onChange={(e) => {
                              const formatted = formatExpiryDate(e.target.value);
                              form2.setValue('expiryDate', formatted);
                            }}
                            maxLength={5}
                            placeholder="MM/YY"
                            className={`w-full bg-gray-100 dark:bg-black/20 border ${form2.formState.errors.expiryDate ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl py-4 px-4 text-gray-700 dark:text-white placeholder-gray-400 tracking-wider focus:outline-none focus:ring-2 focus:ring-paymint-green/50 text-center`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">CVC</label>
                          <input
                            type="text"
                            {...form2.register('cvc')}
                            onChange={(e) => {
                              const formatted = formatCVC(e.target.value);
                              form2.setValue('cvc', formatted);
                            }}
                            maxLength={4}
                            placeholder="123"
                            className={`w-full bg-gray-100 dark:bg-black/20 border ${form2.formState.errors.cvc ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl py-4 px-4 text-gray-700 dark:text-white placeholder-gray-400 tracking-wider focus:outline-none focus:ring-2 focus:ring-paymint-green/50 text-center`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Cardholder Name</label>
                        <input
                          type="text"
                          {...form2.register('cardName')}
                          placeholder="John Doe"
                          className={`w-full bg-gray-100 dark:bg-black/20 border ${form2.formState.errors.cardName ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl py-4 px-4 text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50`}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type={hasSavedCard && useSavedCard ? 'button' : 'submit'}
                      onClick={hasSavedCard && useSavedCard ? () => onStep2Submit({}) : undefined}
                      className="w-full py-5 bg-paymint-green text-black font-black text-xl rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      {isTrialFlow ? 'Start Free Trial' : 'Activate & Pay $20'}
                      <ArrowRight size={24} />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Account Owner POS Credentials */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md w-full"
            >
              <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 lg:p-12 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                <div className="mb-10">
                  <button onClick={() => setStep(2)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 font-bold text-xs uppercase tracking-widest">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Create Your Owner ID</h2>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">This ID will be used to log into the POS app for this establishment.</p>
                  <div className="mt-4 p-3 bg-paymint-green/10 text-paymint-green text-xs rounded-xl font-medium border border-paymint-green/20">
                    <p>✨ <strong>Unique access:</strong> Each establishment has its own Owner ID and password for secure POS login.</p>
                  </div>
                </div>

                <form onSubmit={form3.handleSubmit(onStep3Submit)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Owner POS ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                      <input
                        type="text"
                        {...form3.register('ownerPosId')}
                        className={`w-full bg-gray-50 dark:bg-black/20 border ${form3.formState.errors.ownerPosId ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                        placeholder="e.g. mycompany"
                      />
                    </div>
                    {form3.formState.errors.ownerPosId && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{form3.formState.errors.ownerPosId.message as string}</p>}
                    <p className="text-[10px] text-gray-400 ml-1">Your unique Owner ID for POS login (Step 1 of 2-step login).</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                      POS Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                      <input
                        type="password"
                        {...form3.register('ownerPosPassword')}
                        className={`w-full bg-gray-50 dark:bg-black/20 border ${form3.formState.errors.ownerPosPassword ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                        placeholder="••••••••"
                      />
                    </div>
                    {form3.formState.errors.ownerPosPassword && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{form3.formState.errors.ownerPosPassword.message as string}</p>}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-5 bg-paymint-green text-black font-black text-xl rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      Next Step
                      <ArrowRight size={24} />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Admin Access */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md w-full"
            >
              <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 lg:p-12 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                <div className="mb-10">
                  <button onClick={() => setStep(3)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 font-bold text-xs uppercase tracking-widest">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Create Your POS Login</h2>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Create your personal employee account to work on the POS.</p>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded-xl font-medium border border-blue-100 dark:border-blue-900/30">
                    <p>This is Step 2 of the POS Login (Employee Access).</p>
                  </div>
                </div>

                <form onSubmit={form4.handleSubmit(onStep4Submit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                        <input
                          type="text"
                          {...form4.register('firstName')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${form4.formState.errors.firstName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="John"
                        />
                      </div>
                      {form4.formState.errors.firstName && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{form4.formState.errors.firstName.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                        <input
                          type="text"
                          {...form4.register('lastName')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${form4.formState.errors.lastName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="Doe"
                        />
                      </div>
                      {form4.formState.errors.lastName && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{form4.formState.errors.lastName.message as string}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Admin Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                      <input
                        type="text"
                        {...form4.register('username')}
                        className={`w-full bg-gray-50 dark:bg-black/20 border ${form4.formState.errors.username ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                        placeholder="admin"
                      />
                    </div>
                    {form4.formState.errors.username && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{form4.formState.errors.username.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Personal Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                      <input
                        type="password"
                        {...form4.register('password')}
                        className={`w-full bg-gray-50 dark:bg-black/20 border ${form4.formState.errors.password ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                        placeholder="••••••••"
                      />
                    </div>
                    {form4.formState.errors.password && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{form4.formState.errors.password.message as string}</p>}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-5 bg-paymint-green text-black font-black text-xl rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={24} /> : null}
                      Complete & Launch
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Success */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl w-full"
            >
              <div className="bg-white dark:bg-white/5 rounded-[3rem] border border-gray-200 dark:border-white/10 p-12 lg:p-16 shadow-2xl text-center">
                <div className="w-24 h-24 bg-paymint-green rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-paymint-green/20">
                  <Check size={48} className="text-black" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">System Ready!</h2>
                <p className="text-gray-600 dark:text-gray-400 text-xl font-medium mb-12">
                  <span className="text-gray-900 dark:text-white font-bold">{formData.name}</span> is now active on the PayMint network.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-white/5 text-left">
                    <div className="w-10 h-10 bg-paymint-green/10 rounded-xl flex items-center justify-center mb-4">
                      <ShieldCheck size={20} className="text-paymint-green" />
                    </div>
                    <h4 className="text-gray-900 dark:text-white font-bold mb-1">Standard Plan</h4>
                    <p className="text-gray-500 text-xs font-medium">Free for 7 days</p>
                  </div>
                  <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-white/5 text-left">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                      <CheckCircle2 size={20} className="text-blue-500" />
                    </div>
                    <h4 className="text-gray-900 dark:text-white font-bold mb-1">Data Isolated</h4>
                    <p className="text-gray-500 text-xs font-medium">Secure encryption</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Find and select the newly created establishment
                    const newEstablishment = establishments.find(e => e.id === formData.establishmentId);
                    if (newEstablishment) {
                      setCurrentEstablishment(newEstablishment);
                    }
                    navigate('/dashboard');
                  }}
                  className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-black font-black text-xl rounded-2xl hover:scale-105 transition-all shadow-xl active:scale-[0.98]"
                >
                  Enter Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
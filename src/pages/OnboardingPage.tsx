import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { TourGuide, type TourStep } from '../components/TourGuide';
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
  Building2,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  KeyRound,
  Hash,
  ShieldCheck,
  Plus,
  ChevronDown,
  Copy,
  Box,
  Tags,
  Eye,
  EyeOff,
  Smartphone,
  Tablet,
  BookOpen,
  Settings,
  PlayCircle,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Shield,
  Scale,
  Info
} from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { QuickInfo } from '../components/QuickInfo';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.svg';
import PaymintLogoWhite from '../assets/white-green-full-logo.svg';

// Step 1: Location Details
const step1Schema = z.object({
  name: z.string().min(1, 'Location name is required'),
  type: z.string().min(1, 'Business type is required'),
  address: z.string().min(1, 'Address is required'),
  currency: z.string().min(1, 'Currency is required'),
});

// Step 2: Payment Method (Mock)
const step2Schema = z.object({
  cardNumber: z.string().min(16, 'Card number must be 16 digits').max(19),
  expiryDate: z.string().min(5, 'Mm/Yy required'),
  cvc: z.string().min(3, 'Cvc required'),
  cardName: z.string().min(1, 'Name on card is required'),
});

// Step 3: Location Login
const step3Schema = z.object({
  establishmentLoginId: z.string()
    .min(4, 'Location ID must be at least 4 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Location ID can only contain letters, numbers, underscores, and hyphens'),
  establishmentPassword: z.string().min(6, 'Location Password must be at least 6 characters'),
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
  const { refreshEstablishments, account, needsOnboarding, setCurrentEstablishment, establishments, updateAccount } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [useSavedCard, setUseSavedCard] = useState(true); // Default to using saved card if available

  // Password Visibility State
  const [showEstablishmentPassword, setShowEstablishmentPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Duplication State
  const [duplicateFromId, setDuplicateFromId] = useState<string>('');
  const [duplicateInventory, setDuplicateInventory] = useState(true);
  const [duplicateDiscounts, setDuplicateDiscounts] = useState(true);
  const [duplicatePaymentMethods, setDuplicatePaymentMethods] = useState(true);

  // Tour Guide State for Step 5
  const [isTourOpen, setIsTourOpen] = useState(false);

  const launchCenterTourSteps: TourStep[] = [
    {
      targetId: 'tour-open-portal',
      title: '🚀 Open Owner Portal',
      description: 'This is your main command center. Click here to open your Owner Portal in a new browser tab where you can manage employees, menu items, view analytics, and handle billing.'
    },
    {
      targetId: 'tour-pos-app',
      title: '📱 POS App for Staff',
      description: 'Your staff will use this app on tablets or phones to take orders and process payments. Download it from Google Play or App Store and install on your POS devices.'
    },
    {
      targetId: 'tour-owner-app',
      title: '👤 Owner App',
      description: 'Take your business management mobile! This app gives you the same portal features on your phone. Monitor sales, check reports, and manage on the go.'
    },
    {
      targetId: 'tour-location-stats',
      title: '📍 Your Location Info',
      description: 'Quick reference for your Location ID and Currency. You will need the Location ID when logging into the POS app. Keep this handy for your staff.'
    },
    {
      targetId: 'tour-resources',
      title: '📚 Resources & Help',
      description: 'Everything you need to succeed: User Manuals, Setup Guides, Video Tutorials, FAQs, and Legal documents. Check here if you need help getting started.'
    }
  ];

  // Auto-start tour when reaching Step 5
  useEffect(() => {
    if (step === 5) {
      // Small delay to let the UI render before starting tour
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Determine if this is a Trial (first est) or Paid (additional est) flow
  const isTrialFlow = needsOnboarding;

  // Check if user has a saved payment method
  // If user has existing establishments, they must have a payment method on file
  const hasSavedCard = !!account?.defaultCardId || !!account?.defaultPaymentMethod || establishments.length > 0;
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

  // Format expiry date (Mm/Yy)
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Format Cvc (max 4 digits)
  const formatCVC = (value: string) => {
    return value.replace(/[^0-9]/gi, '').substring(0, 4);
  };

  const onStep1Submit = (data: any) => {
    // Save duplication preferences
    setFormData((prev: any) => ({
      ...prev,
      ...data,
      duplicateFromId,
      duplicateInventory: duplicateFromId ? duplicateInventory : false,
      duplicateDiscounts: duplicateFromId ? duplicateDiscounts : false,
      duplicatePaymentMethods: duplicateFromId ? duplicatePaymentMethods : false,
    }));

    setStep(2);
  };

  const onStep2Submit = async (data: any) => {
    // Handle payment method
    if (hasSavedCard && useSavedCard) {
      // Use existing saved card - no need to update
      setFormData((prev: any) => ({
        ...prev,
        paymentMethodToken: 'use_saved_card',
        useSavedCard: true,
        savedCardId: account?.defaultCardId // Ensure we capture the existing default card ID
      }));
    } else {
      // New card - save the card to the account
      const cardNumber = data.cardNumber?.replace(/\s/g, '') || '';
      const last4Digits = cardNumber.slice(-4);
      const expiry = data.expiryDate || '';
      const [expMonthStr, expYearStr] = expiry.split('/');
      const expMonth = parseInt(expMonthStr, 10);
      const expYear = parseInt('20' + expYearStr, 10); // Assume 20XX

      // Simple brand detection
      let brand = 'Unknown';
      if (cardNumber.startsWith('4')) brand = 'Visa';
      else if (cardNumber.startsWith('5')) brand = 'Mastercard';
      else if (cardNumber.startsWith('3')) brand = 'Amex';

      try {
        // Save the card to the account
        const response = await api.post('/api/accounts/cards', {
          last4: last4Digits,
          brand: brand,
          expMonth: expMonth,
          expYear: expYear,
          cardholderName: data.cardName,
          setAsDefault: true
        });

        const newCardId = response.data.card?.id;
        const newDefaultPaymentMethod = response.data.card?.last4 || last4Digits;

        // Update local account state
        if (newCardId) {
          updateAccount({
            defaultCardId: newCardId,
            defaultPaymentMethod: newDefaultPaymentMethod // For legacy/UI compatibility
          });
        }

        // Save for next step
        setFormData((prev: any) => ({
          ...prev,
          paymentMethodToken: 'tok_mock_' + Date.now(),
          useSavedCard: false,
          savedCardId: newCardId
        }));

      } catch (err: any) {
        console.error('Failed to save payment method:', err);
        toast.error('Failed to save card. Please try again.');
        return; // Stop execution if card save fails
      }
    }

    // Always show Step 3 - each establishment gets its own unique Owner Pos Id
    setStep(3);
  };

  const onStep3Submit = (data: any) => {
    // Store Owner Pos credentials locally for this establishment
    // Each establishment gets its own unique Owner Pos Id
    setFormData((prev: any) => ({ ...prev, ...data }));
    setStep(4);
  };


  const onStep4Submit = async (data: any) => {
    setIsLoading(true);
    try {
      // 1. Create Establishment with user-provided Establishment Login ID
      const establishmentPayload = {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        currency: formData.currency,
        establishmentLoginId: formData.establishmentLoginId, // User-provided unique ID for this establishment
        establishmentPassword: formData.establishmentPassword, // User-provided password
        paymentMethodToken: formData.paymentMethodToken,
        savedCardId: formData.savedCardId,
        // Duplication params
        duplicateFromId: formData.duplicateFromId,
        duplicateInventory: formData.duplicateInventory,
        duplicateDiscounts: formData.duplicateDiscounts,
        duplicatePaymentMethods: formData.duplicatePaymentMethods,
      };

      const estRes = await api.post('/api/establishments', establishmentPayload);
      const estId = estRes.data.establishment?.id || estRes.data.id;

      if (!estId) {
        throw new Error('Failed to get establishment Id');
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

  // Clear currentEstablishment on mount to prevent 'X-Establishment-Id' errors during onboarding
  useEffect(() => {
    const isNewOnboarding = step === 1;
    if (isNewOnboarding) {
      console.log('[Onboarding] Clearing currentEstablishment to prevent header errors');
      sessionStorage.removeItem('currentEstablishment');
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col transition-colors duration-300">
      {/* Navbar - Hidden on Step 5 (Launch Center) */}
      {step !== 5 && (
        <div className="sticky top-0 z-50 p-6 flex justify-between items-center border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#050505] shadow-sm">
          <div className="flex items-center">
            <img
              src={PaymintLogoGreen}
              alt="PayMint"
              className="h-8 w-auto object-contain dark:hidden"
            />
            <img
              src={PaymintLogoWhite}
              alt="PayMint"
              className="h-8 w-auto object-contain hidden dark:block"
            />
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
              <span className="text-xs font-black text-gray-400 tracking-widest">STEP {step} OF {totalSteps}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">

          {/* STEP 1: Location Details */}
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
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Location Setup</h2>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Add your first location.</p>
                </div>

                <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 tracking-widest ml-1 flex items-center">
                        Location Name <span className="text-paymint-red mx-1">*</span>
                        <QuickInfo text="The name of your business." />
                      </label>
                      <div className="relative group">
                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                        <input
                          type="text"
                          {...form1.register('name')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${form1.formState.errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="e.g. The Coffee House"
                        />
                      </div>
                      {form1.formState.errors.name && <p className="text-paymint-red text-xs font-bold text-gray-500 mt-1 ml-1">{form1.formState.errors.name.message as string}</p>}
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 tracking-widest ml-1 flex items-center">
                        Business Type
                        <QuickInfo text="Select your business type." />
                      </label>
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
                            <span className="text-xs font-black tracking-widest">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Base Currency Row */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 tracking-widest ml-1 flex items-center">
                        CURRENCY <span className="text-paymint-red mx-1">*</span>
                        <QuickInfo text="Primary currency for sales." />
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select
                          {...form1.register('currency')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${form1.formState.errors.currency ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all appearance-none`}
                        >
                          <option value="JOD">JOD - Jordanian Dinar</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="AED">AED - UAE Dirham</option>
                          <option value="SAR">SAR - Saudi Riyal</option>
                          <option value="KWD">KWD - Kuwaiti Dinar</option>
                          <option value="QAR">QAR - Qatari Riyal</option>
                          <option value="BHD">BHD - Bahraini Dinar</option>
                          <option value="OMR">OMR - Omani Rial</option>
                          <option value="EGP">EGP - Egyptian Pound</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="TRY">TRY - Turkish Lira</option>
                        </select>
                      </div>
                      {form1.formState.errors.currency && <p className="text-paymint-red text-xs font-bold text-gray-500 mt-1 ml-1">{form1.formState.errors.currency.message as string}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 tracking-widest ml-1 flex items-center">
                        ADDRESS <span className="text-paymint-red mx-1">*</span>
                        <QuickInfo text="Location address." />
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          {...form1.register('address')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${form1.formState.errors.address ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="City, Area, Building"
                        />
                      </div>
                      {form1.formState.errors.address && <p className="text-paymint-red text-xs font-bold text-gray-500 mt-1 ml-1">{form1.formState.errors.address.message as string}</p>}
                    </div>

                    {/* Import Settings Section - Only show if user has existing establishments */}
                    {establishments.length > 0 && (
                      <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                          <Copy className="text-paymint-green" size={20} />
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">Quick Setup</h3>
                        </div>

                        <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-5 border border-gray-100 dark:border-white/5">
                          <label className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center">
                            COPY SETTINGS
                            <QuickInfo text="Copy menu from another location." />
                          </label>
                          <div className="relative mb-4">
                            <select
                              value={duplicateFromId}
                              onChange={(e) => setDuplicateFromId(e.target.value)}
                              className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 appearance-none"
                            >
                              <option value="">Do not import (Start fresh)</option>
                              {establishments.map((est) => (
                                <option key={est.id} value={est.id}>
                                  {est.name} ({est.type})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                          </div>

                          {/* Checkboxes - Only show if an establishment is selected */}
                          <AnimatePresence>
                            {duplicateFromId && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3 overflow-hidden"
                              >
                                <p className="text-xs font-black text-gray-400 tracking-widest mb-2">Select Data To Duplicate:</p>

                                {/* Inventory Checkbox */}
                                <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${duplicateInventory ? 'border-paymint-green bg-paymint-green/5' : 'border-gray-200 dark:border-white/10 hover:border-gray-300'}`}>
                                  <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 transition-colors ${duplicateInventory ? 'bg-paymint-green text-black' : 'bg-gray-200 dark:bg-white/10'}`}>
                                    {duplicateInventory && <Check size={14} strokeWidth={4} />}
                                  </div>
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={duplicateInventory}
                                    onChange={(e) => setDuplicateInventory(e.target.checked)}
                                  />
                                  <div className="flex-1 flex items-center gap-2">
                                    <Box size={16} className={duplicateInventory ? 'text-paymint-green' : 'text-gray-400'} />
                                    <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">Menu</p>
                                      <p className="text-xs font-bold text-gray-500">Items & categories</p>
                                    </div>
                                  </div>
                                </label>

                                {/* Discounts Checkbox */}
                                <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${duplicateDiscounts ? 'border-paymint-green bg-paymint-green/5' : 'border-gray-200 dark:border-white/10 hover:border-gray-300'}`}>
                                  <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 transition-colors ${duplicateDiscounts ? 'bg-paymint-green text-black' : 'bg-gray-200 dark:bg-white/10'}`}>
                                    {duplicateDiscounts && <Check size={14} strokeWidth={4} />}
                                  </div>
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={duplicateDiscounts}
                                    onChange={(e) => setDuplicateDiscounts(e.target.checked)}
                                  />
                                  <div className="flex-1 flex items-center gap-2">
                                    <Tags size={16} className={duplicateDiscounts ? 'text-paymint-green' : 'text-gray-400'} />
                                    <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">Discounts</p>
                                      <p className="text-xs font-bold text-gray-500">Promo codes and discount rules</p>
                                    </div>
                                  </div>
                                </label>

                                {/* Payment Methods Checkbox */}
                                <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${duplicatePaymentMethods ? 'border-paymint-green bg-paymint-green/5' : 'border-gray-200 dark:border-white/10 hover:border-gray-300'}`}>
                                  <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 transition-colors ${duplicatePaymentMethods ? 'bg-paymint-green text-black' : 'bg-gray-200 dark:bg-white/10'}`}>
                                    {duplicatePaymentMethods && <Check size={14} strokeWidth={4} />}
                                  </div>
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={duplicatePaymentMethods}
                                    onChange={(e) => setDuplicatePaymentMethods(e.target.checked)}
                                  />
                                  <div className="flex-1 flex items-center gap-2">
                                    <CreditCard size={16} className={duplicatePaymentMethods ? 'text-paymint-green' : 'text-gray-400'} />
                                    <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">Payment Methods</p>
                                      <p className="text-xs font-bold text-gray-500">Card types and custom payment options</p>
                                    </div>
                                  </div>
                                </label>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-5 bg-paymint-green text-black text-xs font-black tracking-widest rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      NEXT STEP
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
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 text-xs font-black tracking-widest">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isTrialFlow ? 'bg-yellow-400/10' : 'bg-paymint-green/10'}`}>
                      <ShieldCheck className={isTrialFlow ? 'text-yellow-500' : 'text-paymint-green'} size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isTrialFlow ? 'Start Free Trial' : 'Activate Subscription'}
                      </h2>
                      {isTrialFlow ? (
                        <span className="bg-yellow-400 text-black text-xs font-black tracking-widest px-2 py-0.5 rounded">7 DAYS FREE</span>
                      ) : (
                        <span className="bg-paymint-green text-black text-xs font-black tracking-widest px-2 py-0.5 rounded">$20/MONTH</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                    {isTrialFlow
                      ? "You won't be charged today. Cancel anytime before your trial ends."
                      : "Your card will be charged $20.00 for this new location."
                    }
                  </p>
                </div>

                <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-6">
                  <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black text-gray-400 tracking-widest">Total Due Today</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{isTrialFlow ? '$0.00' : '$20.00'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
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
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Use Saved Card</p>
                            <p className="text-xs font-bold text-gray-500">•••• •••• •••• {savedCardLast4}</p>
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
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Add New Card</p>
                            <p className="text-xs font-bold text-gray-500">Use a different payment method</p>
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
                        <label className="text-xs font-black text-gray-400 tracking-widest ml-1">Card Number</label>
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
                            className={`w-full bg-gray-100 dark:bg-black/20 border ${form2.formState.errors.cardNumber ? 'border-paymint-red' : 'border-gray-200 dark:border-white/10'} rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50`}
                          />
                        </div>
                        {form2.formState.errors.cardNumber && <p className="text-paymint-red text-xs font-bold text-gray-500 mt-1 ml-1">{form2.formState.errors.cardNumber.message as string}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 tracking-widest ml-1">Expiry</label>
                          <input
                            type="text"
                            {...form2.register('expiryDate')}
                            onChange={(e) => {
                              const formatted = formatExpiryDate(e.target.value);
                              form2.setValue('expiryDate', formatted);
                            }}
                            maxLength={5}
                            placeholder="Mm/Yy"
                            className={`w-full bg-gray-100 dark:bg-black/20 border ${form2.formState.errors.expiryDate ? 'border-paymint-red' : 'border-gray-200 dark:border-white/10'} rounded-xl py-4 px-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 text-center`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 tracking-widest ml-1">CVC</label>
                          <input
                            type="text"
                            {...form2.register('cvc')}
                            onChange={(e) => {
                              const formatted = formatCVC(e.target.value);
                              form2.setValue('cvc', formatted);
                            }}
                            maxLength={4}
                            placeholder="123"
                            className={`w-full bg-gray-100 dark:bg-black/20 border ${form2.formState.errors.cvc ? 'border-paymint-red' : 'border-gray-200 dark:border-white/10'} rounded-xl py-4 px-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 text-center`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 tracking-widest ml-1">Cardholder Name</label>
                        <input
                          type="text"
                          {...form2.register('cardName')}
                          placeholder="John Doe"
                          className={`w-full bg-gray-100 dark:bg-black/20 border ${form2.formState.errors.cardName ? 'border-paymint-red' : 'border-gray-200 dark:border-white/10'} rounded-xl py-4 px-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50`}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type={hasSavedCard && useSavedCard ? 'button' : 'submit'}
                      onClick={hasSavedCard && useSavedCard ? () => onStep2Submit({}) : undefined}
                      className="w-full py-5 bg-paymint-green text-black text-xs font-black tracking-widest rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      {isTrialFlow ? 'Start Free Trial' : 'Activate & Pay $20'}
                      <ArrowRight size={24} />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Location Login Details */}
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
                  <button onClick={() => setStep(2)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 text-xs font-black tracking-widest">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Create Location Login</h2>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300">This ID is for the POS app.</p>
                  <div className="mt-4 p-3 bg-paymint-green/10 text-paymint-green text-sm rounded-xl font-bold border border-paymint-green/20">
                    <p>✨ <strong>Unique access:</strong> Each location needs its own Id and password.</p>
                  </div>
                </div>

                <form onSubmit={form3.handleSubmit(onStep3Submit)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 tracking-widest ml-1 flex items-center">
                      LOCATION ID <span className="text-paymint-red mx-1">*</span>
                      <QuickInfo text="Unique ID for POS login." />
                    </label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                      <input
                        type="text"
                        {...form3.register('establishmentLoginId')}
                        className={`w-full bg-gray-50 dark:bg-black/20 border ${form3.formState.errors.establishmentLoginId ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                        placeholder="e.g. mycompany-downtown"
                      />
                    </div>
                    {form3.formState.errors.establishmentLoginId && <p className="text-paymint-red text-xs font-bold text-gray-500 mt-1 ml-1">{form3.formState.errors.establishmentLoginId.message as string}</p>}
                    <p className="text-xs font-bold text-gray-500 ml-1">Unique ID for this location.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 tracking-widest ml-1 flex items-center">
                      Location Password <span className="text-paymint-red mx-1">*</span>
                      <QuickInfo text="Password for this location." />
                    </label>
                    <div className="relative group">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                      <input
                        type={showEstablishmentPassword ? "text" : "password"}
                        {...form3.register('establishmentPassword')}
                        className={`w-full bg-gray-50 dark:bg-black/20 border ${form3.formState.errors.establishmentPassword ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEstablishmentPassword(!showEstablishmentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        {showEstablishmentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {form3.formState.errors.establishmentPassword && <p className="text-paymint-red text-xs font-bold text-gray-500 mt-1 ml-1">{form3.formState.errors.establishmentPassword.message as string}</p>}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-5 bg-paymint-green text-black text-xs font-black tracking-widest rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      NEXT STEP
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
                  <button onClick={() => setStep(3)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 text-xs font-black tracking-widest">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Create Your Login</h2>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Create your personal account.</p>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded-xl font-bold border border-blue-100 dark:border-blue-900/30">
                    <p>This is Step 2 of the POS Login.</p>
                  </div>
                </div>

                <form onSubmit={form4.handleSubmit(onStep4Submit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 tracking-widest ml-1">
                        FIRST NAME <span className="text-paymint-red">*</span>
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                        <input
                          type="text"
                          {...form4.register('firstName')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${form4.formState.errors.firstName ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="John"
                        />
                      </div>
                      {form4.formState.errors.firstName && <p className="text-paymint-red text-xs font-bold text-gray-500 mt-1 ml-1">{form4.formState.errors.firstName.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 tracking-widest ml-1">
                        LAST NAME <span className="text-paymint-red">*</span>
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                        <input
                          type="text"
                          {...form4.register('lastName')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${form4.formState.errors.lastName ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="Doe"
                        />
                      </div>
                      {form4.formState.errors.lastName && <p className="text-paymint-red text-xs font-bold text-gray-500 mt-1 ml-1">{form4.formState.errors.lastName.message as string}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 tracking-widest ml-1 flex items-center">
                      Admin Username <span className="text-paymint-red mx-1">*</span>
                      <QuickInfo text="Your username." />
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                      <input
                        type="text"
                        {...form4.register('username')}
                        className={`w-full bg-gray-50 dark:bg-black/20 border ${form4.formState.errors.username ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                        placeholder="admin"
                      />
                    </div>
                    {form4.formState.errors.username && <p className="text-paymint-red text-xs font-bold text-gray-500 mt-1 ml-1">{form4.formState.errors.username.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 tracking-widest ml-1 flex items-center">
                      Personal Password <span className="text-paymint-red mx-1">*</span>
                      <QuickInfo text="Your unique password." />
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                      <input
                        type={showAdminPassword ? "text" : "password"}
                        {...form4.register('password')}
                        className={`w-full bg-gray-50 dark:bg-black/20 border ${form4.formState.errors.password ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        {showAdminPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {form4.formState.errors.password && <p className="text-paymint-red text-xs font-bold text-gray-500 mt-1 ml-1">{form4.formState.errors.password.message as string}</p>}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-5 bg-paymint-green text-black text-xs font-black tracking-widest rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={24} /> : null}
                      COMPLETE & LAUNCH
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Launch Center - Redesigned */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-7xl px-4"
            >
              {/* Top Hero Bar */}
              <div className="relative mb-6">
                <div className="absolute -inset-1 bg-gradient-to-r from-paymint-green/30 via-paymint-green/10 to-transparent rounded-[2rem] blur-xl opacity-60" />
                <div className="relative bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-3xl p-6 lg:p-8 overflow-hidden">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    {/* Left: Welcome Message */}
                    <div className="flex items-center gap-5">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-paymint-green to-emerald-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-paymint-green/40"
                      >
                        <Sparkles size={32} className="text-black" />
                      </motion.div>
                      <div>
                        <motion.h2 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white"
                        >
                          Welcome to PayMint!
                        </motion.h2>
                        <motion.p 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          className="text-gray-500 dark:text-gray-400 mt-1"
                        >
                          <span className="text-paymint-green font-bold">{formData.name}</span> is ready to go
                        </motion.p>
                      </div>
                    </div>

                    {/* Right: CTA Button */}
                    <motion.div
                      id="tour-open-portal"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="relative"
                    >
                      {/* Animated pulse ring */}
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-paymint-green rounded-2xl"
                      />

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const newEstablishment = establishments.find(e => e.id === formData.establishmentId);
                          if (newEstablishment) {
                            setCurrentEstablishment(newEstablishment);
                          }
                          window.open(`/owner/establishments?highlight=${formData.establishmentId}`, '_blank');
                        }}
                        className="relative flex items-center gap-3 bg-paymint-green text-black px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-paymint-green/30"
                      >
                        <Building2 size={24} />
                        Open Owner Portal
                        <ExternalLink size={20} />
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Download Apps (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* POS App */}
                  <motion.div 
                    id="tour-pos-app"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Tablet size={28} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">POS App</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">For your staff to take orders & payments</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href="https://play.google.com/store/apps/details?id=com.paymint.pos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl text-xs font-bold transition-colors border border-white/10"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" />
                        </svg>
                        Play Store
                      </a>
                      <a
                        href="https://apps.apple.com/app/paymint-pos/id0000000000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl text-xs font-bold transition-colors border border-white/10"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        App Store
                      </a>
                    </div>
                  </motion.div>

                  {/* Owner App */}
                  <motion.div 
                    id="tour-owner-app"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Smartphone size={28} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Owner App</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage on the go from your phone</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href="https://play.google.com/store/apps/details?id=com.paymint.owner"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl text-xs font-bold transition-colors border border-white/10"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" />
                        </svg>
                        Play Store
                      </a>
                      <a
                        href="https://apps.apple.com/app/paymint-owner/id0000000001"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl text-xs font-bold transition-colors border border-white/10"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        App Store
                      </a>
                    </div>
                  </motion.div>

                  {/* Quick Stats */}
                  <motion.div 
                    id="tour-location-stats"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-[#151515] border border-white/10 rounded-2xl p-4 text-white"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-white/5 mb-3">
                      <div className="w-10 h-10 bg-paymint-green/20 rounded-xl flex items-center justify-center">
                        <Building2 size={20} className="text-paymint-green" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Location Ready</h3>
                        <p className="text-xs text-gray-500">Your setup is complete</p>
                      </div>
                    </div>
                    
                    {/* Location ID Row */}
                    <div className="flex items-center gap-3 py-2.5 border-b border-white/5">
                      <Hash size={16} className="text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Location ID</p>
                        <p className="font-mono text-paymint-green text-sm truncate">{formData.establishmentLoginId}</p>
                      </div>
                    </div>
                    
                    {/* Currency Row */}
                    <div className="flex items-center gap-3 py-2.5">
                      <DollarSign size={16} className="text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Currency</p>
                        <p className="text-white font-bold text-sm">{formData.currency}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Right Column: Resources Grid (7 cols) */}
                <div className="lg:col-span-7">
                  <motion.div 
                    id="tour-resources"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 h-full"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <BookOpen size={20} className="text-emerald-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Resources & Help</h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {/* User Manual */}
                      <a
                        href="/docs/paymint-user-manual.md"
                        download="Paymint_User_Manual.md"
                        className="group p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl hover:border-paymint-green/50 hover:bg-paymint-green/5 transition-all"
                      >
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <BookOpen size={20} className="text-blue-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">User Manual</h4>
                        <p className="text-xs text-gray-500 mt-1">Complete guide</p>
                      </a>

                      {/* Setup Manual */}
                      <a
                        href="/docs/paymint-setup-manual.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl hover:border-paymint-green/50 hover:bg-paymint-green/5 transition-all"
                      >
                        <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Settings size={20} className="text-amber-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Setup Manual</h4>
                        <p className="text-xs text-gray-500 mt-1">Hardware setup</p>
                      </a>

                      {/* Video Tutorial */}
                      <a
                        href="https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl hover:border-paymint-green/50 hover:bg-paymint-green/5 transition-all"
                      >
                        <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <PlayCircle size={20} className="text-red-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Video Guide</h4>
                        <p className="text-xs text-gray-500 mt-1">7-min start</p>
                      </a>

                      {/* Q&A Center */}
                      <a
                        href="/qa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl hover:border-paymint-green/50 hover:bg-paymint-green/5 transition-all"
                      >
                        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <HelpCircle size={20} className="text-purple-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Q&A Center</h4>
                        <p className="text-xs text-gray-500 mt-1">FAQs</p>
                      </a>

                      {/* Privacy */}
                      <a
                        href="/legal/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl hover:border-paymint-green/50 hover:bg-paymint-green/5 transition-all"
                      >
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Shield size={20} className="text-emerald-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Privacy</h4>
                        <p className="text-xs text-gray-500 mt-1">Data protection</p>
                      </a>

                      {/* Terms */}
                      <a
                        href="/legal/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl hover:border-paymint-green/50 hover:bg-paymint-green/5 transition-all"
                      >
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Scale size={20} className="text-blue-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Terms</h4>
                        <p className="text-xs text-gray-500 mt-1">Agreement</p>
                      </a>

                      {/* About - spans 2 cols on sm */}
                      <a
                        href="/about"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl hover:border-paymint-green/50 hover:bg-paymint-green/5 transition-all col-span-2 sm:col-span-1"
                      >
                        <div className="w-10 h-10 bg-paymint-green/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Info size={20} className="text-paymint-green" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">About Us</h4>
                        <p className="text-xs text-gray-500 mt-1">Our story</p>
                      </a>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-center"
              >
                <p className="text-sm text-gray-500">
                  Need help? <a href="mailto:support@paymint.com" className="text-paymint-green font-bold hover:underline">support@paymint.com</a>
                </p>
              </motion.div>

              {/* Tour Guide */}
              <TourGuide
                steps={launchCenterTourSteps}
                isOpen={isTourOpen}
                onClose={() => setIsTourOpen(false)}
                onComplete={() => setIsTourOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

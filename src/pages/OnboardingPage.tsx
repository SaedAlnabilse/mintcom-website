import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  MapPin,
  Phone,
  DollarSign,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const establishmentTypes = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'cafe', label: 'Cafe / Coffee Shop', icon: '☕' },
  { value: 'bar', label: 'Bar / Nightclub', icon: '🍸' },
  { value: 'fast_food', label: 'Fast Food', icon: '🍔' },
  { value: 'food_truck', label: 'Food Truck', icon: '🚚' },
  { value: 'bakery', label: 'Bakery', icon: '🥐' },
  { value: 'retail', label: 'Retail Store', icon: '🏪' },
  { value: 'other', label: 'Other', icon: '🏢' },
];

const currencies = [
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
  { value: 'AED', label: 'UAE Dirham (AED)', symbol: 'AED' },
  { value: 'SAR', label: 'Saudi Riyal (SAR)', symbol: 'SAR' },
  { value: 'EGP', label: 'Egyptian Pound (EGP)', symbol: 'EGP' },
  { value: 'LBP', label: 'Lebanese Pound (LBP)', symbol: 'LBP' },
  { value: 'JOD', label: 'Jordanian Dinar (JOD)', symbol: 'JOD' },
];

const step1Schema = z.object({
  name: z.string().min(2, 'Establishment name is required'),
  type: z.string().min(1, 'Please select a type'),
  address: z.string().optional(),
  phone: z.string().optional(),
  currency: z.string().min(1, 'Please select a currency'),
});

const step2Schema = z.object({
  ownerPosId: z
    .string()
    .min(4, 'POS ID must be at least 4 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, underscores, and hyphens allowed'),
  ownerPosPassword: z
    .string()
    .min(4, 'POS password must be at least 4 characters'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { account, refreshEstablishments } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPosPassword, setShowPosPassword] = useState(false);

  // Store data from each step
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      currency: 'USD',
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
  });

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2Submit = async (data: Step2Data) => {
    if (!step1Data) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accountToken');
      const response = await api.post(
        '/api/establishments',
        {
          ...step1Data,
          ownerPosId: data.ownerPosId,
          ownerPosPassword: data.ownerPosPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        await refreshEstablishments();
        toast.success('Your establishment is ready!');
        setCurrentStep(3);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create establishment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  const steps = [
    { number: 1, title: 'Business Info', icon: Store },
    { number: 2, title: 'POS Credentials', icon: Lock },
    { number: 3, title: 'All Set!', icon: Check },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            Pay<span className="text-green-500">Mint</span>
          </h1>
          <p className="text-sm text-gray-400">
            Welcome, {account?.firstName}!
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-12">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  currentStep >= step.number
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-600 text-gray-600'
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-white' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Business Information */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-gray-800 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Tell us about your business
                </h2>
                <p className="text-gray-400 mb-8">
                  This information helps us customize PayMint for your needs.
                </p>

                <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Establishment Name *
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...step1Form.register('name')}
                        type="text"
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., The Coffee House"
                      />
                    </div>
                    {step1Form.formState.errors.name && (
                      <p className="text-red-400 text-sm mt-1">
                        {step1Form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Business Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {establishmentTypes.map((type) => (
                        <label
                          key={type.value}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            step1Form.watch('type') === type.value
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <input
                            {...step1Form.register('type')}
                            type="radio"
                            value={type.value}
                            className="hidden"
                          />
                          <span className="text-xl">{type.icon}</span>
                          <span className="text-sm text-white">{type.label}</span>
                        </label>
                      ))}
                    </div>
                    {step1Form.formState.errors.type && (
                      <p className="text-red-400 text-sm mt-1">
                        {step1Form.formState.errors.type.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Address (Optional)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...step1Form.register('address')}
                        type="text"
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="123 Main Street"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          {...step1Form.register('phone')}
                          type="tel"
                          className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="+1 555-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Currency *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          {...step1Form.register('currency')}
                          className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                        >
                          {currencies.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>

              {/* Trial Info */}
              <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">7-Day Free Trial</h4>
                    <p className="text-gray-400 text-sm">
                      Try all features free for 7 days. No credit card required to start.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: POS Credentials */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-gray-800 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Create your POS credentials
                </h2>
                <p className="text-gray-400 mb-8">
                  These credentials will be used to log into the POS app on tablets and phones.
                </p>

                <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Owner POS ID *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...step2Form.register('ownerPosId')}
                        type="text"
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., owner123"
                      />
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      This is your unique ID to log into the POS app
                    </p>
                    {step2Form.formState.errors.ownerPosId && (
                      <p className="text-red-400 text-sm mt-1">
                        {step2Form.formState.errors.ownerPosId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      POS Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...step2Form.register('ownerPosPassword')}
                        type={showPosPassword ? 'text' : 'password'}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 pl-10 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Create a POS password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPosPassword(!showPosPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPosPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      This can be a simple PIN or password for quick POS access
                    </p>
                    {step2Form.formState.errors.ownerPosPassword && (
                      <p className="text-red-400 text-sm mt-1">
                        {step2Form.formState.errors.ownerPosPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">How POS Login Works</h4>
                    <ol className="text-gray-400 text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          1
                        </span>
                        Staff opens the POS app on any device
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          2
                        </span>
                        They select your establishment from the list
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          3
                        </span>
                        They enter their POS ID and password to clock in
                      </li>
                    </ol>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Establishment
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-gray-800 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  You're All Set!
                </h2>
                <p className="text-gray-400 mb-8">
                  Your establishment <span className="text-white font-medium">{step1Data?.name}</span> is
                  ready. Your 7-day free trial has started.
                </p>

                <div className="bg-gray-700/50 rounded-xl p-6 mb-8 text-left">
                  <h3 className="text-white font-semibold mb-4">What's Next?</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-500 text-sm font-bold">1</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Add your menu items</p>
                        <p className="text-gray-400 text-sm">
                          Create categories and products in the dashboard
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-500 text-sm font-bold">2</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Invite your staff</p>
                        <p className="text-gray-400 text-sm">
                          Create employee accounts with different roles
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-500 text-sm font-bold">3</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Download the POS app</p>
                        <p className="text-gray-400 text-sm">
                          Available on iOS and Android for tablets and phones
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

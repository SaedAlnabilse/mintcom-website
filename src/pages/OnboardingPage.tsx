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
  Hash
} from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const step1Schema = z.object({
  name: z.string().min(1, 'Establishment name is required'),
  type: z.string().min(1, 'Business type is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  currency: z.string().min(1, 'Currency is required'),
  ownerPosId: z.string()
    .min(4, 'POS ID must be at least 4 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'POS ID can only contain letters, numbers, underscores, and hyphens'),
  ownerPosPassword: z.string().min(6, 'POS Password must be at least 6 characters'),
});

const step2Schema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshEstablishments, account } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [step1Data, setStep1Data] = useState<any>(null);

  const { register: register1, handleSubmit: handleSubmit1, formState: { errors: errors1 } } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { currency: 'JOD', type: 'restaurant' }
  });

  const { register: register2, handleSubmit: handleSubmit2, formState: { errors: errors2 } } = useForm({
    resolver: zodResolver(step2Schema)
  });

  const onStep1Submit = (data: any) => {
    setStep1Data(data);
    setStep(2);
  };

  const onStep2Submit = async (data: any) => {
    setIsLoading(true);
    try {
      // Create Establishment
      const estRes = await api.post('/api/establishments', step1Data);
      // The API returns { success: true, establishment: { id, ... } }
      const estId = estRes.data.establishment?.id || estRes.data.id;

      if (!estId) {
        throw new Error('Failed to get establishment ID');
      }

      // Create Admin Employee for this Establishment
      await api.post('/api/employees', {
        username: data.username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        email: account?.email,
        establishmentId: estId,
        role: 'ADMIN',
        permissions: [],
        allowedDiscounts: []
      });

      setStep(3);
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
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-paymint-green' : 'w-4 bg-gray-200 dark:bg-white/10'
                  }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step} of 3</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
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
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Business Profile</h2>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Tell us about your establishment to get started.</p>
                </div>

                <form onSubmit={handleSubmit1(onStep1Submit)} className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Establishment Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                        <input
                          type="text"
                          {...register1('name')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${errors1.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="e.g. The Coffee House"
                        />
                      </div>
                      {errors1.name && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors1.name.message as string}</p>}
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Business Category</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {businessTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => { }} // Hooked via register
                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${true ? 'border-paymint-green bg-paymint-green/5 text-paymint-green' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-transparent text-gray-400'
                              }`}
                          >
                            <type.icon size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="tel"
                            {...register1('phone')}
                            className={`w-full bg-gray-50 dark:bg-black/20 border ${errors1.phone ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                            placeholder="07XXXXXXXX"
                          />
                        </div>
                        {errors1.phone && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors1.phone.message as string}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                          Base Currency <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                          <select
                            {...register1('currency')}
                            className={`w-full bg-gray-50 dark:bg-black/20 border ${errors1.currency ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all appearance-none`}
                          >
                            <option value="JOD">JOD - Jordanian Dinar</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="AED">AED - UAE Dirham</option>
                          </select>
                        </div>
                        {errors1.currency && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors1.currency.message as string}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Location Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          {...register1('address')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${errors1.address ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="City, Area, Building"
                        />
                      </div>
                      {errors1.address && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors1.address.message as string}</p>}
                    </div>

                    {/* POS Credentials Section */}
                    <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">POS Access Credentials</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">These credentials are used to log in to the POS app on your devices.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                            POS ID <span className="text-red-500">*</span>
                          </label>
                          <div className="relative group">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                            <input
                              type="text"
                              {...register1('ownerPosId')}
                              className={`w-full bg-gray-50 dark:bg-black/20 border ${errors1.ownerPosId ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                              placeholder="e.g. coffeehouse01"
                            />
                          </div>
                          {errors1.ownerPosId && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors1.ownerPosId.message as string}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                            POS Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative group">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                            <input
                              type="password"
                              {...register1('ownerPosPassword')}
                              className={`w-full bg-gray-50 dark:bg-black/20 border ${errors1.ownerPosPassword ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                              placeholder="••••••••"
                            />
                          </div>
                          {errors1.ownerPosPassword && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors1.ownerPosPassword.message as string}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-5 bg-paymint-green text-black font-black text-xl rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      Next: Setup Admin Access
                      <ArrowRight size={24} />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md w-full"
            >
              <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 lg:p-12 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                <div className="mb-10">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 font-bold text-xs uppercase tracking-widest">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">POS Access</h2>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Create your primary admin login for the point of sale.</p>
                </div>

                <form onSubmit={handleSubmit2(onStep2Submit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                        <input
                          type="text"
                          {...register2('firstName')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${errors2.firstName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="John"
                        />
                      </div>
                      {errors2.firstName && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors2.firstName.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                        <input
                          type="text"
                          {...register2('lastName')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${errors2.lastName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                          placeholder="Doe"
                        />
                      </div>
                      {errors2.lastName && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors2.lastName.message as string}</p>}
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
                        {...register2('username')}
                        className={`w-full bg-gray-50 dark:bg-black/20 border ${errors2.username ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                        placeholder="admin"
                      />
                    </div>
                    {errors2.username && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors2.username.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Master Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                      <input
                        type="password"
                        {...register2('password')}
                        className={`w-full bg-gray-50 dark:bg-black/20 border ${errors2.password ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                        placeholder="••••••••"
                      />
                    </div>
                    {errors2.password && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors2.password.message as string}</p>}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-5 bg-paymint-green text-black font-black text-xl rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={24} /> : null}
                      Complete Setup
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
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
                  <span className="text-gray-900 dark:text-white font-bold">{step1Data?.name}</span> is now active on the PayMint network.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-white/5 text-left">
                    <div className="w-10 h-10 bg-paymint-green/10 rounded-xl flex items-center justify-center mb-4">
                      <CreditCard size={20} className="text-paymint-green" />
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
                  onClick={() => navigate('/dashboard')}
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
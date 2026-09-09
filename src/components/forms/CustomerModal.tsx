import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Phone,
  Mail,
  Award,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { formatInputLabel } from '../../utils/textCase';
import { StatValue } from '../ui/StatValue';

export const CUSTOMER_FIELD_LIMITS = {
  name: 50,
  phone: 20,
  email: 80,
} as const;

export const MAX_POINTS_ADJUSTMENT = 1000000;

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
  tier?: string;
  totalSpent: number;
  totalVisits: number;
  // Still stored server-side for existing records, but no longer collected or
  // displayed: nothing in the product ever read a customer address.
  address?: string;
}

export type CustomerFormData = {
  name: string;
  phone?: string;
  email?: string;
};

const createCustomerSchema = (requiredMessage: string, invalidEmailMessage: string) =>
  z.object({
    name: z.string().trim().min(1, requiredMessage).max(CUSTOMER_FIELD_LIMITS.name),
    phone: z.string().max(CUSTOMER_FIELD_LIMITS.phone).optional().or(z.literal('')),
    email: z.string().email(invalidEmailMessage).max(CUSTOMER_FIELD_LIMITS.email).optional().or(z.literal('')),
  });

export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSaveCustomer: (data: CustomerFormData, customerId?: string) => Promise<boolean | void>;
  onAdjustPoints?: (customerId: string, amount: number, action: 'add' | 'deduct') => Promise<number | void>;
  onDeleteCustomer?: (customer: Customer) => void;
  currencySymbol?: string;
  formatAmount?: (amount: number) => string;
  initialTab?: 'profile' | 'loyalty';
}

export function CustomerModal({
  isOpen,
  onClose,
  customer,
  onSaveCustomer,
  onAdjustPoints,
  onDeleteCustomer,
  currencySymbol = '$',
  initialTab = 'profile',
}: CustomerModalProps) {
  const { t } = useTranslation();
  const isArabic = t('common.locale') === 'ar';
  const isEditing = Boolean(customer);

  const [activeTab, setActiveTab] = useState<'profile' | 'loyalty'>(initialTab);
  const [localPoints, setLocalPoints] = useState<number>(customer?.points || 0);

  // Points adjustment state
  const [pointsAction, setPointsAction] = useState<'add' | 'deduct'>('add');
  const [pointsAmount, setPointsAmount] = useState<number>(0);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [isPointsSubmitting, setIsPointsSubmitting] = useState(false);
  const [pointsSuccessNotice, setPointsSuccessNotice] = useState<string | null>(null);

  // Profile submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customerSchema = useMemo(
    () =>
      createCustomerSchema(
        t('customers.errors.nameRequired', { defaultValue: 'Name is required' }),
        t('customers.errors.invalidEmail', { defaultValue: 'Invalid email address' })
      ),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  // Sync state when modal opens or customer prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setPointsAmount(0);
      setPointsError(null);
      setPointsSuccessNotice(null);
      if (customer) {
        setLocalPoints(customer.points || 0);
        reset({
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
        });
      } else {
        setLocalPoints(0);
        reset({
          name: '',
          phone: '',
          email: '',
        });
      }
    }
  }, [isOpen, customer, reset, initialTab]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting && !isPointsSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, isPointsSubmitting, onClose]);

  // Save profile details
  const onSubmitProfile = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      await onSaveCustomer(data, customer?.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adjust points
  const handlePointsSubmit = async () => {
    if (!customer || !onAdjustPoints) return;
    setPointsError(null);
    setPointsSuccessNotice(null);

    if (pointsAmount <= 0) {
      setPointsError(t('customers.details.pointsAmount', { defaultValue: 'Please enter a valid points amount' }));
      return;
    }

    if (pointsAmount > MAX_POINTS_ADJUSTMENT) {
      setPointsError(t('customers.messages.maxPoints', { max: MAX_POINTS_ADJUSTMENT.toLocaleString() }));
      return;
    }

    if (pointsAction === 'deduct' && pointsAmount > localPoints) {
      setPointsError(t('customers.messages.insufficientPoints', { points: localPoints }));
      return;
    }

    setIsPointsSubmitting(true);
    try {
      const updatedBalance = await onAdjustPoints(customer.id, pointsAmount, pointsAction);
      const newBalance =
        typeof updatedBalance === 'number'
          ? updatedBalance
          : pointsAction === 'add'
          ? localPoints + pointsAmount
          : Math.max(0, localPoints - pointsAmount);

      setLocalPoints(newBalance);
      setPointsSuccessNotice(
        pointsAction === 'add'
          ? `+${pointsAmount.toLocaleString()} ${t('customers.details.points', { defaultValue: 'points' })}`
          : `-${pointsAmount.toLocaleString()} ${t('customers.details.points', { defaultValue: 'points' })}`
      );
      setPointsAmount(0);
      setTimeout(() => setPointsSuccessNotice(null), 3000);
    } catch (err: any) {
      setPointsError(err?.message || t('common.error', { defaultValue: 'Failed to adjust points' }));
    } finally {
      setIsPointsSubmitting(false);
    }
  };

  // Preset chips
  const pointPresets = [25, 50, 100, 250, 500];

  // Projected points calculation
  const projectedBalance = useMemo(() => {
    if (pointsAmount <= 0) return localPoints;
    if (pointsAction === 'add') return localPoints + pointsAmount;
    return Math.max(0, localPoints - pointsAmount);
  }, [localPoints, pointsAmount, pointsAction]);

  // Average spend calculation
  const avgOrderValue = useMemo(() => {
    if (!customer || !customer.totalVisits || customer.totalVisits <= 0) return 0;
    return customer.totalSpent / customer.totalVisits;
  }, [customer]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir={isArabic ? 'rtl' : 'ltr'}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isSubmitting && !isPointsSubmitting) onClose();
          }}
          className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Card - Compact and Sleek */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', duration: 0.25, bounce: 0.05 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 z-10 my-auto flex flex-col"
        >
          {/* Header - Compact */}
          <div className="px-4 py-3.5 sm:px-5 sm:py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-mintcom-green/10 text-mintcom-green border border-mintcom-green/20 flex items-center justify-center font-bold text-sm shrink-0">
                {isEditing ? (
                  customer?.name ? (
                    customer.name.charAt(0).toUpperCase()
                  ) : (
                    <User size={18} />
                  )
                ) : (
                  <Plus size={18} />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate leading-tight">
                  {isEditing ? customer?.name : t('customers.addCustomer')}
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {isEditing
                    ? t('customers.messages.customerProfile', { defaultValue: 'Customer Profile' })
                    : t('customers.form.namePhoneHelper', { defaultValue: 'Name is required, phone is optional.' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isEditing && customer && onDeleteCustomer && (
                <button
                  type="button"
                  onClick={() => onDeleteCustomer(customer)}
                  className="p-1.5 text-gray-400 hover:text-mintcom-red hover:bg-mintcom-red/10 rounded-lg transition-all cursor-pointer"
                  title={t('customers.messages.removeCustomer', { defaultValue: 'Remove Customer' })}
                  aria-label={t('customers.messages.removeCustomer', { defaultValue: 'Remove Customer' })}
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isPointsSubmitting}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                aria-label={t('common.close', { defaultValue: 'Close' })}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar - Compact Single Line */}
          {isEditing && customer && (
            <div className="grid grid-cols-4 gap-1.5 px-4 py-2 sm:px-5 bg-gray-100/50 dark:bg-black/15 border-b border-gray-100 dark:border-white/5 shrink-0">
              <div className="bg-white dark:bg-[#1E293B]/80 rounded-xl p-2 border border-gray-200/70 dark:border-white/5">
                <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                  <Award size={11} className="text-amber-500 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-wider truncate">{t('customers.details.points')}</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">
                  <StatValue value={localPoints} isInteger={true} className="text-xs sm:text-sm" />
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E293B]/80 rounded-xl p-2 border border-gray-200/70 dark:border-white/5">
                <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                  <Wallet size={11} className="text-mintcom-green shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-wider truncate">{t('customers.details.spent')}</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">
                  <StatValue value={customer.totalSpent} currency={currencySymbol} className="text-xs sm:text-sm" />
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E293B]/80 rounded-xl p-2 border border-gray-200/70 dark:border-white/5">
                <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                  <ShoppingBag size={11} className="text-blue-400 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-wider truncate">{t('customers.details.visits')}</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">
                  <StatValue value={customer.totalVisits} isInteger={true} className="text-xs sm:text-sm" />
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E293B]/80 rounded-xl p-2 border border-gray-200/70 dark:border-white/5">
                <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                  <TrendingUp size={11} className="text-purple-400 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-wider truncate">{t('customers.details.avgValue', { defaultValue: 'Avg' })}</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">
                  <StatValue value={avgOrderValue} currency={currencySymbol} className="text-xs sm:text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation (Existing Customer Only) - Compact */}
          {isEditing && (
            <div className="flex border-b border-gray-100 dark:border-white/5 bg-gray-50/40 dark:bg-white/[0.01] px-5 pt-2 gap-4 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-mintcom-green text-mintcom-green'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                <User size={14} />
                <span>{t('customers.details.contactInfo', { defaultValue: 'Profile & Contact' })}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('loyalty')}
                className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'loyalty'
                    ? 'border-mintcom-green text-mintcom-green'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                <Award size={14} />
                <span>{t('customers.details.adjustLoyalty', { defaultValue: 'Loyalty & Points' })}</span>
                <span className="ml-1 px-1.5 py-0.2 bg-mintcom-green/10 text-mintcom-green rounded-full text-[10px] font-bold">
                  {localPoints.toLocaleString()}
                </span>
              </button>
            </div>
          )}

          {/* Content Body - Compact and No Scroll */}
          <div className="p-4 sm:p-5">
            {/* TAB 1: Profile Form */}
            {(!isEditing || activeTab === 'profile') && (
              <form id="customer-profile-form" onSubmit={handleSubmit(onSubmitProfile)} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name Field */}
                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                      <span>{formatInputLabel(t('common.name', { defaultValue: 'Name' }), t('common.locale'))}</span>
                      <span className="text-mintcom-red">*</span>
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        maxLength={CUSTOMER_FIELD_LIMITS.name}
                        {...register('name')}
                        placeholder={t('customers.form.namePlaceholder', { defaultValue: 'Full Name' })}
                        className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-white/5 border ${
                          errors.name
                            ? 'border-mintcom-red ring-1 ring-mintcom-red'
                            : 'border-gray-200 dark:border-white/10 focus:border-mintcom-green focus:ring-2 focus:ring-mintcom-green/20'
                        } rounded-xl text-xs sm:text-sm font-medium outline-none transition-all text-gray-900 dark:text-white`}
                      />
                    </div>
                    {errors.name && <p className="text-[10px] font-bold text-mintcom-red px-1">{errors.name.message}</p>}
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                      <span>{formatInputLabel(t('customers.form.phone'), t('common.locale'))}</span>
                      <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 lowercase">
                        ({t('common.optional', { defaultValue: 'optional' })})
                      </span>
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        maxLength={CUSTOMER_FIELD_LIMITS.phone}
                        {...register('phone')}
                        placeholder={t('customers.form.phonePlaceholder', { defaultValue: '+1 234 567 8900' })}
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green outline-none transition-all"
                      />
                    </div>
                    {errors.phone && <p className="text-[10px] font-bold text-mintcom-red px-1">{errors.phone.message}</p>}
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                    <span>{formatInputLabel(t('customers.form.email'), t('common.locale'))}</span>
                    <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 lowercase">
                      ({t('customers.form.optional', { defaultValue: 'optional' })})
                    </span>
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      maxLength={CUSTOMER_FIELD_LIMITS.email}
                      type="email"
                      {...register('email')}
                      placeholder={t('customers.form.emailPlaceholder', { defaultValue: 'customer@example.com' })}
                      className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-white/5 border ${
                        errors.email
                          ? 'border-mintcom-red ring-1 ring-mintcom-red'
                          : 'border-gray-200 dark:border-white/10 focus:border-mintcom-green focus:ring-2 focus:ring-mintcom-green/20'
                      } rounded-xl text-xs sm:text-sm font-medium outline-none transition-all text-gray-900 dark:text-white`}
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-[10px] font-bold text-mintcom-red px-1">{errors.email.message}</p>
                  ) : (
                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 px-1">
                      {t('customers.form.emailHelper', {
                        defaultValue: 'Used to email receipts and loyalty passes.',
                      })}
                    </p>
                  )}
                </div>

                {/* Submit Profile Actions */}
                <div className="pt-2 flex items-center justify-between gap-2.5 border-t border-gray-100 dark:border-white/5">
                  {isEditing && customer && onDeleteCustomer ? (
                    <button
                      type="button"
                      onClick={() => onDeleteCustomer(customer)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-mintcom-red hover:bg-mintcom-red/10 border border-mintcom-red/20 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>{t('customers.messages.removeCustomer', { defaultValue: 'Remove Customer' })}</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    >
                      {t('common.cancel', { defaultValue: 'Cancel' })}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-5 py-2 bg-mintcom-green text-black font-bold text-xs sm:text-sm rounded-xl hover:bg-[#5fa888] disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          <span>{t('common.saving', { defaultValue: 'Saving...' })}</span>
                        </>
                      ) : isEditing ? (
                        t('customers.messages.updateCustomer', { defaultValue: 'Update Customer' })
                      ) : (
                        t('customers.messages.saveCustomer', { defaultValue: 'Save Customer' })
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: Loyalty & Points Engine - Ultra Compact & No Scroll */}
            {isEditing && activeTab === 'loyalty' && (
              <div className="space-y-3">
                {/* Top Strip: Action Switcher (+ Add / - Deduct) */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setPointsAction('add');
                      setPointsError(null);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      pointsAction === 'add'
                        ? 'bg-mintcom-green text-black shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Plus size={14} />
                    <span>{t('customers.details.addPoints', { defaultValue: 'Add Points' })}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPointsAction('deduct');
                      setPointsError(null);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      pointsAction === 'deduct'
                        ? 'bg-mintcom-red text-white shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Minus size={14} />
                    <span>{t('customers.details.deductPoints', { defaultValue: 'Deduct Points' })}</span>
                  </button>
                </div>

                {/* Points Amount Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('customers.details.pointsAmount', { defaultValue: 'Points Amount' })}
                    </label>
                    <span className="text-[10px] text-gray-400">
                      {t('customers.details.maxPointsHint', { max: MAX_POINTS_ADJUSTMENT.toLocaleString(), defaultValue: `max ${MAX_POINTS_ADJUSTMENT.toLocaleString()}` })}
                    </span>
                  </div>

                  <div className="relative">
                    <Award size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      min={1}
                      max={MAX_POINTS_ADJUSTMENT}
                      value={pointsAmount || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(parseInt(e.target.value, 10) || 0, MAX_POINTS_ADJUSTMENT));
                        setPointsAmount(val);
                        if (pointsError) setPointsError(null);
                      }}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm sm:text-base font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green outline-none transition-all"
                    />
                  </div>
                  {pointsError && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-mintcom-red px-1">
                      <AlertCircle size={13} />
                      <span>{pointsError}</span>
                    </div>
                  )}
                </div>

                {/* 1-Tap Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">
                    {t('customers.details.pointsAllocation', { defaultValue: 'Presets' })}:
                  </span>
                  {pointPresets.map((preset) => {
                    const isDisabled = pointsAction === 'deduct' && preset > localPoints;
                    const isSelected = pointsAmount === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setPointsAmount(preset);
                          setPointsError(null);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          isSelected
                            ? pointsAction === 'add'
                              ? 'bg-mintcom-green text-black border-mintcom-green shadow-xs'
                              : 'bg-mintcom-red text-white border-mintcom-red shadow-xs'
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                      >
                        {pointsAction === 'add' ? `+${preset}` : `-${preset}`}
                      </button>
                    );
                  })}
                  {pointsAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPointsAmount(0)}
                      className="text-[11px] font-semibold text-mintcom-green hover:underline cursor-pointer ml-auto"
                    >
                      {t('common.clear', { defaultValue: 'Clear' })}
                    </button>
                  )}
                </div>

                {/* Live Impact Preview Card or Success message */}
                {pointsSuccessNotice ? (
                  <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>{pointsSuccessNotice} {t('customers.messages.pointsAdjusted', { defaultValue: 'adjusted' })}</span>
                  </div>
                ) : pointsAmount > 0 ? (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      pointsAction === 'add'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Sparkles size={14} className={pointsAction === 'add' ? 'text-emerald-500' : 'text-rose-500'} />
                      <span>{t('customers.details.currentBalance', { defaultValue: 'Current' })}: <strong>{localPoints.toLocaleString()}</strong> → {t('customers.details.confirmAdjustment', { defaultValue: 'New' })}:</span>
                    </div>
                    <span className="text-xs sm:text-sm font-black">
                      {projectedBalance.toLocaleString()} pts
                      <span className="text-[10px] opacity-80 ml-1">
                        ({pointsAction === 'add' ? `+${pointsAmount.toLocaleString()}` : `-${pointsAmount.toLocaleString()}`})
                      </span>
                    </span>
                  </div>
                ) : null}

                {/* Points Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setPointsAmount(0)}
                    disabled={isPointsSubmitting || pointsAmount === 0}
                    className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {t('common.clear', { defaultValue: 'Clear' })}
                  </button>

                  <button
                    type="button"
                    onClick={handlePointsSubmit}
                    disabled={isPointsSubmitting || pointsAmount <= 0}
                    aria-label={pointsAction === 'add' ? 'Apply Add Points' : 'Apply Deduct Points'}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-black text-xs sm:text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      pointsAction === 'add'
                        ? 'bg-mintcom-green text-black hover:bg-[#5fa888]'
                        : 'bg-mintcom-red text-white hover:bg-red-600'
                    }`}
                  >
                    {isPointsSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>{t('common.saving', { defaultValue: 'Saving...' })}</span>
                      </>
                    ) : pointsAction === 'add' ? (
                      <>
                        <Plus size={14} />
                        <span>{t('customers.details.addPoints', { defaultValue: 'Add Points' })}</span>
                      </>
                    ) : (
                      <>
                        <Minus size={14} />
                        <span>{t('customers.details.deductPoints', { defaultValue: 'Deduct Points' })}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

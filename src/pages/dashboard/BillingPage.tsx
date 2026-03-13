import {
  CreditCard,
  DollarSign,
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Zap,
  ShieldAlert,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { AnimatePresence, motion } from 'framer-motion';

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

interface EstablishmentBilling {
  id: string;
  name: string;
  subscriptionStatus: string;
  cancelAtPeriodEnd: boolean;
  monthlyPrice: number;
  billingCycle?: 'monthly' | 'yearly';
}

// Pricing constants
const MONTHLY_PRICE = 20;
const YEARLY_PRICE = 210;
const MONTHLY_ADDITIONAL = 17;
const YEARLY_ADDITIONAL = 180;

export function BillingPage() {
  const { t } = useTranslation();
  usePermissionGuard();

  const { currentEstablishment, refreshEstablishments } = useAuth();
  const { currencySymbol } = useCurrency();
  const [billingInfo, setBillingInfo] = useState<EstablishmentBilling | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (currentEstablishment) {
      fetchBillingInfo();
    }
  }, [currentEstablishment]);

  const fetchBillingInfo = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/accounts/billing/establishment/${currentEstablishment?.id}`);
      setBillingInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch establishment billing info:', err);
      setBillingInfo({
        id: currentEstablishment?.id || '',
        name: currentEstablishment?.name || '',
        subscriptionStatus: currentEstablishment?.subscriptionStatus || 'UNKNOWN',
        cancelAtPeriodEnd: false,
        monthlyPrice: 20,
        billingCycle: 'monthly'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSuccess = async () => {
    setBillingInfo(prev => prev ? { ...prev, subscriptionStatus: 'CANCELED' } : null);
    await refreshEstablishments();
    toast.success(t('owner.billing.success.canceled'));
  };

  const isYearly = billingInfo?.billingCycle === 'yearly';
  const totalMonthly = billingInfo?.monthlyPrice || MONTHLY_PRICE;
  const effectiveMonthlyRate = isYearly ? Math.round((YEARLY_PRICE / 12) * 100) / 100 : totalMonthly;
  const yearlySavings = (MONTHLY_PRICE * 12) - YEARLY_PRICE;

  // Mock invoices
  const invoices: Invoice[] = [
    { id: '1', date: '2025-10-12', amount: `${currencySymbol} ${isYearly ? '210.000' : '20.000'}`, status: 'Paid' },
    { id: '2', date: '2025-09-12', amount: `${currencySymbol} ${isYearly ? '210.000' : '20.000'}`, status: 'Paid' },
  ];

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = () => {
    const status = billingInfo?.subscriptionStatus;
    if (billingInfo?.cancelAtPeriodEnd) {
      return (
        <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-black tracking-widest border border-amber-500/20 flex items-center gap-2">
          <Calendar size={12} />
          {t('owner.billing.cancelsSoon')}
        </span>
      );
    }

    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return (
          <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20 flex items-center gap-2">
            <CheckCircle2 size={12} />
            {t('owner.billing.active')}
          </span>
        );
      case 'TRIAL':
        return (
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-black tracking-widest border border-emerald-500/20 flex items-center gap-2">
            <Zap size={12} />
            {t('owner.locations.trial')}
          </span>
        );
      case 'CANCELED':
        return (
          <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs font-black tracking-widest border border-red-500/20 flex items-center gap-2">
            <XCircle size={12} />
            {t('owner.billing.canceled')}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-lg bg-gray-500/10 text-gray-500 text-xs font-black tracking-widest border border-gray-500/20">
            {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : t('common.notAvailable')}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
              </div>
              <span className="text-xs font-bold text-paymint-green tracking-widest">{t('dashboard.shiftStatus.live')}</span>
            </div>
            {!isLoading && getStatusBadge()}
            {!isLoading && isYearly && (
              <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-black tracking-widest border border-blue-500/20 flex items-center gap-1.5">
                <Sparkles size={10} />
                YEARLY
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('owner.billing.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('owner.billing.managePayments', { name: currentEstablishment?.name })}</span>
                        {currentEstablishment?.name && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                                {currentEstablishment.name}
                            </span>
                        )}
                    </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subscription Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-gray-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <DollarSign className="w-8 h-8 text-paymint-green" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t('owner.billing.plan')}</h3>
                  <p className="text-gray-400 text-sm font-bold tracking-widest mt-1">
                    {isYearly ? 'YEARLY' : 'MONTHLY'} &bull; {t('owner.billing.enterprise')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-paymint-green/20 border border-paymint-green/30 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-paymint-green animate-pulse" />
                <span className="text-xs font-black text-paymint-green tracking-[0.2em]">{t('owner.billing.active')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                <p className="dashboard-card-label mb-2">{t('owner.billing.cost')}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-paymint-green">{currencySymbol}</span>
                  <span className="text-4xl font-black text-white">
                    {(isYearly ? YEARLY_PRICE : totalMonthly || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {isYearly ? 'Billed annually' : 'Billed monthly'}
                  {isYearly && ` &bull; ~${effectiveMonthlyRate.toFixed(2)}/mo`}
                </p>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                <p className="dashboard-card-label mb-2">{t('owner.billing.location')}</p>
                <p className="text-xl font-bold text-white truncate max-w-[200px]">{currentEstablishment?.name}</p>
                <p className="card-subtitle">{t('owner.billing.main')}</p>
              </div>
            </div>

            {/* Upgrade to yearly banner (show only if monthly) */}
            {!isYearly && (
              <div className="relative z-10 mb-6 p-4 rounded-2xl bg-paymint-green/10 border border-paymint-green/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles size={18} className="text-paymint-green" />
                  <div>
                    <p className="text-sm font-bold text-white">Switch to Yearly & Save ${yearlySavings}/yr</p>
                    <p className="text-xs text-gray-400">Pay $210/year instead of $240 - that's $17.50/mo</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-5 py-2.5 bg-paymint-green text-black font-black text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20 tracking-widest flex items-center gap-2 whitespace-nowrap"
                >
                  UPGRADE
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              {!isYearly && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex-1 px-8 py-4 bg-paymint-green text-black font-black text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20 tracking-widest flex items-center justify-center gap-2"
                >
                  <Zap size={16} /> {t('owner.billing.upgrade')}
                </button>
              )}

              {!isLoading && billingInfo?.subscriptionStatus === 'ACTIVE' && !billingInfo?.cancelAtPeriodEnd && (
                <button
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="flex-1 px-8 py-4 bg-red-500/10 text-red-400 border border-red-500/20 font-black text-xs rounded-xl hover:bg-red-500 hover:text-white transition-all tracking-widest flex items-center justify-center gap-2"
                >
                  <ShieldAlert size={16} />
                  {t('owner.billing.cancel')}
                </button>
              )}
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('owner.billing.invoices')}</h3>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{invoice.amount}</p>
                      <p className="text-xs font-bold text-gray-500">{formatDate(invoice.date)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black tracking-wider rounded-lg border ${invoice.status === 'Paid'
                      ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                      {invoice.status === 'Paid' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                      {invoice.status === 'Paid' ? t('owner.billing.invoiceStatus.paid') : t('owner.billing.invoiceStatus.failed')}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 text-xs font-bold hover:text-paymint-green transition-colors">
                      <Download size={14} />
                      {t('security.deletion.steps.export')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr className="border-b border-gray-200 dark:border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('common.date')}</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('orders.table.amount')}</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('orders.table.status')}</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-gray-400 tracking-widest">{t('orders.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-bold">{formatDate(invoice.date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-black">{invoice.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black tracking-wider rounded-lg border ${invoice.status === 'Paid'
                          ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                          {invoice.status === 'Paid' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                          {invoice.status === 'Paid' ? t('owner.billing.invoiceStatus.paid') : t('owner.billing.invoiceStatus.failed')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg text-gray-400 hover:text-paymint-green hover:bg-paymint-green/10 transition-colors">
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Method & Plans Overview */}
        <div className="space-y-8">
          {/* Plans Summary */}
          <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Plans Overview</h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-paymint-green/5 border border-paymint-green/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black text-gray-600 dark:text-gray-300">First Location</span>
                  <span className="text-xs font-black text-paymint-green">
                    ${isYearly ? YEARLY_PRICE : MONTHLY_PRICE}{isYearly ? '/yr' : '/mo'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">Full access to all features</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black text-gray-600 dark:text-gray-300">Each Extra Location</span>
                  <span className="text-xs font-black text-blue-500">
                    ${isYearly ? YEARLY_ADDITIONAL : MONTHLY_ADDITIONAL}{isYearly ? '/yr' : '/mo'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">
                  {isYearly ? `Save $${(MONTHLY_ADDITIONAL * 12) - YEARLY_ADDITIONAL}/yr vs monthly` : `Save $${MONTHLY_PRICE - MONTHLY_ADDITIONAL}/mo vs first location`}
                </p>
              </div>

              {isYearly && (
                <div className="p-2 rounded-lg bg-paymint-green/10 flex items-center gap-2">
                  <Sparkles size={12} className="text-paymint-green" />
                  <span className="text-[10px] font-bold text-paymint-green">Yearly plan active - saving ${yearlySavings}/yr</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('owner.billing.payment')}</h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between group hover:border-paymint-green/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-white/5 rounded-lg flex items-center justify-center border border-gray-200 dark:border-white/5">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">&bull;&bull;&bull;&bull; 4242</p>
                    <p className="text--[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wide">{t('owner.billing.expires')} 12/26</p>
                  </div>
                </div>
                <button className="text-xs font-black text-paymint-green tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:underline">{t('common.edit')}</button>
              </div>

              <button className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl hover:border-paymint-green/50 hover:bg-paymint-green/5 transition-all group">
                <div className="w-10 h-10 bg-white dark:bg-white/5 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 border border-gray-200 dark:border-white/5">
                  <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-paymint-green transition-colors" />
                </div>
                <span className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest group-hover:text-paymint-green transition-colors">{t('owner.billing.addCard')}</span>
              </button>
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-paymint-green/5 border border-paymint-green/20 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('owner.billing.needHelp')}</h4>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4">
              {t('owner.billing.billingQuestions')}
            </p>
            <button className="w-full py-3 bg-white dark:bg-white/5 border border-paymint-green/20 text-paymint-green font-bold rounded-xl text-xs tracking-widest hover:bg-paymint-green hover:text-black transition-all shadow-sm">
              {t('owner.billing.contactSupport')}
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade to Yearly Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 popup-surface flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-md w-full p-8 border border-gray-200 dark:border-white/10 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-paymint-green/10 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles size={28} className="text-paymint-green" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Switch to Yearly</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">
                  Save ${yearlySavings} per year on your subscription
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Monthly (current)</p>
                    <p className="text-xs text-gray-400">Billed every month</p>
                  </div>
                  <span className="text-lg font-black text-gray-400 line-through">${MONTHLY_PRICE * 12}/yr</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-paymint-green/5 border-2 border-paymint-green/30">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      Yearly
                      <span className="px-2 py-0.5 bg-paymint-green text-black rounded text-[9px] font-black">RECOMMENDED</span>
                    </p>
                    <p className="text-xs text-paymint-green font-bold">~${(YEARLY_PRICE / 12).toFixed(2)}/mo effective rate</p>
                  </div>
                  <span className="text-lg font-black text-paymint-green">${YEARLY_PRICE}/yr</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success('Yearly plan upgrade requested');
                    setShowUpgradeModal(false);
                  }}
                  className="flex-1 py-3 rounded-xl bg-paymint-green text-black font-black text-sm hover:bg-paymint-green/90 transition-colors shadow-lg shadow-paymint-green/20"
                >
                  Upgrade Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SecurityVerificationModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onSuccess={handleCancelSuccess}
        targetId={currentEstablishment?.id || ''}
        targetName={currentEstablishment?.name || ''}
        mode="cancel"
      />
    </div>
  );
}





import {
  CreditCard,
  DollarSign,
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import api from '../../config/api';
import toast from 'react-hot-toast';

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
}

export function BillingPage() {
  const { currentEstablishment, refreshEstablishments } = useAuth();
  const [billingInfo, setBillingInfo] = useState<EstablishmentBilling | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

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
      // Fallback to basic info if specific endpoint fails or isn't implemented yet
      setBillingInfo({
        id: currentEstablishment?.id || '',
        name: currentEstablishment?.name || '',
        subscriptionStatus: currentEstablishment?.subscriptionStatus || 'UNKNOWN',
        cancelAtPeriodEnd: false,
        monthlyPrice: 20
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSuccess = async () => {
    // Optimistic update
    setBillingInfo(prev => prev ? { ...prev, subscriptionStatus: 'CANCELED' } : null);

    // Refresh global state
    await refreshEstablishments();
    toast.success('Subscription canceled');
  };

  // Calculate billing info from establishments
  const totalMonthly = billingInfo?.monthlyPrice || 20;

  // Mock invoices for demo
  const invoices: Invoice[] = [
    { id: '1', date: 'Oct 12, 2025', amount: 'JOD 20.000', status: 'Paid' },
    { id: '2', date: 'Sep 12, 2025', amount: 'JOD 20.000', status: 'Paid' },
  ];

  const getStatusBadge = () => {
    const status = billingInfo?.subscriptionStatus;
    if (billingInfo?.cancelAtPeriodEnd) {
      return (
        <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-black tracking-widest border border-amber-500/20 flex items-center gap-2">
          <Calendar size={12} />
          Canceling Soon
        </span>
      );
    }

    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return (
          <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20 flex items-center gap-2">
            <CheckCircle2 size={12} />
            Active
          </span>
        );
      case 'TRIAL':
        return (
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-black tracking-widest border border-emerald-500/20 flex items-center gap-2">
            <Zap size={12} />
            Trial
          </span>
        );
      case 'CANCELED':
        return (
          <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs font-black tracking-widest border border-red-500/20 flex items-center gap-2">
            <XCircle size={12} />
            Canceled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-lg bg-gray-500/10 text-gray-500 text-xs font-black tracking-widest border border-gray-500/20">
            {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
              Billing
            </span>
            {!isLoading && getStatusBadge()}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Billing</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">
            Manage payments for {currentEstablishment?.name}
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
                  <h3 className="text-xl font-bold text-white">Plan</h3>
                  <p className="text-gray-400 text-sm font-bold tracking-widest mt-1">Enterprise</p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-paymint-green/20 border border-paymint-green/30 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-paymint-green animate-pulse" />
                <span className="text-xs font-black text-paymint-green tracking-[0.2em]">Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                <p className="text-xs font-black text-gray-400 tracking-widest mb-2">Cost</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-paymint-green">JOD</span>
                  <span className="text-4xl font-black text-white">{totalMonthly.toFixed(3)}</span>
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                <p className="text-xs font-black text-gray-400 tracking-widest mb-2">Location</p>
                <p className="text-xl font-bold text-white truncate max-w-[200px]">{currentEstablishment?.name}</p>
                <p className="text-xs text-gray-500 mt-1 tracking-wide">Main</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <button className="flex-1 px-8 py-4 bg-paymint-green text-black font-black text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20 tracking-widest flex items-center justify-center gap-2">
                <Zap size={16} /> Upgrade
              </button>

              {!isLoading && billingInfo?.subscriptionStatus === 'ACTIVE' && !billingInfo?.cancelAtPeriodEnd && (
                <button
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="flex-1 px-8 py-4 bg-red-500/10 text-red-400 border border-red-500/20 font-black text-xs rounded-xl hover:bg-red-500 hover:text-white transition-all tracking-widest flex items-center justify-center gap-2"
                >
                  <ShieldAlert size={16} />
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invoices</h3>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{invoice.amount}</p>
                      <p className="text-xs font-bold text-gray-500">{invoice.date}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black tracking-wider rounded-lg border ${invoice.status === 'Paid'
                      ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                      {invoice.status === 'Paid' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 text-xs font-bold hover:text-paymint-green transition-colors">
                      <Download size={14} />
                      Download
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
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-gray-400 tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-bold">{invoice.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-black">{invoice.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black tracking-wider rounded-lg border ${invoice.status === 'Paid'
                          ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                          {invoice.status === 'Paid' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                          {invoice.status}
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

        {/* Payment Method */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Payment</h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between group hover:border-paymint-green/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-white/5 rounded-lg flex items-center justify-center border border-gray-200 dark:border-white/5">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">•••• 4242</p>
                    <p className="text--[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wide">Expires 12/26</p>
                  </div>
                </div>
                <button className="text-xs font-black text-paymint-green tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:underline">Edit</button>
              </div>

              <button className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl hover:border-paymint-green/50 hover:bg-paymint-green/5 transition-all group">
                <div className="w-10 h-10 bg-white dark:bg-white/5 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 border border-gray-200 dark:border-white/5">
                  <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-paymint-green transition-colors" />
                </div>
                <span className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest group-hover:text-paymint-green transition-colors">Add Card</span>
              </button>
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-paymint-green/5 border border-paymint-green/20 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Need Help?</h4>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4">
              Questions about billing?
            </p>
            <button className="w-full py-3 bg-white dark:bg-white/5 border border-paymint-green/20 text-paymint-green font-bold rounded-xl text-xs tracking-widest hover:bg-paymint-green hover:text-black transition-all shadow-sm">
              Contact Support
            </button>
          </div>
        </div>
      </div>

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

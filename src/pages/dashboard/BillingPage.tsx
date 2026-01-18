import {
  CreditCard,
  DollarSign,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

export function BillingPage() {
  const { establishments } = useAuth();

  // Calculate billing info from establishments
  const activeEstablishments = establishments.filter(e => e.subscriptionStatus === 'active').length;
  const totalMonthly = activeEstablishments * 20;

  // Mock invoices for demo
  const invoices: Invoice[] = [
    { id: '1', date: 'Oct 12, 2025', amount: '20.00 JOD', status: 'Paid' },
    { id: '2', date: 'Sep 12, 2025', amount: '20.00 JOD', status: 'Paid' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black uppercase tracking-widest border border-paymint-green/20">
              Financial
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Billing & Subscription</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your plan, payments, and invoices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subscription Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-paymint-green/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-paymint-green" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Current Plan</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Standard Monthly Subscription</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Monthly Fee</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{totalMonthly.toFixed(2)} JOD</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Active Locations</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{activeEstablishments}</p>
              </div>
            </div>

            <button className="w-full md:w-auto px-8 py-3 bg-paymint-green text-black font-bold text-sm rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20 uppercase tracking-wide">
              Manage Subscription
            </button>
          </div>

          {/* Billing History */}
          <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Invoices</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr className="border-b border-gray-200 dark:border-white/5">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-bold">{invoice.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-black">{invoice.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${invoice.status === 'Paid'
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Payment Method</h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between group hover:border-paymint-green/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-white/5 rounded-lg flex items-center justify-center border border-gray-200 dark:border-white/5">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">•••• 4242</p>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Expires 12/26</p>
                  </div>
                </div>
                <button className="text-[10px] font-black text-paymint-green uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:underline">Edit</button>
              </div>

              <button className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl hover:border-paymint-green/50 hover:bg-paymint-green/5 transition-all group">
                <div className="w-10 h-10 bg-white dark:bg-white/5 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 border border-gray-200 dark:border-white/5">
                  <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-paymint-green transition-colors" />
                </div>
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-paymint-green transition-colors">Add New Method</span>
              </button>
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-paymint-green/5 border border-paymint-green/20 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Need Help?</h4>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              Have questions about your billing or subscription? Our dedicated support team is ready to assist you.
            </p>
            <button className="w-full py-3 bg-white dark:bg-white/5 border border-paymint-green/20 text-paymint-green font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-paymint-green hover:text-black transition-all shadow-sm">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

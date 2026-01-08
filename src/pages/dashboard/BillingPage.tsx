import {
  CreditCard,
  DollarSign,
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
    <div className="p-6 lg:p-10 space-y-8 h-full overflow-y-auto bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Billing & Subscription</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your plan, payments, and invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subscription Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-paymint-green/10 rounded-2xl flex items-center justify-center shadow-sm">
                <DollarSign className="w-7 h-7 text-paymint-green" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Current Plan</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Standard Monthly Subscription</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-transparent">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Monthly Fee</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{totalMonthly.toFixed(2)} JOD</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-transparent">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Active Locations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeEstablishments}</p>
              </div>
            </div>

            <button className="w-full md:w-auto px-8 py-3 bg-paymint-green text-black font-bold rounded-xl hover:bg-paymint-green/90 transition-all shadow-lg shadow-paymint-green/20">
              Manage Subscription
            </button>
          </div>

          {/* Billing History */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Invoices</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-black/20">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">{invoice.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-bold">{invoice.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${
                          invoice.status === 'Paid' ? 'bg-paymint-green/10 text-paymint-green' : 'bg-accent/10 text-accent'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sm font-bold text-paymint-green hover:text-paymint-green/80 transition-colors">Download</button>
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
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Payment Method</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">•••• 4242</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Expires 12/26</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-paymint-green opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
              </div>

              <button className="w-full flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl hover:border-paymint-green/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                <div className="w-12 h-12 bg-gray-100 dark:bg-paymint-green/10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                  <CreditCard className="w-6 h-6 text-gray-400 dark:text-paymint-green" />
                </div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Add New Method</span>
              </button>
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-paymint-green/10 border border-paymint-green/20 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Need Help?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed font-medium">Have questions about your billing or subscription? Our team is here to help.</p>
            <button className="w-full py-3 bg-white dark:bg-paymint-green text-black font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




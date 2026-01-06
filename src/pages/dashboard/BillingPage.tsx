import { motion } from 'framer-motion';
import {
  CreditCard,
  Check,
  AlertCircle,
  Download,
  Calendar,
  DollarSign,
  Building,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
}

export function BillingPage() {
  const { establishments } = useAuth();

  // Calculate billing info from establishments
  const activeEstablishments = establishments.filter(e => e.subscriptionStatus === 'active').length;
  const trialEstablishments = establishments.filter(e => e.subscriptionStatus === 'trial').length;
  const totalMonthly = activeEstablishments * 20;

  // Mock invoices for demo
  const invoices: Invoice[] = [];

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
          <p className="text-gray-400">Manage your payment methods and view invoices</p>
        </div>

        {/* Billing Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-gray-400 text-sm">Monthly Cost</span>
            </div>
            <p className="text-3xl font-bold text-white">${totalMonthly}</p>
            <p className="text-gray-500 text-sm mt-1">per month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-gray-400 text-sm">Active Subscriptions</span>
            </div>
            <p className="text-3xl font-bold text-white">{activeEstablishments}</p>
            <p className="text-gray-500 text-sm mt-1">establishments</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-gray-400 text-sm">Trial Establishments</span>
            </div>
            <p className="text-3xl font-bold text-white">{trialEstablishments}</p>
            <p className="text-gray-500 text-sm mt-1">in trial period</p>
          </motion.div>
        </div>

        {/* Trial Alert */}
        {trialEstablishments > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-500 font-medium">Trial Active</h4>
              <p className="text-gray-400 text-sm mt-1">
                You have {trialEstablishments} establishment{trialEstablishments > 1 ? 's' : ''} in trial mode.
                Add a payment method to continue using PayMint after your trial ends.
              </p>
            </div>
          </motion.div>
        )}

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>

          <div className="flex items-center justify-center py-8">
            <button
              onClick={() => toast.success('Stripe integration coming soon!')}
              className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-600 rounded-xl hover:border-green-500 transition-colors"
            >
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Add Payment Method</p>
                <p className="text-gray-400 text-sm">Secure payment via Stripe</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Pricing Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Pricing</h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-white">$20</span>
            <span className="text-gray-400">/month per establishment</span>
          </div>
          <ul className="space-y-3">
            {[
              'Unlimited employees',
              'Unlimited devices',
              'Unlimited orders',
              'All features included',
              'Real-time analytics',
              'Priority support',
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Invoice History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Invoice History</h3>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No invoices yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Invoices will appear here once you start a paid subscription
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{invoice.date}</p>
                    <p className="text-gray-400 text-sm">${invoice.amount}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid'
                        ? 'bg-green-500/10 text-green-500'
                        : invoice.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-red-500/10 text-red-500'
                        }`}
                    >
                      {invoice.status}
                    </span>
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

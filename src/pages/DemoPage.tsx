import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Store, Database, ArrowRight, ArrowLeft } from 'lucide-react';
import { Navbar } from '../components/Navbar'; // Reuse Navbar if appropriate or make a simplified one

export const DemoPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plan = searchParams.get('plan');

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    type: 'Restaurant' // Restaurant, Cafe, etc.
  });

  // demoCredentials no longer displayed on page - sent via email only

  // If no plan is selected, redirect to pricing
  useEffect(() => {
    if (!plan) {
      navigate('/');
      setTimeout(() => {
        const pricingSection = document.getElementById('pricing');
        if (pricingSection) pricingSection.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [plan, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStep(2); // Go to processing

    // Use environment variable for API URL in production, or hardcoded fallback
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/demo/setup`;

    setErrorMsg(null);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          plan: plan
        }),
      });

      if (!response.ok) {
        let errorMessage = `Server Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      await response.json(); // Credentials are sent via email, not displayed on page

      // Simulate remaining processing time if needed
      setTimeout(() => {
        setStep(3); // Success/Demo View
      }, 3000);
    } catch (error: any) {
      console.error('Error sending demo email:', error);
      setIsSubmitting(false);
      setErrorMsg(`Failed to connect to server at ${apiUrl}. Details: ${error.message || error}`);
      setStep(1); // Go back to form to show error
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white dark:bg-paymint-surface border border-gray-200 dark:border-white/10 p-8 rounded-none shadow-xl">
        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Setup Your Demo</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          You chose the <span className="text-paymint-green font-bold">{plan}</span>. Let's get your restaurant set up.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-none text-sm">
            <strong>Error:</strong> {errorMsg}
            <br />
            <span className="text-xs mt-1 block">Make sure VITE_API_URL is set in your deployment settings.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Restaurant Name</label>
              <input
                required
                type="text"
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-none border border-gray-300 dark:border-white/10 bg-transparent focus:border-paymint-green focus:ring-1 focus:ring-paymint-green outline-none transition-colors dark:text-white"
                placeholder="Tasty Bites"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-none border border-gray-300 dark:border-white/10 bg-transparent focus:border-paymint-green focus:ring-1 focus:ring-paymint-green outline-none transition-colors dark:text-white"
              >
                <option value="Restaurant">Restaurant</option>
                <option value="Cafe">Cafe</option>
                <option value="Food Truck">Food Truck</option>
                <option value="Retail">Retail</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Owner Name</label>
            <input
              required
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-none border border-gray-300 dark:border-white/10 bg-transparent focus:border-paymint-green focus:ring-1 focus:ring-paymint-green outline-none transition-colors dark:text-white"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-none border border-gray-300 dark:border-white/10 bg-transparent focus:border-paymint-green focus:ring-1 focus:ring-paymint-green outline-none transition-colors dark:text-white"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
              <input
                required
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-none border border-gray-300 dark:border-white/10 bg-transparent focus:border-paymint-green focus:ring-1 focus:ring-paymint-green outline-none transition-colors dark:text-white"
                placeholder="+962 7..."
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-paymint-green text-black py-4 rounded-none font-bold text-lg hover:bg-paymint-green/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Start Demo'} <ArrowRight size={20} />
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      className="max-w-xl mx-auto text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="bg-white dark:bg-paymint-surface border border-gray-200 dark:border-white/10 p-12 rounded-none shadow-xl">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <motion.div
            className="absolute inset-0 border-4 border-paymint-green/30 rounded-full"
          />
          <motion.div
            className="absolute inset-0 border-4 border-paymint-green border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Database className="text-paymint-green" size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Setting Up Your Environment</h2>
        <div className="space-y-3 text-left max-w-xs mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3 text-gray-600 dark:text-gray-400"
          >
            <Check size={18} className="text-paymint-green" />
            <span>Creating Tenant Database...</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 }}
            className="flex items-center gap-3 text-gray-600 dark:text-gray-400"
          >
            <Check size={18} className="text-paymint-green" />
            <span>Configuring {formData.restaurantName}...</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.5 }}
            className="flex items-center gap-3 text-gray-600 dark:text-gray-400"
          >
            <Check size={18} className="text-paymint-green" />
            <span>Generating Access Keys...</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="bg-white dark:bg-paymint-surface border border-gray-200 dark:border-white/10 p-8 rounded-none shadow-xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-paymint-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-paymint-green" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Your Demo is Ready!</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-6">
            We've sent your login credentials and user guide to <strong>{formData.email}</strong>.
            Please check your inbox (and spam folder) for the access details.
          </p>

          <div className="max-w-lg mx-auto bg-paymint-green/10 border border-paymint-green/30 p-4 mb-8 text-center">
            <p className="text-paymint-green font-medium">
              📧 Check your email for your credentials and the PayMint User Manual
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-50 dark:bg-black/20 p-6 border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 transition-colors group cursor-pointer">
            <div className="mb-4 bg-white dark:bg-paymint-surface w-12 h-12 flex items-center justify-center shadow-sm">
              <Store className="text-gray-900 dark:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-paymint-green transition-colors">Launch POS Demo</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Experience the point of sale interface used by cashiers and waiters.
            </p>
            <span className="text-paymint-green font-bold text-sm flex items-center gap-2">
              Launch App <ArrowRight size={16} />
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-black/20 p-6 border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 transition-colors group cursor-pointer">
            <div className="mb-4 bg-white dark:bg-paymint-surface w-12 h-12 flex items-center justify-center shadow-sm">
              <Database className="text-gray-900 dark:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-paymint-green transition-colors">Open Admin Dashboard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Manage your menu, inventory, employees and view reports.
            </p>
            <span className="text-paymint-green font-bold text-sm flex items-center gap-2">
              Go to Dashboard <ArrowRight size={16} />
            </span>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-white/10 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-paymint-dark font-sans">
      <Navbar /> {/* Assuming simplified navbar or same navbar */}
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </AnimatePresence>
      </div>
    </div>
  );
};

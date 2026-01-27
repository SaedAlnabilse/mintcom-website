import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Store, Database, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';

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
    type: 'Restaurant'
  });

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
    setStep(2);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/demo/setup`;

    setErrorMsg(null);

    try {
      const response = await fetch(apiUrl, {
        method: 'Post',
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
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      await response.json();

      setTimeout(() => {
        setStep(3);
      }, 3000);
    } catch (error: any) {
      console.error('Error sending demo email:', error);
      setIsSubmitting(false);
      setErrorMsg(`Failed to connect to server. Details: ${error.message || error}`);
      setStep(1);
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 p-8 lg:p-12 rounded-[2.5rem] shadow-2xl transition-colors duration-300">
        <h2 className="text-3xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">Setup Your Demo</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium">
          You chose the <span className="text-paymint-green font-bold">{plan}</span>. Let's get your restaurant set up.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent/20 text-accent rounded-2xl text-sm font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest ml-1">Restaurant Name</label>
              <input
                required
                type="text"
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleInputChange}
                className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                placeholder="Tasty Bites"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest ml-1">Business Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all appearance-none"
              >
                <option value="Restaurant">Restaurant</option>
                <option value="Cafe">Cafe</option>
                <option value="Food Truck">Food Truck</option>
                <option value="Retail">Retail</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest ml-1">Owner Name</label>
            <input
              required
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleInputChange}
              className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest ml-1">Email Address</label>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest ml-1">Phone Number</label>
              <input
                required
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                placeholder="+962 7..."
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-paymint-green text-black py-5 rounded-2xl font-black text-xl hover:bg-paymint-green/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-paymint-green/20"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : null}
              Start Demo <ArrowRight size={24} />
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
      <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 p-12 lg:p-16 rounded-[3rem] shadow-2xl transition-colors duration-300">
        <div className="relative w-24 h-24 mx-auto mb-10">
          <motion.div
            className="absolute inset-0 border-4 border-paymint-green/30 rounded-full"
          />
          <motion.div
            className="absolute inset-0 border-4 border-paymint-green border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Database className="text-paymint-green" size={40} />
          </div>
        </div>

        <h2 className="text-3xl font-black mb-4 text-gray-900 dark:text-white tracking-tight">Setting Up Your Environment</h2>
        <div className="space-y-4 text-left max-w-xs mx-auto">
          {[
            { delay: 0.5, text: "Creating Database..." },
            { delay: 1.5, text: `Setting up ${formData.restaurantName}...` },
            { delay: 2.5, text: "Creating Access Keys..." },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: item.delay }}
              className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-bold"
            >
              <Check size={20} className="text-paymint-green" />
              <span>{item.text}</span>
            </motion.div>
          ))}
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
      <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 p-8 lg:p-12 rounded-[3rem] shadow-2xl transition-colors duration-300">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-paymint-green/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check size={40} className="text-paymint-green" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Your Demo is Ready!</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-8 text-lg font-medium">
            We've sent your login credentials and user guide to <span className="text-gray-900 dark:text-white font-bold">{formData.email}</span>.
          </p>

          <div className="max-w-lg mx-auto bg-paymint-green/10 border border-paymint-green/20 p-6 rounded-3xl text-center mb-12">
            <p className="text-paymint-green font-black">
              📧 Check your email for your login info and the Paymint User Manual
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-50 dark:bg-black/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 hover:border-paymint-green/50 transition-all group cursor-pointer shadow-sm">
            <div className="mb-6 bg-white dark:bg-white/5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm">
              <Store className="text-paymint-green" size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-paymint-green transition-colors">Try Pos App</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">
              Try the cashier interface.
            </p>
            <span className="text-paymint-green font-black text-sm tracking-widest flex items-center gap-2">
              Launch App <ArrowRight size={18} />
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-black/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 hover:border-paymint-green/50 transition-all group cursor-pointer shadow-sm">
            <div className="mb-6 bg-white dark:bg-white/5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm">
              <Database className="text-blue-500" size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-paymint-green transition-colors">Open Admin</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">
              Manage your business.
            </p>
            <span className="text-paymint-green font-black text-sm tracking-widest flex items-center gap-2">
              Go to Dashboard <ArrowRight size={18} />
            </span>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/10 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors font-bold tracking-widest text-xs"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
      <Navbar />
      <div className="container mx-auto px-6 py-20 lg:py-32">
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </AnimatePresence>
      </div>
    </div>
  );
};

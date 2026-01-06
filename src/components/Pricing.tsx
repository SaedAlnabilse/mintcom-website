import { useState } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: "Premium Plan",
    price: "36 JOD",
    period: "/m",
    description: "The complete all-in-one solution for your business.",
    features: ["Software License", "Cash Drawer Included", "Installment Options", "Year-round Support", "Mobile Admin Portal"],
    detailedFeatures: [
      "Full POS Software License",
      "High-quality Cash Drawer included",
      "Tablet Hardware Options",
      "Flexible installment plans",
      "24/7 Priority Support",
      "Mobile Admin Portal access",
      "Advanced Reporting & Analytics",
      "Inventory Management",
      "Staff Performance Tracking"
    ],
    notIncluded: null,
    cta: "Start Free Trial",
    highlight: true,
    type: "standard"
  },
  {
    name: "Custom Plan",
    price: "Custom",
    period: "",
    description: "Tailored solutions for franchises and multi-location enterprises.",
    features: ["Custom Features", "API Access", "Dedicated Account Manager", "White Label Options", "Multi-branch Management"],
    detailedFeatures: [
      "Pick the features you need",
      "Design custom workflows",
      "Choose hardware and integrations",
      "Dedicated onboarding & support",
      "Enterprise SLA"
    ],
    cta: "Contact Sales",
    highlight: false,
    type: "custom"
  }
];

export const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const navigate = useNavigate();

  const handlePlanAction = (plan: typeof plans[0]) => {
    if (plan.type === 'custom') {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
      setSelectedPlan(null);
    } else {
      // Direct navigation to signup for the main plan
      navigate('/signup');
    }
  };

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-gray-50 dark:bg-[#0f0f0f] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-paymint-green/5 rounded-full blur-[150px] -z-10" />

      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold font-sans text-gray-900 dark:text-white mb-6 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Everything you need to run your business, in one simple plan.
          </p>
        </motion.div>

        {/* Grid centered with max-width adjustment for 2 columns */}
        <div className="grid md:grid-cols-2 gap-8 relative z-10 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className={`rounded-3xl p-8 border relative flex flex-col ${
                plan.highlight 
                  ? 'border-paymint-green bg-white dark:bg-[#1a1a1a] shadow-2xl shadow-paymint-green/10' 
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#151515] hover:border-paymint-green/30 transition-colors'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-paymint-green text-black px-6 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-paymint-green/20">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm h-10">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">{plan.price}</span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{plan.period}</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-paymint-green/10 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-paymint-green" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePlanAction(plan)}
                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group ${
                  plan.highlight 
                    ? 'bg-paymint-green text-black hover:bg-paymint-green/90 shadow-lg shadow-paymint-green/20' 
                    : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {plan.cta}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => setSelectedPlan(plan)}
                className="mt-4 text-sm text-gray-500 hover:text-paymint-green transition-colors text-center"
              >
                View full details
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Plan Details Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlan(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1a1a1a] w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Plan Details</h3>
                <button 
                  onClick={() => setSelectedPlan(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{selectedPlan.name}</h2>
                  <div className="flex items-baseline justify-center gap-1 mb-4">
                    <span className="text-4xl font-bold text-paymint-green">{selectedPlan.price}</span>
                    <span className="text-gray-500">{selectedPlan.period}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{selectedPlan.description}</p>
                </div>

                <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-6 mb-8">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">What's Included</h4>
                  <ul className="space-y-3">
                    {[...selectedPlan.features, ...(selectedPlan.detailedFeatures || [])].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm">
                        <Check size={16} className="text-paymint-green mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => handlePlanAction(selectedPlan)}
                  className="w-full bg-paymint-green text-black py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-paymint-green/20 transition-all"
                >
                  {selectedPlan.cta}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
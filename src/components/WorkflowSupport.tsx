import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, CreditCard, Package, Users, BarChart3, Building2, Cloud, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';

const workflowFeatures = [
  {
    title: "Sales",
    description: "Fast and easy checkout.",
    icon: CreditCard,
    details: {
      overview: "Process payments quickly and easily.",
      features: [
        "Accept all payment types",
        "Split payments easily",
        "Fast refunds",
        "Auto tax calculation",
        "Manage discounts",
        "Digital receipts"
      ]
    }
  },
  {
    title: "Inventory",
    description: "Track stock in real-time.",
    icon: Package,
    details: {
      overview: "Know exactly what you have in stock.",
      features: [
        "Live stock tracking",
        "Low stock alerts",
        "Barcode scanning",
        "Batch tracking",
        "Supplier management",
        "Stock reports"
      ]
    }
  },
  {
    title: "Staff Roles",
    description: "Control staff access.",
    icon: Users,
    details: {
      overview: "Manage what your team can see and do.",
      features: [
        "Custom access roles",
        "Sales tracking per staff",
        "Shift management",
        "Commission tracking",
        "Activity logs",
        "Staff scheduling"
      ]
    }
  },
  {
    title: "Dashboards",
    description: "See live business data.",
    icon: BarChart3,
    details: {
      overview: "Get real-time insights into your business.",
      features: [
        "Live sales tracking",
        "Top selling items",
        "Customer trends",
        "Staff performance",
        "Custom widgets",
        "Export reports"
      ]
    }
  },
  {
    title: "Multi-Location",
    description: "Manage all locations together.",
    icon: Building2,
    details: {
      overview: "Control all your stores from one place.",
      features: [
        "Centralized inventory",
        "Stock transfers",
        "Location-based pricing",
        "Combined reporting",
        "Branch comparison",
        "Remote management"
      ]
    }
  },
  {
    title: "Cloud Sync",
    description: "Data backed up automatically.",
    icon: Cloud,
    details: {
      overview: "Your data is safe and accessible anywhere.",
      features: [
        "Automatic backups",
        "Real-time sync",
        "Access on any device",
        "99.9% uptime",
        "Secure encryption",
        "Easy recovery"
      ]
    }
  }
];

export const WorkflowSupport = () => {
  const [selectedFeature, setSelectedFeature] = useState<typeof workflowFeatures[0] | null>(null);

  // Pre-generate random heights for the charts to ensure purity during render
  const chartHeights = useMemo(() => {
    return Array.from({ length: 3 }, () =>
      Array.from({ length: 7 }, () => Math.random() * 12 + 8)
    );
  }, []);

  return (
    <>
      <section className="py-24 lg:py-32 bg-white dark:bg-[#0f0f0f] overflow-hidden relative">
        {/* Background Decor */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-paymint-green/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-8 md:px-16 lg:px-24 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

            {/* Left Side: Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-12"
              >
                <h2 className="text-4xl lg:text-5xl font-bold font-sans text-gray-900 dark:text-white mb-6 tracking-tight">
                  Everything You Need <span className="text-paymint-green">to Grow</span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  Tools for every part of your restaurant.
                </p>
              </motion.div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {workflowFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedFeature(feature)}
                    className="group flex items-start gap-4 p-5 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-paymint-green/30 hover:shadow-lg hover:shadow-paymint-green/5 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-paymint-green/10 dark:bg-paymint-green/20 flex items-center justify-center group-hover:bg-paymint-green group-hover:scale-110 transition-all duration-300">
                      <feature.icon size={20} className="text-paymint-green group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-bold text-base mb-1 group-hover:text-paymint-green transition-colors">{feature.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side: Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full lg:w-1/2 relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-paymint-green/20 to-blue-500/20 rounded-[2rem] blur-2xl opacity-50" />
              <div className="relative bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-5">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-paymint-red" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-amber-500" />
                      <span>Visits</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-blue-500" />
                      <span>Sales</span>
                    </div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="relative h-32 mb-5 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="400" y2="25" stroke="#1f1f1f" strokeWidth="1" />
                    <line x1="0" y1="50" x2="400" y2="50" stroke="#1f1f1f" strokeWidth="1" />
                    <line x1="0" y1="75" x2="400" y2="75" stroke="#1f1f1f" strokeWidth="1" />

                    {/* Amber wave (Visits) */}
                    <path
                      d="M0,60 Q50,40 100,55 T200,35 T300,50 T400,30"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                    />
                    {/* Blue wave (Sales) */}
                    <path
                      d="M0,70 Q50,55 100,65 T200,45 T300,60 T400,40"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                    />
                    {/* Green wave */}
                    <path
                      d="M0,80 Q50,70 100,75 T200,55 T300,70 T400,50"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="2.5"
                    />
                  </svg>
                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600 px-2">
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>
                </div>

                {/* Donut Chart + Stats */}
                <div className="flex gap-4">
                  {/* Donut Chart */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#1f1f1f" strokeWidth="4" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#4ade80" strokeWidth="4" strokeDasharray="40 100" strokeLinecap="round" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="25 100" strokeDashoffset="-40" strokeLinecap="round" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="20 100" strokeDashoffset="-65" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Stats Cards */}
                  <div className="flex-1 space-y-3">
                    <div className="bg-[#111] rounded-xl p-3 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Total Orders</span>
                        <TrendingUp size={12} className="text-paymint-green" />
                      </div>
                      <div className="text-xl font-bold text-white">8,052</div>
                      <div className="flex gap-1 mt-1">
                        {chartHeights[0].map((h, i) => (
                          <div key={i} className="flex-1 h-4 bg-gradient-to-t from-paymint-green/20 to-paymint-green rounded-sm" style={{ height: `${h}px` }} />
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#111] rounded-xl p-3 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">New Users</span>
                        <Users size={12} className="text-blue-500" />
                      </div>
                      <div className="text-xl font-bold text-white">1.3K</div>
                      <div className="flex gap-1 mt-1">
                        {chartHeights[1].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-blue-500/20 to-blue-500 rounded-sm" style={{ height: `${h}px` }} />
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#111] rounded-xl p-3 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Total Visits</span>
                        <BarChart3 size={12} className="text-amber-500" />
                      </div>
                      <div className="text-xl font-bold text-white">12M</div>
                      <div className="flex gap-1 mt-1">
                        {chartHeights[2].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-amber-500/20 to-amber-500 rounded-sm" style={{ height: `${h}px` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Modal Popup */}
        <AnimatePresence>
          {selectedFeature && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeature(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-100 dark:border-white/5 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              >
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-white/5 p-6 flex items-start justify-between rounded-t-3xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/20">
                      <selectedFeature.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {selectedFeature.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {selectedFeature.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFeature(null)}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-3">
                      Overview
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedFeature.details.overview}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-4">
                      Key Features
                    </h4>
                    <ul className="space-y-3">
                      {selectedFeature.details.features.map((feature, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5"
                        >
                          <CheckCircle2 size={18} className="text-paymint-green flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {feature}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => setSelectedFeature(null)}
                    className="w-full py-4 px-6 bg-paymint-green hover:bg-paymint-green/90 text-black font-bold rounded-xl transition-colors shadow-lg shadow-paymint-green/20"
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
};

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';

const workflowFeatures = [
  {
    title: "Sales Processing",
    description: "Complete transaction management with multiple payment methods",
    details: {
      overview: "Our advanced sales processing system handles everything from simple cash transactions to complex multi-payment splits.",
      features: [
        "Accept cash, credit/debit cards, mobile payments, and gift cards",
        "Split payments across multiple methods",
        "Quick refund and exchange processing",
        "Automatic tax calculations",
        "Custom discount and promotion management",
        "Receipt printing and email options"
      ]
    }
  },
  {
    title: "Inventory Management", 
    description: "Real-time stock tracking and automated reorder alerts",
    details: {
      overview: "Keep perfect track of your inventory with real-time updates and intelligent automation.",
      features: [
        "Live stock level monitoring across all locations",
        "Automated low-stock alerts and reorder suggestions",
        "Barcode scanning and label printing",
        "Batch and serial number tracking",
        "Supplier management and purchase orders",
        "Inventory reports and analytics"
      ]
    }
  },
  {
    title: "Employee Permissions",
    description: "Role-based access control and staff performance tracking",
    details: {
      overview: "Manage your team effectively with granular permissions and comprehensive performance tracking.",
      features: [
        "Customizable role-based access levels",
        "Individual sales performance tracking",
        "Time clock and shift management",
        "Commission calculations",
        "Activity logs and audit trails",
        "Staff scheduling and notifications"
      ]
    }
  },
  {
    title: "Real-time Dashboards",
    description: "Live analytics and business insights at your fingertips",
    details: {
      overview: "Make data-driven decisions with live dashboards that update in real-time.",
      features: [
        "Live sales and revenue tracking",
        "Top-selling products and categories",
        "Customer traffic patterns",
        "Staff performance metrics",
        "Customizable widgets and views",
        "Export reports in multiple formats"
      ]
    }
  },
  {
    title: "Multi-branch Support",
    description: "Centralized management across multiple locations",
    details: {
      overview: "Manage multiple store locations from a single, unified platform.",
      features: [
        "Centralized inventory across all branches",
        "Transfer stock between locations",
        "Location-specific pricing and promotions",
        "Consolidated reporting and analytics",
        "Branch performance comparisons",
        "Remote access and management"
      ]
    }
  },
  {
    title: "Cloud Sync",
    description: "Automatic data backup and cross-device synchronization",
    details: {
      overview: "Your data is always safe, backed up, and accessible from anywhere.",
      features: [
        "Automatic cloud backups every hour",
        "Real-time sync across all devices",
        "Access from desktop, tablet, or mobile",
        "99.9% uptime guarantee",
        "Bank-level encryption",
        "Easy data recovery and restore"
      ]
    }
  }
];

export const WorkflowSupport = () => {
  const [selectedFeature, setSelectedFeature] = useState<typeof workflowFeatures[0] | null>(null);

  return (
    <>
    <section className="py-24 bg-gray-50 dark:bg-paymint-dark overflow-hidden">
      <div className="container mx-auto px-8 lg:px-20 max-w-7xl">
        <div className="flex flex-col lg:flex-row items-stretch gap-16 lg:gap-24">

          {/* Left Side: Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 flex flex-col justify-center"
          >
            <h2 className="text-5xl lg:text-6xl font-bold font-sans text-gray-900 dark:text-white mb-8 tracking-tight">
              Built to Support<br />
              Every Part of Your<br />
              Workflow
            </h2>

            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-12">
              From the front counter to the back office, PayMint provides the tools you need to run your business smoothly.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {workflowFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  onClick={() => setSelectedFeature(feature)}
                  className="group relative flex items-start gap-4 p-6 rounded-none border-2 border-gray-200 dark:border-white/10 hover:border-paymint-green dark:hover:border-paymint-green transition-all duration-300 bg-white dark:bg-black/20 hover:shadow-xl hover:shadow-paymint-green/10 dark:hover:shadow-paymint-green/20 cursor-pointer"
                >
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-paymint-green/0 to-paymint-green/0 group-hover:from-paymint-green/5 group-hover:to-transparent transition-all duration-300 rounded-none pointer-events-none" />
                  
                  <CheckCircle2 size={24} className="text-paymint-green flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <div className="relative z-10">
                    <h3 className="text-gray-900 dark:text-white font-bold text-base mb-2 group-hover:text-paymint-green dark:group-hover:text-paymint-green transition-colors duration-300">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Dashboard Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-1/2 relative flex"
          >
            <div className="relative rounded-none overflow-hidden shadow-2xl shadow-black/50 w-full">
              <img
                src="/admin-dashboard.png"
                alt="PayMint Dashboard - Complete workflow management"
                className="w-full h-full object-cover rounded-none shadow-xl"
              />
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
              className="bg-white dark:bg-gray-900 rounded-none border-2 border-paymint-green max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-white/10 p-6 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <CheckCircle2 size={32} className="text-paymint-green flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedFeature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedFeature.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-none transition-colors"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    Overview
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {selectedFeature.details.overview}
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Key Features
                  </h4>
                  <ul className="space-y-3">
                    {selectedFeature.details.features.map((feature, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2 size={20} className="text-paymint-green flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t-2 border-gray-200 dark:border-white/10">
                  <button
                    onClick={() => setSelectedFeature(null)}
                    className="w-full py-3 px-6 bg-paymint-green hover:bg-paymint-green/90 text-white font-semibold rounded-none transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
    </>
  );
};



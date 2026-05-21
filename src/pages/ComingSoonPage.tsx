import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

export function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-mintcom-green/30">
      <Helmet>
        <title>Mintcom POS | Coming Soon — The Smarter Way to Run Your Business</title>
        <meta name="description" content="Mintcom is a complete 360° POS solution. Manage sales, inventory, staff, reporting, and multi-branch operations from one simple system. Launching soon." />
      </Helmet>

      {/* Animated Background — matches Hero section style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-mintcom-green/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.3, 0.15],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-mintcom-green/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] bg-[#f8b30a]/5 rounded-full blur-[100px]"
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="z-10 text-center px-6 max-w-3xl w-full"
      >
        {/* Badge — matches website badge style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-[12px] border border-mintcom-green/20 bg-mintcom-green/5 dark:bg-mintcom-green/10 px-3.5 py-1.5 text-xs font-bold text-mintcom-green shadow-[0_0_15px_rgba(124,195,159,0.05)] backdrop-blur-md"
        >
          <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-mintcom-green/20 text-mintcom-green overflow-hidden">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mintcom-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-mintcom-green"></span>
            </span>
          </div>
          <span className="tracking-widest uppercase text-[10px] md:text-[11px] leading-none">
            Launching Soon
          </span>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-10 flex justify-center"
        >
          <img
            src="/mintcom-logo-white.svg"
            alt="Mintcom Logo"
            className="h-10 md:h-12 hidden dark:block"
          />
          <img
            src="/mintcom-logo.svg"
            alt="Mintcom Logo"
            className="h-10 md:h-12 dark:hidden"
          />
        </motion.div>

        {/* Headline — uses the website's Magilio font and green accent style */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mb-6 font-magilio text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
        >
          <span className="text-gray-900 dark:text-white">Earn More. </span>
          <span className="text-mintcom-green">Manage Better.</span>
          <br />
          <span className="text-gray-900 dark:text-white">Work </span>
          <span className="text-mintcom-green">Smarter.</span>
        </motion.h1>

        {/* Description — POS-focused curiosity text */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mb-10 max-w-2xl mx-auto text-base sm:text-lg font-light leading-relaxed text-gray-600 dark:text-gray-400"
        >
          A complete 360° POS solution is almost here. Sales, inventory, staff management, 
          real-time reporting, loyalty programs, and multi-branch control — all from one 
          simple system. No hidden costs. No complexity.
        </motion.p>

        {/* Feature Pills — key selling points to build curiosity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {[
            'Cloud POS',
            'Multi-Branch',
            'Real-Time Reports',
            'Inventory Tracking',
            'Staff Management',
            'Loyalty & Discounts',
          ].map((feature, idx) => (
            <motion.span
              key={feature}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + idx * 0.08 }}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-mintcom-green/40 hover:text-mintcom-green transition-all duration-300 cursor-default"
            >
              {feature}
            </motion.span>
          ))}
        </motion.div>

        {/* CTA teaser */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="mb-16"
        >
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
            From login to first sale in under 10 minutes
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-mintcom-green/10 border border-mintcom-green/20 text-mintcom-green font-bold text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
            We're putting the finishing touches — stay tuned
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          className="pt-8 border-t border-gray-200 dark:border-white/10"
        >
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            © {new Date().getFullYear()} Mintcom Technology • Simple is Superior
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

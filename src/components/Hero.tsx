import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Play, X, ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react';

export const Hero = ({ isVideoOpen, setIsVideoOpen }: { isVideoOpen: boolean; setIsVideoOpen: (open: boolean) => void }) => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white dark:bg-[#0f0f0f]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-paymint-green/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -30, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" 
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-paymint-green/10 text-paymint-green font-medium text-sm mb-8 border border-paymint-green/20"
            >
              <Zap size={14} fill="currentColor" />
              <span>The Future of Restaurant POS</span>
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-bold font-sans text-gray-900 dark:text-white mb-8 leading-[1.1] tracking-tight">
              Manage Less, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-paymint-green to-emerald-400">
                Earn More.
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
              The all-in-one POS platform designed to streamline your operations, empower your staff, and delight your customers from day one.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/signup'}
                className="bg-paymint-green text-black px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-paymint-green/25 transition-all flex items-center justify-center gap-2 group"
              >
                Get Started Free 
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVideoOpen(true)}
                className="bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-3"
              >
                <Play size={20} fill="currentColor" className="text-paymint-green" />
                See How It Works
              </motion.button>
            </div>

            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-sm font-medium text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-paymint-green" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-paymint-green" />
                <span>14-Day Free Trial</span>
              </div>
            </div>
          </motion.div>

          {/* Visual Content / Abstract Dashboard */}
          <motion.div 
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="flex-1 w-full max-w-[600px] lg:max-w-none perspective-1000"
          >
            <div className="relative">
              {/* Abstract Floating Cards */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-none p-6 overflow-hidden transition-colors duration-300"
              >
                {/* Mock Header */}
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-accent/80 dark:bg-accent" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400 dark:bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-paymint-green/80 dark:bg-paymint-green" />
                  </div>
                  <div className="h-2 w-20 bg-gray-100 dark:bg-gray-800 rounded-full" />
                </div>

                {/* Mock Content */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-paymint-green/10 dark:bg-paymint-green/20 rounded-lg">
                        <BarChart3 size={16} className="text-paymint-green" />
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">$12,450</div>
                    <div className="text-xs text-paymint-green mt-1">+15% from yesterday</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                        <Shield size={16} className="text-blue-600 dark:text-blue-500" />
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Orders</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">142</div>
                    <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">Active right now</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        <div>
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2" />
                          <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded-full" />
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-paymint-green/10 dark:bg-paymint-green/20 rounded-full" />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Decorative Elements behind */}
              <motion.div 
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-20px] right-[-20px] w-full h-full bg-gradient-to-br from-paymint-green/20 to-blue-500/20 rounded-3xl -z-10 blur-xl opacity-50"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setIsVideoOpen(false)}
          >
            <button 
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X size={32} />
            </button>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <video 
                src="/demo-video.mp4" 
                controls 
                className="w-full h-full"
              >
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};




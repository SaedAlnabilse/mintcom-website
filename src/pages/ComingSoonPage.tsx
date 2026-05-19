import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

export function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center relative overflow-hidden font-barlow">
      <Helmet>
        <title>Coming Soon | Mintcom POS</title>
      </Helmet>

      {/* Brand-colored decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#7dc6a2]/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#ace2bf]/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Subtle brand grid overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="z-10 text-center px-6 max-w-5xl"
      >
        {/* Official Logo Display */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-12 flex justify-center"
        >
          <img 
            src="/mintcom-logo-white.svg" 
            alt="Mintcom Logo" 
            className="h-16 md:h-20 drop-shadow-xl"
          />
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-tight">
          Modernizing the way <br />
          you <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7dc6a2] via-[#ace2bf] to-[#7dc6a2]">run business.</span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          The ultimate Cloud POS & Business Management platform for growth-minded entrepreneurs. 
          <span className="text-white/70 block mt-2 font-medium">Something big is arriving soon.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <div className="flex items-center gap-3 px-6 py-3 bg-[#1E293B]/40 backdrop-blur-xl border border-white/5 rounded-2xl text-white text-sm font-bold shadow-xl">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7dc6a2] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7dc6a2]"></span>
            </div>
            Finalizing Production Release
          </div>
          <div className="px-6 py-3 bg-[#7dc6a2]/10 border border-[#7dc6a2]/20 backdrop-blur-xl rounded-2xl text-[#7dc6a2] text-sm font-bold shadow-xl">
            Exclusive Launch: Summer 2024
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col items-center">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] font-black mb-6 opacity-60">
            Engineered for Excellence
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-4 items-center justify-center opacity-40">
            <span className="text-white text-sm font-bold hover:text-[#7dc6a2] transition-colors cursor-default">Cloud First</span>
            <span className="text-white text-sm font-bold hover:text-[#7dc6a2] transition-colors cursor-default">AI Powered</span>
            <span className="text-white text-sm font-bold hover:text-[#7dc6a2] transition-colors cursor-default">Enterprise Ready</span>
            <span className="text-white text-sm font-bold hover:text-[#7dc6a2] transition-colors cursor-default">Global Support</span>
          </div>
        </div>
      </motion.div>

      {/* Ambient glowing orbs with brand colors */}
      <div className="absolute top-[20%] right-[-5%] w-80 h-80 bg-[#7dc6a2]/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[20%] left-[-5%] w-80 h-80 bg-[#f8b30a]/5 blur-[120px] rounded-full" />
    </div>
  );
}

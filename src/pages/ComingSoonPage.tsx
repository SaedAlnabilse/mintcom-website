import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function ComingSoonPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden font-barlow selection:bg-[#7dc6a2]/30">
      <Helmet>
        <title>Mintcom POS | Future of Business</title>
      </Helmet>

      {/* Modern Gradient Background Architecture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#7dc6a2]/10 rounded-full blur-[140px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#3b82f6]/5 rounded-full blur-[140px] animate-pulse-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[20%] right-[-5%] w-96 h-96 bg-[#f8b30a]/5 blur-[120px] rounded-full" />
        
        {/* Animated Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Grainy Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 text-center px-6 max-w-4xl w-full"
      >
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-10 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-2xl"
        >
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7dc6a2] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#7dc6a2]"></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
            System Operational • Initializing Release
          </span>
        </motion.div>

        {/* Brand Identity */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 1 }}
          className="mb-14 flex justify-center"
        >
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#7dc6a2]/20 to-[#3b82f6]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <img 
              src="/mintcom-logo-white.svg" 
              alt="Mintcom Logo" 
              className="h-12 md:h-14 relative drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </motion.div>

        {/* Headline Section */}
        <h1 className="text-2xl md:text-4xl font-black text-white mb-6 tracking-tighter leading-[1.1] font-outfit">
          Engineering the future of <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7dc6a2] via-[#ace2bf] to-[#7dc6a2] animate-gradient-x">
            unified business operations.
          </span>
        </h1>
        
        <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto mb-10 font-medium leading-relaxed opacity-80">
          The ultimate Cloud POS & Business Management ecosystem designed for the next generation of global commerce. 
          <span className="text-white/40 block mt-3 font-bold tracking-wider uppercase text-[9px]">Excellence is arriving shortly.</span>
        </p>

        {/* Interactive Features Grid (Miniature) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-20">
          {[
            { label: 'Cloud First', icon: '☁️' },
            { label: 'AI Powered', icon: '🤖' },
            { label: 'Global Scale', icon: '🌐' }
          ].map((feature, idx) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + (idx * 0.1) }}
              className="px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm flex flex-col items-center gap-2 group hover:bg-white/[0.04] transition-all cursor-default"
            >
              <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{feature.icon}</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 group-hover:text-[#7dc6a2] transition-colors">
                {feature.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Fine Print / Credits */}
        <div className="pt-10 border-t border-white/[0.05] flex flex-col items-center">
          <p className="text-slate-500 text-[9px] uppercase tracking-[0.5em] font-black mb-8 opacity-40">
            © 2024 Mintcom Technology • Built for Growth
          </p>
          
          <div className="flex gap-8 items-center opacity-30 hover:opacity-100 transition-opacity duration-500">
             <div className="h-[1px] w-12 bg-white/20" />
             <div className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
             </div>
             <div className="h-[1px] w-12 bg-white/20" />
          </div>
        </div>
      </motion.div>

      {/* Floating Ambient Elements */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] right-[15%] w-2 h-2 rounded-full bg-[#7dc6a2]/40 blur-sm"
      />
      <motion.div 
        animate={{ 
          y: [0, 20, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[15%] left-[15%] w-3 h-3 rounded-full bg-[#3b82f6]/40 blur-sm"
      />
    </div>
  );
}

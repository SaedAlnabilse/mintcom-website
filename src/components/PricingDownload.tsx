import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ArrowRight, Download, Apple, CheckCircle2, Zap, QrCode } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

export const PricingDownload = () => {
    const { t } = useTranslation();
    const [showDetails, setShowDetails] = useState(false);

    // 3D Tilt Effect Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    function handleMouse(event: any) {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(event.clientX - centerX);
        y.set(event.clientY - centerY);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const plan = {
        name: t('landing.pricing.monthlyPlan'),
        price: (20).toLocaleString(t('common.locale'), { style: 'currency', currency: 'JOD', minimumFractionDigits: 0 }),
        period: t('landing.pricing.perMonth'),
        description: t('landing.pricing.planDescription'),
        features: [
            t('landing.pricing.features.pos'),
            t('landing.pricing.features.dashboard'),
            t('landing.pricing.features.unlimitedStaff'),
            t('landing.pricing.features.adminApp'),
            t('landing.pricing.features.support'),
            t('landing.pricing.features.reports')
        ],
        detailedFeatures: [
            t('landing.pricing.features.pointOfSale'),
            t('landing.pricing.features.inventory'),
            t('landing.pricing.features.staffManagement'),
            t('landing.pricing.features.advancedReporting'),
            t('landing.pricing.features.production')
        ],
        cta: t('landing.pricing.startFreeTrial'),
    };

    return (
        <section id="pricing" className="py-24 lg:py-32 bg-gray-50 dark:bg-[#080808] relative overflow-hidden transition-colors duration-500">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-paymint-green/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

            <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
                {/* Header Section */}
                <div className="text-center mb-16 lg:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-paymint-green/10 text-paymint-green font-black text-xs uppercase tracking-[0.2em] mb-6 border border-paymint-green/20"
                    >
                        <Zap size={14} fill="currentColor" />
                        <span>FIFTH SECTION</span>
                    </motion.div>
                    <h2 className="text-5xl lg:text-8xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-none">
                        Get Started
                    </h2>
                    <p className="text-2xl lg:text-3xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto font-black leading-tight">
                        Your “aha” moment is just minutes away.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-stretch gap-12 lg:gap-16">

                    {/* Left Side: Premium Pricing Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="w-full lg:w-[480px] flex-shrink-0"
                    >
                        <div className="relative group h-full">
                            {/* Animated Glow Backdrop */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-paymint-green via-emerald-400 to-blue-500 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                            <div className="relative h-full bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 lg:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-none transition-all duration-500 group-hover:translate-y-[-8px] flex flex-col">

                                {/* Plan Identity */}
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <div className="text-paymint-green text-xs font-black uppercase tracking-widest mb-1 italic">FULL ACCESS</div>
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">$20 / Month Plan</h3>
                                    </div>
                                    <div className="bg-gradient-to-br from-paymint-green to-emerald-500 text-black px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-lg shadow-paymint-green/20">
                                        {t('landing.pricing.popular')}
                                    </div>
                                </div>

                                {/* Price Large Display */}
                                <div className="mb-10">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tighter transition-all group-hover:text-paymint-green">$20</span>
                                        <span className="text-gray-400 dark:text-gray-500 font-black text-xl lg:text-2xl uppercase tracking-tighter">/MONTH</span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm font-bold leading-relaxed italic">
                                        No hidden fees. No setup costs. No commitment.
                                    </p>
                                </div>

                                {/* Feature List - Using Exact Text from Request */}
                                <div className="space-y-6 mb-12 flex-1">
                                    <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-4">Core Benefits</div>
                                    {[
                                        { label: "POS for tablets and mobile devices" },
                                        { label: "Online dashboard & management system" },
                                        { label: "Unlimited staff accounts" },
                                        { label: "Access to the Admin Mobile App" },
                                        { label: "Dedicated customer support" },
                                        { label: "Advanced reports & analytics" }
                                    ].map((f, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-center gap-4"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-paymint-green/10 flex items-center justify-center flex-shrink-0 group-hover:bg-paymint-green transition-colors duration-500">
                                                <Check size={14} className="text-paymint-green group-hover:text-black stroke-[4px] transition-colors duration-500" />
                                            </div>
                                            <div className="text-sm font-black text-gray-900 dark:text-gray-100">{f.label}</div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <div className="space-y-4">
                                    <button
                                        onClick={() => window.open('/signup', '_blank')}
                                        className="w-full py-6 bg-paymint-green text-black rounded-[1.5rem] font-black text-xl shadow-[0_20px_40px_-12px_rgba(0,186,124,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                                        <span className="relative z-10">{plan.cta}</span>
                                        <ArrowRight size={22} className="relative z-10 transition-transform group-hover/btn:translate-x-2" />
                                    </button>

                                    <div className="flex items-center justify-center gap-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={14} className="text-paymint-green" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">7-Day Free Trial</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side: Aha Moment & Download */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 flex flex-col justify-between py-4"
                    >
                        {/* The "Aha Moment" Section */}
                        <div className="mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500 font-black text-[10px] uppercase tracking-[0.2em] mb-6 border border-blue-500/20">
                                <Zap size={12} fill="currentColor" />
                                <span>The Revelation</span>
                            </div>

                            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter leading-tight">
                                That <span className="italic font-serif text-paymint-green">"Everything Just Works"</span> Feeling.
                            </h2>

                            <div className="space-y-8 relative">
                                <div className="absolute left-[-24px] top-0 bottom-0 w-px bg-gradient-to-b from-paymint-green via-transparent to-transparent opacity-30 hidden md:block" />

                                <blockquote className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium italic">
                                    "The first time you check your phone while away from the shop and see a live sale notification pop up—knowing exactly how your business is performing without calling anyone... <span className="text-gray-900 dark:text-white font-black not-italic">that's when everything clicks.</span>"
                                </blockquote>

                                {/* Visual Mockup of the "Aha Moment" */}
                                <div className="relative h-24 max-w-sm">
                                    <motion.div
                                        initial={{ x: 50, opacity: 0 }}
                                        whileInView={{ x: 0, opacity: 1 }}
                                        viewport={{ once: true }}
                                        className="absolute top-0 right-0 left-0 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-4 border border-paymint-green/20 flex items-center gap-4 animate-bounce-subtle"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-paymint-green flex items-center justify-center">
                                            <Check size={20} className="text-black stroke-[3px]" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-paymint-green">Sale Confirmed</span>
                                                <span className="text-[10px] text-gray-400">Just now</span>
                                            </div>
                                            <div className="text-sm font-black text-gray-900 dark:text-white">$145.50 - Table 04</div>
                                        </div>
                                    </motion.div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#080808] to-transparent z-10 h-full pointer-events-none" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ring-1 ring-gray-100 dark:ring-white/5 p-8 rounded-[2rem] bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm">
                                    <div>
                                        <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-2">Multi-Branch Mastery</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-bold">
                                            Scale from one shop to ten with a few clicks. Centralized control over products, staff, and performance from a single universal dashboard.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-2">Total Visibility</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-bold">
                                            Accurate, real-time data access enables faster checkout experiences and smooth daily operations. No more guesswork, just pure visibility.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Compact Download Section Design with 3D Tilt */}
                        <motion.div
                            style={{ perspective: 1000, rotateX, rotateY }}
                            onMouseMove={handleMouse}
                            onMouseLeave={handleMouseLeave}
                            className="relative group/card mt-4" // Reduced top margin
                        >
                            {/* Outer Glow Effect */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-paymint-green/30 to-blue-500/30 rounded-[2rem] blur opacity-10 group-hover/card:opacity-60 transition duration-500" />

                            <div className="relative bg-black dark:bg-[#080808] rounded-[2rem] p-6 lg:p-8 border border-white/10 overflow-hidden shadow-2xl">
                                {/* Abstract Background Decoration - Scaled Down */}
                                <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-paymint-green/10 rounded-full blur-[80px] pointer-events-none group-hover/card:bg-paymint-green/20 transition-all duration-1000" />
                                <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none group-hover/card:bg-blue-600/20 transition-all duration-1000" />

                                <div className="flex flex-col xl:flex-row items-center gap-8 relative z-10">
                                    <div className="flex-1 text-center xl:text-left">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
                                            <div className="w-2 h-2 rounded-full bg-paymint-green animate-pulse" />
                                            <span className="text-white text-[8px] font-black uppercase tracking-[0.3em]">{t('landing.download.getApp')}</span>
                                        </div>

                                        <h3 className="text-3xl lg:text-4xl font-black text-white mb-3 tracking-tighter uppercase leading-tight">
                                            Test It <span className="text-transparent bg-clip-text bg-gradient-to-r from-paymint-green via-emerald-400 to-blue-400">Firsthand</span>
                                        </h3>

                                        <p className="text-gray-400 text-sm font-bold max-w-sm mx-auto xl:mx-0">
                                            Powerful POS features, ready for your tablets today.
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                                        {/* Android APK Button - Compact */}
                                        <motion.a
                                            href={import.meta.env.VITE_ANDROID_DOWNLOAD_URL || '/downloads/paymint-android.apk'}
                                            download
                                            whileHover={{ y: -5, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full sm:w-auto relative overflow-hidden group/dl bg-white text-black py-4 px-6 rounded-2xl flex items-center justify-center gap-4 shadow-xl transition-all"
                                        >
                                            <Download className="w-6 h-6" />
                                            <div className="text-left">
                                                <div className="text-[8px] font-black uppercase tracking-[0.1em] opacity-40 leading-none mb-1">Android</div>
                                                <div className="text-xl font-black leading-none tracking-tighter uppercase">APK</div>
                                            </div>
                                        </motion.a>

                                        {/* iOS - Coming Soon */}
                                        <div
                                            className="w-full sm:w-auto relative overflow-hidden bg-white/5 border border-white/10 text-gray-500 py-4 px-6 rounded-2xl flex items-center justify-center gap-4 backdrop-blur-sm cursor-not-allowed"
                                        >
                                            <Apple className="w-6 h-6 opacity-50" />
                                            <div className="text-left">
                                                <div className="text-[8px] font-black uppercase tracking-[0.1em] opacity-50 leading-none mb-1">iOS</div>
                                                <div className="text-xl font-black leading-none tracking-tighter uppercase italic">Coming Soon</div>
                                            </div>
                                        </a>

                                        {/* Minimal Scan Hint */}
                                        <div className="hidden lg:flex items-center gap-3 py-2 px-4 rounded-2xl border border-white/5 bg-white/5">
                                            <QrCode className="w-5 h-5 text-white opacity-20" />
                                            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] leading-tight">PREVIEW<br />SCAN</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    </motion.div>

                </div>
            </div>

            {/* Plan Details Modal */}
            <AnimatePresence>
                {showDetails && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDetails(false)}
                            className="absolute inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xl"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-[#1a1a1a] w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/5"
                        >
                            <div className="p-10">
                                <div className="text-center mb-10">
                                    <div className="inline-block bg-paymint-green/20 text-paymint-green px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4">
                                        Detailed View
                                    </div>
                                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">{plan.name}</h2>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-5xl font-black text-paymint-green">{plan.price}</span>
                                        <span className="text-gray-500 font-bold">{plan.period}</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-8 mb-10 border border-gray-100 dark:border-white/5">
                                    <h4 className="font-black text-gray-900 dark:text-white mb-6 text-xs uppercase tracking-[0.2em]">{t('pricing.whatsIncluded')}</h4>
                                    <ul className="grid grid-cols-1 gap-4">
                                        {[...plan.features, ...plan.detailedFeatures].map((feature, i) => (
                                            <li key={i} className="flex items-start gap-4 text-gray-700 dark:text-gray-300">
                                                <Check size={18} className="text-paymint-green mt-0.5 flex-shrink-0 stroke-[3px]" />
                                                <span className="text-sm font-bold">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => {
                                        window.open('/signup', '_blank');
                                        setShowDetails(false);
                                    }}
                                    className="w-full bg-paymint-green text-black py-5 rounded-2xl font-black text-lg transition-transform active:scale-95 shadow-xl shadow-paymint-green/20"
                                >
                                    {plan.cta}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};

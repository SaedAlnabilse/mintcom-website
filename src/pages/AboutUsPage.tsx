import { motion } from 'framer-motion';
import { Target, Shield, Zap, Globe, Heart, Award, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const AboutUsPage = () => {
    const stats = [
        { label: 'Active Users', value: '50k+' },
        { label: 'Transactions Processed', value: '$1B+' },
        { label: 'Countries Supported', value: '30+' },
        { label: 'Team Members', value: '100+' },
    ];

    const values = [
        {
            icon: Target,
            title: 'Mission Driven',
            description: 'We are dedicated to revolutionizing the payment industry with accessible and secure solutions.'
        },
        {
            icon: Shield,
            title: 'Security First',
            description: 'Your data and transactions are protected by bank-grade security and encryption protocols.'
        },
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Experience real-time processing and instant settlements that keep your business moving.'
        },
        {
            icon: Heart,
            title: 'Customer Obsessed',
            description: 'Our 24/7 support team is always ready to help you succeed and grow your business.'
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white overflow-x-hidden font-sans">
            <Navbar />
            
            {/* Hero Section */}
            <div className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-paymint-green/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                
                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest uppercase mb-6">
                            About Paymint
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">
                            Building the Future of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-paymint-green to-emerald-600">
                                Digital Payments
                            </span>
                        </h1>
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            We're on a mission to empower businesses of all sizes with the tools they need to thrive in the digital economy. Simple, secure, and limitless.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-20 bg-gray-50 dark:bg-black/20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-xs font-black text-gray-400 tracking-widest uppercase">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Our Story / Vision */}
            <div className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative"
                        >
                            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 p-1">
                                <div className="w-full h-full rounded-2xl bg-[#0F172A] flex items-center justify-center relative overflow-hidden">
                                     {/* Placeholder visual */}
                                     <div className="absolute inset-0 bg-gradient-to-br from-paymint-green/20 to-transparent opacity-30" />
                                     <Globe className="w-32 h-32 text-paymint-green relative z-10 opacity-80" />
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-6 flex flex-col justify-center border border-gray-100 dark:border-white/5">
                                <Award className="w-10 h-10 text-amber-500 mb-3" />
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">#1</div>
                                <div className="text-xs font-black text-gray-400 tracking-widest">Rated Payment Solution</div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                                Driven by Innovation, <br />
                                Grounded in Trust.
                            </h2>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                Founded in 2024, Paymint started with a simple idea: payments shouldn't be complicated. We saw businesses struggling with clunky interfaces, hidden fees, and slow settlements. We knew there had to be a better way.
                            </p>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                Today, we help thousands of merchants across the globe manage their finances with ease. Our platform combines cutting-edge technology with intuitive design, making financial management accessible to everyone.
                            </p>
                            
                            <ul className="space-y-4">
                                {['Global Reach, Local Support', 'Transparent Pricing', 'Developer Friendly API'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-paymint-green/20 flex items-center justify-center">
                                            <CheckCircle2 size={14} className="text-paymint-green" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Core Values */}
            <div className="py-24 bg-gray-50 dark:bg-[#1E293B]/50 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Our Core Values</h2>
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            These principles guide every decision we make and every product we build.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-[#0F172A] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-paymint-green/30 transition-all group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-paymint-green/10">
                                    <value.icon className="w-7 h-7 text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                                    {value.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

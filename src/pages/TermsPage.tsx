import { motion } from 'framer-motion';
import { Scale, CheckCircle2, AlertCircle, Shield, Zap, Info } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const TermsPage = () => {
    const highlights = [
        {
            icon: Scale,
            title: 'Acceptance of Terms',
            content: 'By accessing or using Paymint, you agree to be bound by these Terms of Use and all applicable laws and regulations.'
        },
        {
            icon: Shield,
            title: 'User Responsibilities',
            content: 'Users are responsible for maintaining the confidentiality of their account and password and for restricting access to their account.'
        },
        {
            icon: Zap,
            title: 'Service Limitations',
            content: 'We reserve the right to modify or discontinue the service at any time without notice. We are not liable for any service interruptions.'
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white font-inter">
            <Navbar />
            
            {/* Header */}
            <div className="pt-32 pb-16 px-6 bg-gray-50 dark:bg-black/20">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                            <Scale className="w-8 h-8 text-blue-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Terms of Use</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
                            Last Updated: February 2, 2026
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {highlights.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-center"
                            >
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <item.icon className="w-5 h-5 text-blue-500" />
                                </div>
                                <h3 className="text-base font-bold mb-2">{item.title}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {item.content}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="space-y-10 text-gray-600 dark:text-gray-300">
                        <section>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <Info className="text-blue-500" />
                                1. License to Use
                            </h2>
                            <p>
                                Subject to your compliance with these Terms, Paymint grants you a limited, non-exclusive, non-transferable license to use our services for your business purposes. You may not use the services for any illegal or unauthorized purpose.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <AlertCircle className="text-amber-500" />
                                2. Prohibited Conduct
                            </h2>
                            <ul className="space-y-4">
                                {[
                                    'Copying, modifying, or distributing any part of the service.',
                                    'Reverse engineering or attempting to extract the source code.',
                                    'Interfering with the security or performance of the service.',
                                    'Using the service for fraudulent activities.'
                                ].map((text, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        </div>
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="p-8 rounded-3xl bg-blue-500/5 border border-blue-500/20">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                <CheckCircle2 className="text-blue-500" />
                                3. Termination
                            </h3>
                            <p className="text-sm">
                                We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

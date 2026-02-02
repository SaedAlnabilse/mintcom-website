import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Globe, Bell } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PrivacyPolicyPage = () => {
    const sections = [
        {
            icon: Eye,
            title: 'Information We Collect',
            content: 'We collect information you provide directly to us when you create an account, use our services, or communicate with us. This includes your name, email address, phone number, and payment information.'
        },
        {
            icon: Lock,
            title: 'How We Use Your Data',
            content: 'We use the information we collect to provide, maintain, and improve our services, to process transactions, and to communicate with you about products, services, and events.'
        },
        {
            icon: Shield,
            title: 'Data Security',
            content: 'We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.'
        },
        {
            icon: Globe,
            title: 'International Transfers',
            content: 'Information about you may be transferred to, and maintained on, computers located outside of your state or country where the data protection laws may differ.'
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
                        <div className="w-16 h-16 rounded-2xl bg-paymint-green/10 flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-8 h-8 text-paymint-green" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Privacy Policy</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
                            Last Updated: February 2, 2026
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-12">
                        At Paymint, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and share information about you when you use our website and services.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        {sections.map((section, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="p-8 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center mb-6 shadow-sm">
                                    <section.icon className="w-6 h-6 text-paymint-green" />
                                </div>
                                <h3 className="text-xl font-bold mb-4">{section.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {section.content}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="space-y-12 text-gray-600 dark:text-gray-300">
                        <section>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <FileText className="text-paymint-green" />
                                Detailed Information
                            </h2>
                            <p className="mb-4">
                                We collect various types of information to provide and improve our service to you. This includes usage data, cookies, and tracking technologies. We may share your information with third-party vendors who perform services on our behalf.
                            </p>
                            <p>
                                You have the right to access, correct, or delete your personal data. If you have any questions about this Privacy Policy, please contact us at privacy@paymint.com.
                            </p>
                        </section>

                        <section className="p-8 rounded-3xl bg-paymint-green/5 border border-paymint-green/20">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                <Bell className="text-paymint-green" />
                                Policy Updates
                            </h3>
                            <p className="text-sm">
                                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

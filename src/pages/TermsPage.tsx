import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const TermsPage = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white font-sans">
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Terms of Service</h1>
                        <p className="text-xs font-black text-gray-400 tracking-widest">
                            LAST UPDATED: FEBRUARY 5TH, 2025
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed mb-12">
                        These Terms of Service ("Terms") govern your access to and use of PayMint’s Point of Sale system, mobile applications, websites, and related services ("Services"). By creating an account or using PayMint, you agree to be bound by these Terms.
                    </p>

                    <div className="space-y-12 text-gray-600 dark:text-gray-300">
                        {/* 1. Use of the Service */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Use of the Service</h2>
                            <p className="text-sm font-medium mb-4">
                                PayMint provides cloud-based POS and business management software for commercial use. You must be at least 18 years old and authorized to act on behalf of the business you register to use the Services.
                            </p>
                            <p className="text-sm font-medium">
                                You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account.
                            </p>
                        </section>

                        {/* 2. Subscriptions & Payments */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Subscriptions & Payments</h2>
                            <p className="text-sm font-medium mb-4">
                                Certain features of PayMint require a paid subscription. Fees are billed on a monthly or yearly basis, depending on the selected plan option.
                            </p>
                            <p className="text-sm font-medium">
                                All payments are non-refundable unless otherwise stated. PayMint reserves the right to update pricing with prior notice.
                            </p>
                        </section>

                        {/* 3. User Responsibilities */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. User Responsibilities</h2>
                            <p className="text-sm font-medium mb-4">You agree not to:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>Use the Services for unlawful or fraudulent activities</li>
                                <li>Attempt to access systems or data not authorized to you</li>
                                <li>Interfere with or disrupt the operation of the Services</li>
                            </ul>
                            <p className="text-sm font-medium">
                                You are responsible for the accuracy of all data entered into the system.
                            </p>
                        </section>

                        {/* 4. Data & Privacy */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Data & Privacy</h2>
                            <p className="text-sm font-medium">
                                Your use of PayMint is subject to our <a href="/privacy-policy" className="text-blue-500 hover:underline">Privacy Policy</a>, which explains how we collect, use, and protect your information. By using the Services, you consent to our data practices as described in the Privacy Policy.
                            </p>
                        </section>

                        {/* 5. Service Availability */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Service Availability</h2>
                            <p className="text-sm font-medium">
                                While we strive to provide reliable and uninterrupted access, PayMint does not guarantee that the Services will always be available or error-free. Maintenance, updates, or technical issues may result in temporary interruptions.
                            </p>
                        </section>

                        {/* 6. Intellectual Property */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Intellectual Property</h2>
                            <p className="text-sm font-medium">
                                All software, trademarks, designs, and content related to PayMint are the exclusive property of PayMint LLC. You may not copy, modify, or distribute any part of the Services without written permission.
                            </p>
                        </section>

                        {/* 7. Limitation of Liability */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">7. Limitation of Liability</h2>
                            <p className="text-sm font-medium">
                                To the maximum extent permitted by law, PayMint shall not be liable for any indirect, incidental, or consequential damages, including loss of profits, data, or business operations resulting from the use of the Services.
                            </p>
                        </section>

                        {/* 8. Termination */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">8. Termination</h2>
                            <p className="text-sm font-medium">
                                PayMint may suspend or terminate access to the Services if these Terms are violated. You may stop using the Services at any time by canceling your subscription.
                            </p>
                        </section>

                        {/* 9. Governing Law */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">9. Governing Law</h2>
                            <p className="text-sm font-medium">
                                These Terms are governed by and interpreted in accordance with the laws of the Hashemite Kingdom of Jordan, unless otherwise required by applicable law.
                            </p>
                        </section>

                        {/* 10. Contact */}
                        <section className="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/5">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">10. Contact</h2>
                            <p className="text-sm font-medium mb-4">
                                For questions regarding these Terms, please contact us at:
                            </p>
                            <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                <a href="mailto:support@paymint.com" className="text-blue-500 hover:underline">support@paymint.com</a>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

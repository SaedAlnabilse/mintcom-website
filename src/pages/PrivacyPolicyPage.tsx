import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PrivacyPolicyPage = () => {
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
                        <div className="w-16 h-16 rounded-2xl bg-paymint-green/10 flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-8 h-8 text-paymint-green" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Privacy Policy</h1>
                        <p className="text-xs font-black text-gray-400 tracking-widest">
                            LAST UPDATED: FEBRUARY 5TH, 2025
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                        PayMint LLC ("PayMint", "we", "our", or "us") respects your privacy and is committed to protecting the personal and business information of our users. This Privacy Policy explains how we collect, use, store, share, and protect your information when you use the PayMint Point of Sale system, mobile applications, websites, and related services (collectively, the "Services").
                    </p>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed mb-12">
                        By using PayMint, you agree to the practices described in this Privacy Policy.
                    </p>

                    <div className="space-y-12 text-gray-600 dark:text-gray-300">

                        {/* 1. Information We Collect */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
                            <p className="text-sm font-medium mb-4">We collect information necessary to provide and improve our Services.</p>

                            <div className="mb-6 pl-4 border-l-2 border-paymint-green/20">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">1.1 Personal Information</h3>
                                <p className="text-sm font-medium mb-2">This may include:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm font-medium">
                                    <li>Full name</li>
                                    <li>Email address</li>
                                    <li>Mobile phone number</li>
                                    <li>Business name and location</li>
                                    <li>Account login credentials</li>
                                </ul>
                            </div>

                            <div className="mb-6 pl-4 border-l-2 border-paymint-green/20">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">1.2 Payment Information</h3>
                                <p className="text-sm font-medium mb-2">When you subscribe to PayMint or process payments:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm font-medium mb-4">
                                    <li>Credit and debit card details</li>
                                    <li>Billing address</li>
                                    <li>Transaction identifiers</li>
                                </ul>
                                <div className="bg-paymint-green/5 p-4 rounded-xl border border-paymint-green/20">
                                    <p className="text-xs font-bold text-gray-500">
                                        <span className="text-paymint-green font-black">Note:</span> Payment information is processed securely through third-party payment processors. PayMint does not store full card numbers or CVV codes on its servers unless explicitly stated and legally permitted.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6 pl-4 border-l-2 border-paymint-green/20">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">1.3 Business & Operational Data</h3>
                                <p className="text-sm font-medium mb-2">Collected through your use of the POS system:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm font-medium">
                                    <li>Sales transactions</li>
                                    <li>Products, pricing, and inventory</li>
                                    <li>Staff profiles, roles, and shifts</li>
                                    <li>Customer profiles and loyalty data</li>
                                    <li>Reports, analytics, and operational metrics</li>
                                </ul>
                            </div>

                            <div className="pl-4 border-l-2 border-paymint-green/20">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">1.4 Technical & Usage Data</h3>
                                <p className="text-sm font-medium mb-2">Automatically collected data may include:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm font-medium">
                                    <li>Device type, operating system, and app version</li>
                                    <li>IP address</li>
                                    <li>Log files and usage activity</li>
                                    <li>Cookies and similar tracking technologies (for the website and dashboard)</li>
                                </ul>
                            </div>
                        </section>

                        {/* 2. How We Use Your Information */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
                            <p className="text-sm font-medium mb-4">We use your data to:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>Provide, operate, and maintain PayMint Services</li>
                                <li>Process transactions and subscriptions</li>
                                <li>Enable POS functionality and reporting</li>
                                <li>Manage accounts, branches, and staff access</li>
                                <li>Improve system performance and user experience</li>
                                <li>Communicate updates, support responses, and service notices</li>
                                <li>Detect fraud, abuse, or security threats</li>
                                <li>Comply with legal and regulatory obligations</li>
                            </ul>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">We do not sell your personal or business data to third parties.</p>
                        </section>

                        {/* 3. Data Storage & Security */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Data Storage & Security</h2>
                            <p className="text-sm font-medium mb-4">All data is stored securely using industry-standard safeguards, including:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>Data encryption in transit and at rest</li>
                                <li>Secure cloud infrastructure</li>
                                <li>Restricted internal access controls</li>
                                <li>Regular system monitoring and updates</li>
                            </ul>
                            <p className="text-xs font-medium text-gray-500 italic">
                                While we take extensive measures to protect your data, no system is 100% secure. Users are responsible for keeping their login credentials confidential.
                            </p>
                        </section>

                        {/* 4. Data Sharing & Third Parties */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Data Sharing & Third Parties</h2>
                            <p className="text-sm font-medium mb-4">We may share limited data only with:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>Trusted service providers (hosting, analytics, payment processors)</li>
                                <li>Legal authorities if required by law, court order, or regulation</li>
                                <li>Business partners strictly necessary to deliver Services</li>
                            </ul>
                            <p className="text-sm font-medium">
                                All third parties are contractually obligated to protect your data and use it only for authorized purposes.
                            </p>
                        </section>

                        {/* 5. Multi-Branch & Account Access */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Multi-Branch & Account Access</h2>
                            <p className="text-sm font-medium mb-4">If you manage multiple establishments:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm font-medium">
                                <li>Data may be shared internally between branches under the same account</li>
                                <li>Owners and authorized account managers can control access permissions</li>
                                <li>Responsibility for internal data access rests with the account owner</li>
                            </ul>
                        </section>

                        {/* 6. Data Retention */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Data Retention</h2>
                            <p className="text-sm font-medium mb-4">We retain your information:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>For as long as your account is active</li>
                                <li>As needed to comply with legal, tax, or accounting requirements</li>
                                <li>To resolve disputes and enforce agreements</li>
                            </ul>
                            <p className="text-sm font-medium">You may request account deletion, subject to legal retention obligations.</p>
                        </section>

                        {/* 7. Your Rights */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">7. Your Rights</h2>
                            <p className="text-sm font-medium mb-4">Depending on your jurisdiction, you may have the right to:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>Access your personal data</li>
                                <li>Correct or update inaccurate information</li>
                                <li>Request deletion of your data</li>
                                <li>Restrict or object to certain processing activities</li>
                            </ul>
                            <p className="text-sm font-medium">
                                Requests can be submitted on your account management section or by contacting us at: <a href="mailto:privacy@paymint.com" className="text-paymint-green hover:underline font-bold">privacy@paymint.com</a>
                            </p>
                        </section>

                        {/* 8. Cookies & Tracking Technologies */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">8. Cookies & Tracking Technologies</h2>
                            <p className="text-sm font-medium mb-4">We use cookies and similar technologies to:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>Improve website functionality</li>
                                <li>Analyze traffic and usage trends</li>
                                <li>Enhance user experience</li>
                            </ul>
                            <p className="text-sm font-medium">You can manage cookie preferences through your browser settings.</p>
                        </section>

                        {/* 9. International Operations */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">9. International Operations</h2>
                            <p className="text-sm font-medium">
                                PayMint LLC operates globally. Your data may be stored or processed in countries outside your own, including jurisdictions with different data protection laws. We take steps to ensure appropriate safeguards are in place.
                            </p>
                        </section>

                        {/* 10. Children’s Privacy */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">10. Children’s Privacy</h2>
                            <p className="text-sm font-medium">
                                PayMint is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from minors.
                            </p>
                        </section>

                        {/* 11. Changes to This Policy */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">11. Changes to This Policy</h2>
                            <p className="text-sm font-medium">
                                We may update this Privacy Policy from time to time. Any changes will be posted on this page, and the "Last Updated" date will be revised accordingly. Continued use of the Services constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        {/* 12. Contact Us */}
                        <section className="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/5">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">12. Contact Us</h2>
                            <p className="text-sm font-medium mb-4">
                                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                                    <span className="text-gray-900 dark:text-white">PayMint LLC</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                    <span className="w-20">Email:</span>
                                    <a href="mailto:privacy@paymint.com" className="text-paymint-green hover:underline">privacy@paymint.com</a>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                    <span className="w-20">Website:</span>
                                    <a href="https://www.paymint.com" target="_blank" rel="noopener noreferrer" className="text-paymint-green hover:underline">www.paymint.com</a>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

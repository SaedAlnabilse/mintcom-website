import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const TermsPage = () => {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">{t('legal.terms.title')}</h1>
                        <p className="text-xs font-black text-gray-400 tracking-widest">
                            {t('legal.terms.lastUpdated')}: {new Date('2025-02-05').toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed mb-12">
                        {t('legal.terms.intro')}
                    </p>

                    <div className="space-y-12 text-gray-600 dark:text-gray-300">
                        {/* 1. Use of the Service */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.terms.sections.s1')}</h2>
                            <p className="text-sm font-medium mb-4">
                                {t('legal.terms.use.u1')}
                            </p>
                            <p className="text-sm font-medium">
                                {t('legal.terms.use.u2')}
                            </p>
                        </section>

                        {/* 2. Subscriptions & Payments */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.terms.sections.s2')}</h2>
                            <p className="text-sm font-medium mb-4">
                                {t('legal.terms.payments.p1')}
                            </p>
                            <p className="text-sm font-medium mb-4">
                                {t('legal.terms.payments.p2')}
                            </p>
                            <p className="text-sm font-medium">
                                {t('legal.terms.payments.p3')}
                            </p>
                        </section>

                        {/* 3. User Responsibilities */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.terms.sections.s3')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.terms.responsibilities.intro')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.terms.responsibilities.r1')}</li>
                                <li>{t('legal.terms.responsibilities.r2')}</li>
                                <li>{t('legal.terms.responsibilities.r3')}</li>
                            </ul>
                            <p className="text-sm font-medium">
                                {t('legal.terms.responsibilities.accuracy')}
                            </p>
                        </section>

                        {/* 4. Data & Privacy */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.terms.sections.s4')}</h2>
                            <p className="text-sm font-medium">
                                {t('legal.terms.privacy.p1')} <Link to="/legal/privacy" className="text-blue-500 hover:underline">{t('legal.privacy.title')}</Link>, {t('legal.terms.privacy.p2')}
                            </p>
                        </section>

                        {/* 5. Service Availability */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.terms.sections.s5')}</h2>
                            <p className="text-sm font-medium">
                                {t('legal.terms.availability.desc')}
                            </p>
                        </section>

                        {/* 6. Intellectual Property */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.terms.sections.s6')}</h2>
                            <p className="text-sm font-medium">
                                {t('legal.terms.ip.desc')}
                            </p>
                        </section>

                        {/* 7. Limitation of Liability */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.terms.sections.s7')}</h2>
                            <p className="text-sm font-medium">
                                {t('legal.terms.liability.desc')}
                            </p>
                        </section>

                        {/* 8. Termination */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.terms.sections.s8')}</h2>
                            <p className="text-sm font-medium mb-4">
                                {t('legal.terms.termination.desc')}
                            </p>
                            <p className="text-sm font-medium">
                                {t('legal.terms.termination.deletion')}
                            </p>
                        </section>

                        {/* 9. Governing Law */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.terms.sections.s9')}</h2>
                            <p className="text-sm font-medium">
                                {t('legal.terms.law.desc')}
                            </p>
                        </section>

                        {/* 10. Contact */}
                        <section className="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/5">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.terms.sections.s10')}</h2>
                            <p className="text-sm font-medium mb-4">
                                {t('legal.terms.contact.desc')}
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

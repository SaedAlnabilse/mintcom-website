import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PrivacyPolicyPage = () => {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            <Helmet>
                <title>{t('metadata.privacy.title')}</title>
                <meta name="description" content={t('metadata.privacy.description')} />
                <meta property="og:title" content={t('metadata.privacy.title')} />
                <meta property="og:description" content={t('metadata.privacy.description')} />
            </Helmet>
            <Navbar />

            {/* Header */}
            <div className="pt-32 pb-16 px-6 bg-gray-50 dark:bg-black/20">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-mintcom-green/10 flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-8 h-8 text-mintcom-green" />
                        </div>
                        <h1 className="font-magilio text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">{t('legal.privacy.title')}</h1>
                        <p className="label-strong font-outfit">
                            {t('legal.privacy.lastUpdated')}: {new Date('2026-05-29').toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                        {t('legal.privacy.intro')}
                    </p>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed mb-12">
                        {t('legal.privacy.agreement')}
                    </p>

                    <div className="space-y-12 text-gray-600 dark:text-gray-300">

                        {/* 1. Information We Collect */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s1')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s1_desc')}</p>

                            <div className={`mb-6 ${t('common.locale') === 'ar' ? 'pr-4 border-r-2' : 'pl-4 border-l-2'} border-mintcom-green/20`}>
                                <h3 className="font-magilio text-lg font-bold text-gray-900 dark:text-white mb-3">{t('legal.privacy.sections.s1_1')}</h3>
                                <p className="text-sm font-medium mb-2">{t('legal.privacy.sections.s1_1_desc')}:</p>
                                <ul className="list-disc pr-5 pl-5 space-y-1 text-sm font-medium">
                                    <li>{t('legal.privacy.fields.fullName')}</li>
                                    <li>{t('legal.privacy.fields.email')}</li>
                                    <li>{t('legal.privacy.fields.phone')}</li>
                                    <li>{t('legal.privacy.fields.businessInfo')}</li>
                                    <li>{t('legal.privacy.fields.credentials')}</li>
                                </ul>
                            </div>

                            <div className={`mb-6 ${t('common.locale') === 'ar' ? 'pr-4 border-r-2' : 'pl-4 border-l-2'} border-mintcom-green/20`}>
                                <h3 className="font-magilio text-lg font-bold text-gray-900 dark:text-white mb-3">{t('legal.privacy.sections.s1_2')}</h3>
                                <p className="text-sm font-medium mb-2">{t('legal.privacy.sections.s1_2_desc')}:</p>
                                <ul className="list-disc pr-5 pl-5 space-y-1 text-sm font-medium mb-4">
                                    <li>{t('legal.privacy.fields.cardDetails')}</li>
                                    <li>{t('legal.privacy.fields.billingAddress')}</li>
                                    <li>{t('legal.privacy.fields.transactionIds')}</li>
                                </ul>
                                <div className="bg-mintcom-green/5 p-4 rounded-xl border border-mintcom-green/20">
                                    <p className="text-xs font-bold text-gray-500">
                                        <span className="text-mintcom-green font-black">{t('common.note')}:</span> {t('legal.privacy.sections.s1_2_note')}
                                    </p>
                                </div>
                            </div>

                            <div className={`mb-6 ${t('common.locale') === 'ar' ? 'pr-4 border-r-2' : 'pl-4 border-l-2'} border-mintcom-green/20`}>
                                <h3 className="font-magilio text-lg font-bold text-gray-900 dark:text-white mb-3">{t('legal.privacy.sections.s1_3')}</h3>
                                <p className="text-sm font-medium mb-2">{t('legal.privacy.sections.s1_3_desc')}:</p>
                                <ul className="list-disc pr-5 pl-5 space-y-1 text-sm font-medium">
                                    <li>{t('legal.privacy.fields.sales')}</li>
                                    <li>{t('legal.privacy.fields.products')}</li>
                                    <li>{t('legal.privacy.fields.staff')}</li>
                                    <li>{t('legal.privacy.fields.loyalty')}</li>
                                    <li>{t('legal.privacy.fields.analytics')}</li>
                                </ul>
                            </div>

                            <div className={`${t('common.locale') === 'ar' ? 'pr-4 border-r-2' : 'pl-4 border-l-2'} border-mintcom-green/20`}>
                                <h3 className="font-magilio text-lg font-bold text-gray-900 dark:text-white mb-3">{t('legal.privacy.sections.s1_4')}</h3>
                                <p className="text-sm font-medium mb-2">{t('legal.privacy.sections.s1_4_desc')}:</p>
                                <ul className="list-disc pr-5 pl-5 space-y-1 text-sm font-medium">
                                    <li>{t('legal.privacy.fields.deviceInfo')}</li>
                                    <li>{t('legal.privacy.fields.ipAddress')}</li>
                                    <li>{t('legal.privacy.fields.usageLogs')}</li>
                                    <li>{t('legal.privacy.fields.cookies')}</li>
                                </ul>
                            </div>
                        </section>

                        {/* 2. How We Use Your Information */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s2')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s2_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.usage.u1')}</li>
                                <li>{t('legal.privacy.usage.u2')}</li>
                                <li>{t('legal.privacy.usage.u3')}</li>
                                <li>{t('legal.privacy.usage.u4')}</li>
                                <li>{t('legal.privacy.usage.u5')}</li>
                                <li>{t('legal.privacy.usage.u6')}</li>
                                <li>{t('legal.privacy.usage.u7')}</li>
                                <li>{t('legal.privacy.usage.u8')}</li>
                            </ul>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{t('legal.privacy.usage.noSell')}</p>
                        </section>

                        {/* 3. Data Storage & Security */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s3')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s3_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.security.sec1')}</li>
                                <li>{t('legal.privacy.security.sec2')}</li>
                                <li>{t('legal.privacy.security.sec3')}</li>
                                <li>{t('legal.privacy.security.sec4')}</li>
                            </ul>
                            <p className="text-xs font-medium text-gray-500 italic">
                                {t('legal.privacy.security.noAbsoluteSecurity')}
                            </p>
                        </section>

                        {/* 4. Data Sharing & Third Parties */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s4')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s4_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.sharing.sh1')}</li>
                                <li>{t('legal.privacy.sharing.sh2')}</li>
                                <li>{t('legal.privacy.sharing.sh3')}</li>
                            </ul>
                            <p className="text-sm font-medium">
                                {t('legal.privacy.sharing.obligation')}
                            </p>
                        </section>

                        {/* 5. Multi-Branch & Account Access */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s5')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s5_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium">
                                <li>{t('legal.privacy.branch.b1')}</li>
                                <li>{t('legal.privacy.branch.b2')}</li>
                                <li>{t('legal.privacy.branch.b3')}</li>
                            </ul>
                        </section>

                        {/* 6. Data Retention & Account Deletion */}
                        <section id="account-deletion">
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s6')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s6_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.retention.r1')}</li>
                                <li>{t('legal.privacy.retention.r2')}</li>
                                <li>{t('legal.privacy.retention.r3')}</li>
                            </ul>
                            <p className="text-sm font-medium">{t('legal.privacy.retention.deletionRequest')}</p>
                        </section>

                        {/* 7. Your Rights */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s7')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s7_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.rights.ri1')}</li>
                                <li>{t('legal.privacy.rights.ri2')}</li>
                                <li>{t('legal.privacy.rights.ri3')}</li>
                                <li>{t('legal.privacy.rights.ri4')}</li>
                            </ul>
                            <p className="text-sm font-medium">
                                {t('legal.privacy.rights.contact')} <a href="mailto:support@mintcompos.com" className="text-mintcom-green hover:underline font-bold">support@mintcompos.com</a>
                            </p>
                        </section>

                        {/* Account and Data Deletion Requests */}
                        <section className="bg-mintcom-green/5 p-6 rounded-2xl border border-mintcom-green/20">
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.deletion.title')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.deletion.desc')}</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.deletion.step1')}</li>
                                <li>{t('legal.privacy.deletion.step2')}</li>
                                <li>{t('legal.privacy.deletion.step3')}</li>
                            </ul>
                            <p className="text-sm font-medium mb-3">{t('legal.privacy.deletion.retention')}</p>
                            <p className="text-sm font-medium">
                                {t('legal.privacy.deletion.emailLabel')} <a href="mailto:support@mintcompos.com?subject=Account%20and%20data%20deletion%20request" className="text-mintcom-green hover:underline font-bold">support@mintcompos.com</a>
                            </p>
                        </section>

                        {/* 8. Cookies & Tracking Technologies */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s8')}</h2>
                            <p className="text-sm font-medium mb-4">{t('legal.privacy.sections.s8_desc')}:</p>
                            <ul className="list-disc pr-5 pl-5 space-y-2 text-sm font-medium mb-6">
                                <li>{t('legal.privacy.cookies.c1')}</li>
                                <li>{t('legal.privacy.cookies.c2')}</li>
                                <li>{t('legal.privacy.cookies.c3')}</li>
                            </ul>
                            <p className="text-sm font-medium">{t('legal.privacy.cookies.manage')}</p>
                        </section>

                        {/* 9. International Operations */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s9')}</h2>
                            <p className="text-sm font-medium">
                                {t('legal.privacy.international.desc')}
                            </p>
                        </section>

                        {/* 10. Children’s Privacy */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s10')}</h2>
                            <p className="text-sm font-medium">
                                {t('legal.privacy.children.desc')}
                            </p>
                        </section>

                        {/* 11. Changes to This Policy */}
                        <section>
                            <h2 className="font-magilio text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s11')}</h2>
                            <p className="text-sm font-medium">
                                {t('legal.privacy.changes.desc')}
                            </p>
                        </section>

                        {/* 12. Contact Us */}
                        <section className="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/5">
                            <h2 className="font-barlow text-xl font-bold text-gray-900 dark:text-white mb-4">{t('legal.privacy.sections.s12')}</h2>
                            <p className="text-sm font-medium mb-4">
                                {t('legal.privacy.contact.desc')}
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                                    <span className="text-gray-900 dark:text-white">Mintcom LLC</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                    <span className={t('common.locale') === 'ar' ? 'ml-2' : 'w-20'}>{t('common.email')}:</span>
                                    <a href="mailto:support@mintcompos.com" className="text-mintcom-green hover:underline">support@mintcompos.com</a>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                    <span className={t('common.locale') === 'ar' ? 'ml-2' : 'w-20'}>{t('common.website')}:</span>
                                    <a href="https://mintcompos.com" target="_blank" rel="noopener noreferrer" className="text-mintcom-green hover:underline">mintcompos.com</a>
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


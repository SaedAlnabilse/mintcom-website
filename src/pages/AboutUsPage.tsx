import { motion } from 'framer-motion';
import { Target, Shield, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const AboutUsPage = () => {
    const { t } = useTranslation();
    const values = [
        {
            icon: Target,
            title: t('about.values.v1.title'),
            description: t('about.values.v1.description')
        },
        {
            icon: Zap,
            title: t('about.values.v2.title'),
            description: t('about.values.v2.description')
        },
        {
            icon: Shield,
            title: t('about.values.v3.title'),
            description: t('about.values.v3.description')
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white overflow-x-hidden font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            <Helmet>
                <title>{t('metadata.about.title')}</title>
                <meta name="description" content={t('metadata.about.description')} />
                <meta property="og:title" content={t('metadata.about.title')} />
                <meta property="og:description" content={t('metadata.about.description')} />
            </Helmet>
            <Navbar />

            {/* About Mintcom - Main Introduction */}
            <div className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-mintcom-green/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="font-magilio text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">
                            {t('about.title')}
                        </h1>
                        <div className="prose prose-lg dark:prose-invert mx-auto">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-4">
                                {t('about.intro.p1')}
                            </p>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-4">
                                {t('about.intro.p2')}
                            </p>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-4">
                                {t('about.intro.p3')}
                            </p>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                                {t('about.intro.p4')}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Our Value Proposition */}
            <div className="py-24 bg-gray-50 dark:bg-[#1E293B]/50 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-magilio text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('about.values.title')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {values.map((value, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-[#0F172A] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-mintcom-green/30 transition-all group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-mintcom-green/10">
                                    <value.icon className="w-7 h-7 text-gray-900 dark:text-white group-hover:text-mintcom-green transition-colors" />
                                </div>
                                <h3 className="font-barlow text-lg font-bold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                                    {value.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Our Story */}
            <div className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="font-magilio text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                            {t('about.story.title')}
                        </h2>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-center max-w-3xl mx-auto">
                            {t('about.story.p1')}
                        </p>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed text-center max-w-3xl mx-auto">
                            {t('about.story.p2')}
                        </p>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </div>
    );
};


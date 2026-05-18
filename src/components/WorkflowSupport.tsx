import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  ShieldCheck,
  Users,
  BarChart3,
  ChefHat,
  Sparkles,
  Building2,
  LayoutDashboard,
  Zap,
  Lock,
  Heart,
  Smartphone,
} from 'lucide-react';

const WorkflowFeatureCard = ({ feature, index, t }: { feature: any; index: number; t: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = feature.description as string;
  const shouldTruncate = description.length > 110;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 4) * 0.08, duration: 0.5 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group flex flex-col h-full p-6 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#121212] hover:border-mintcom-green/40 hover:shadow-2xl hover:shadow-mintcom-green/10 shadow-lg shadow-gray-200/30 dark:shadow-none transition-all duration-500 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-28 h-28 bg-mintcom-green/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-start gap-4 mb-4 relative z-10">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-mintcom-green/10 dark:bg-mintcom-green/15 flex items-center justify-center group-hover:bg-mintcom-green group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
          <feature.icon size={22} className="text-mintcom-green group-hover:text-white transition-colors duration-500" />
        </div>
        <h3 className="font-barlow text-gray-900 dark:text-white font-bold text-base mt-2 group-hover:text-mintcom-green transition-colors leading-tight tracking-tight">
          {feature.title}
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-between relative z-10">
        <p
          className={`font-barlow text-gray-600 dark:text-gray-400 text-sm leading-relaxed font-medium transition-all duration-300 ${
            !isExpanded && shouldTruncate ? 'line-clamp-3' : ''
          }`}
        >
          {description}
        </p>

        {shouldTruncate && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }}
            className="mt-3 text-xs font-bold font-barlow text-mintcom-green hover:text-mintcom-green/80 self-start transition-colors focus:outline-none"
          >
            {isExpanded
              ? t('landing.features.readLess', 'Read less')
              : t('landing.features.readMore', 'Read more')}
          </button>
        )}
      </div>
    </motion.div>
  );
};


export const WorkflowSupport = () => {
  const { t } = useTranslation();

  // Order matches the requested layout:
  // POS, Sales Control, Staff Management, Advanced Reporting,
  // Recipe & Cost Management, AI System, Multi-Branch Management, Simple & Easy Interface,
  // Fast Staff Onboarding, Secure & Reliable, Loyalty & Customer Management, Mobile App & Notifications
  const workflowFeatures = [
    {
      title: t('landing.workflow.pointOfSale.title'),
      description: t('landing.workflow.pointOfSale.description'),
      icon: CreditCard,
    },
    {
      title: t('landing.workflow.salesControl.title'),
      description: t('landing.workflow.salesControl.description'),
      icon: ShieldCheck,
    },
    {
      title: t('landing.workflow.staffManagement.title'),
      description: t('landing.workflow.staffManagement.description'),
      icon: Users,
    },
    {
      title: t('landing.workflow.advancedReporting.title'),
      description: t('landing.workflow.advancedReporting.description'),
      icon: BarChart3,
    },
    {
      title: t('landing.workflow.production.title'),
      description: t('landing.workflow.production.description'),
      icon: ChefHat,
    },
    {
      title: t('landing.workflow.aiSystem.title'),
      description: t('landing.workflow.aiSystem.description'),
      icon: Sparkles,
    },
    {
      title: t('landing.workflow.multiBranch.title'),
      description: t('landing.workflow.multiBranch.description'),
      icon: Building2,
    },
    {
      title: t('landing.workflow.simpleUI.title'),
      description: t('landing.workflow.simpleUI.description'),
      icon: LayoutDashboard,
    },
    {
      title: t('landing.workflow.fastOnboarding.title'),
      description: t('landing.workflow.fastOnboarding.description'),
      icon: Zap,
    },
    {
      title: t('landing.workflow.secure.title'),
      description: t('landing.workflow.secure.description'),
      icon: Lock,
    },
    {
      title: t('landing.workflow.loyalty.title'),
      description: t('landing.workflow.loyalty.description'),
      icon: Heart,
    },
    {
      title: t('landing.workflow.mobileApp.title'),
      description: t('landing.workflow.mobileApp.description'),
      icon: Smartphone,
    },
  ];

  return (
    <section
      id="features"
      className="py-16 lg:py-24 bg-white dark:bg-[#0f0f0f] overflow-hidden relative"
      dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background Decor */}
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-mintcom-green/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-mintcom-green/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6 md:px-10 lg:px-16 max-w-[1280px]">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16 max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-[12px] bg-mintcom-green/5 dark:bg-mintcom-green/10 text-mintcom-green font-bold text-xs mb-8 border border-mintcom-green/20 backdrop-blur-md shadow-[0_0_15px_rgba(124,195,159,0.05)] hover:border-mintcom-green/40 transition-all duration-300 mx-auto"
          >
            <div className="relative flex items-center justify-center w-5 h-5 rounded-[6px] bg-mintcom-green/20 text-mintcom-green overflow-hidden">
              <Sparkles size={11} className="relative z-10" />
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-mintcom-green/30"
              />
            </div>
            <span className="tracking-widest uppercase text-[10px] md:text-[11px] leading-none">
              {t('landing.workflow.badge')}
            </span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-magilio mb-6 leading-[1.2] rtl:leading-[1.3] tracking-tight whitespace-nowrap">
            <span className="text-gray-900 dark:text-white">{t('landing.workflow.title')} </span>
            <span className="bg-mintcom-green text-gray-900 dark:text-gray-900 px-2 rounded-sm">{t('landing.workflow.titleHighlight')}</span>
          </h2>
          {t('landing.workflow.subtitle') && (
            <p className="text-base font-light leading-relaxed text-gray-600 dark:text-gray-400 xs:text-lg sm:text-xl">
              {t('landing.workflow.subtitle')}
            </p>
          )}
        </motion.div>

        {/* 4-column responsive grid of all 12 features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6 items-stretch">
          {workflowFeatures.map((feature, index) => (
            <WorkflowFeatureCard key={index} feature={feature} index={index} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

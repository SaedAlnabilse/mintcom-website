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
  ArrowUpRight,
} from 'lucide-react';
import { WorkflowReceiptModal, type WorkflowFeature } from './WorkflowReceiptModal';

type CardProps = {
  feature: WorkflowFeature;
  index: number;
  onOpen: () => void;
  t: any;
};

const WorkflowFeatureCard = ({ feature, index, onOpen, t }: CardProps) => {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 4) * 0.08, duration: 0.5 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group flex flex-col h-full p-6 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#121212] hover:border-mintcom-green/40 hover:shadow-2xl hover:shadow-mintcom-green/10 shadow-lg shadow-gray-200/30 dark:shadow-none transition-all duration-500 relative overflow-hidden text-start cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green/60"
      aria-label={t('landing.workflow.cardCta', 'Open {{title}} preview', { title: feature.title })}
    >
      <div className="absolute top-0 right-0 w-28 h-28 bg-mintcom-green/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Top-right open indicator */}
      <div className="absolute top-3 end-3 w-7 h-7 rounded-full bg-mintcom-green/0 group-hover:bg-mintcom-green/15 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
        <ArrowUpRight size={14} className="text-mintcom-green rtl:-scale-x-100" />
      </div>

      <div className="flex items-start gap-4 mb-4 relative z-10">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-mintcom-green/10 dark:bg-mintcom-green/15 flex items-center justify-center group-hover:bg-mintcom-green group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
          <feature.icon size={22} className="text-mintcom-green group-hover:text-white transition-colors duration-500" />
        </div>
        <h3 className="font-barlow text-gray-900 dark:text-white font-bold text-base mt-1 group-hover:text-mintcom-green transition-colors leading-tight tracking-tight min-h-[2.5rem]">
          {feature.title}
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-between relative z-10">
        <p className="font-barlow text-gray-600 dark:text-gray-400 text-sm leading-relaxed font-medium">
          {feature.description}
        </p>

        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold font-barlow text-mintcom-green self-start">
          {t('landing.workflow.preview', 'Preview')}
          <ArrowUpRight size={12} className="rtl:-scale-x-100 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </motion.button>
  );
};

const SplitText = ({ text, className = '' }: { text: string; className?: string }) => {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="text-gray-900 dark:text-white">
          {word}{' '}
        </span>
      ))}
    </span>
  );
};

export const WorkflowSupport = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Order matches the requested layout:
  // POS, Sales Control, Staff Management, Advanced Reporting,
  // Recipe & Cost Management, AI System, Multi-Branch Management, Simple & Easy Interface,
  // Fast Staff Onboarding, Secure & Reliable, Loyalty & Customer Management, Mobile App & Notifications
  const workflowFeatures: WorkflowFeature[] = [
    {
      id: 'pointOfSale',
      title: t('landing.workflow.pointOfSale.title'),
      description: t('landing.workflow.pointOfSale.description'),
      icon: CreditCard,
    },
    {
      id: 'salesControl',
      title: t('landing.workflow.salesControl.title'),
      description: t('landing.workflow.salesControl.description'),
      icon: ShieldCheck,
    },
    {
      id: 'staffManagement',
      title: t('landing.workflow.staffManagement.title'),
      description: t('landing.workflow.staffManagement.description'),
      icon: Users,
    },
    {
      id: 'advancedReporting',
      title: t('landing.workflow.advancedReporting.title'),
      description: t('landing.workflow.advancedReporting.description'),
      icon: BarChart3,
    },
    {
      id: 'production',
      title: t('landing.workflow.production.title'),
      description: t('landing.workflow.production.description'),
      icon: ChefHat,
    },
    {
      id: 'aiSystem',
      title: t('landing.workflow.aiSystem.title'),
      description: t('landing.workflow.aiSystem.description'),
      icon: Sparkles,
    },
    {
      id: 'multiBranch',
      title: t('landing.workflow.multiBranch.title'),
      description: t('landing.workflow.multiBranch.description'),
      icon: Building2,
    },
    {
      id: 'simpleUI',
      title: t('landing.workflow.simpleUI.title'),
      description: t('landing.workflow.simpleUI.description'),
      icon: LayoutDashboard,
    },
    {
      id: 'fastOnboarding',
      title: t('landing.workflow.fastOnboarding.title'),
      description: t('landing.workflow.fastOnboarding.description'),
      icon: Zap,
    },
    {
      id: 'secure',
      title: t('landing.workflow.secure.title'),
      description: t('landing.workflow.secure.description'),
      icon: Lock,
    },
    {
      id: 'loyalty',
      title: t('landing.workflow.loyalty.title'),
      description: t('landing.workflow.loyalty.description'),
      icon: Heart,
    },
    {
      id: 'mobileApp',
      title: t('landing.workflow.mobileApp.title'),
      description: t('landing.workflow.mobileApp.description'),
      icon: Smartphone,
    },
  ];

  const openFeature = openIndex !== null ? workflowFeatures[openIndex] : null;

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
            <SplitText text={t('landing.workflow.title') + ' ' + t('landing.workflow.titleHighlight')} />
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
            <WorkflowFeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              onOpen={() => setOpenIndex(index)}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* Receipt-style modal preview */}
      <WorkflowReceiptModal
        feature={openFeature}
        index={openIndex ?? 0}
        onClose={() => setOpenIndex(null)}
      />
    </section>
  );
};

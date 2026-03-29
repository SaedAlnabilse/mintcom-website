import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CreditCard, Package, Users, BarChart3, TrendingUp } from 'lucide-react';

const WorkflowFeatureCard = ({ feature, index, t }: { feature: any, index: number, t: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = feature.description as string;
  const shouldTruncate = description.length > 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className="group flex flex-col h-full p-5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-paymint-green/30 hover:shadow-lg hover:shadow-paymint-green/5 transition-all duration-300"
    >
      <div className="flex items-start gap-4 mb-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-paymint-green/10 dark:bg-paymint-green/20 flex items-center justify-center group-hover:bg-paymint-green group-hover:scale-110 transition-all duration-300">
          <feature.icon size={20} className="text-paymint-green group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-gray-900 dark:text-white font-bold text-base mt-2 group-hover:text-paymint-green transition-colors leading-tight">
          {feature.title}
        </h3>
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <p className={`text-gray-500 dark:text-gray-400 text-sm leading-relaxed transition-all duration-300 ${!isExpanded && shouldTruncate ? 'line-clamp-2' : ''}`}>
          {description}
        </p>

        {shouldTruncate && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }}
            className="mt-2 text-xs font-bold text-paymint-green hover:text-paymint-green/80 self-start transition-colors focus:outline-none"
          >
            {isExpanded ? t('landing.features.readLess', 'Read less') : t('landing.features.readMore', 'Read more')}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export const WorkflowSupport = () => {
  const { t } = useTranslation();

  const workflowFeatures = [
    {
      title: t('landing.workflow.pointOfSale.title'),
      description: t('landing.workflow.pointOfSale.description'),
      icon: CreditCard,
    },
    {
      title: t('landing.workflow.inventory.title'),
      description: t('landing.workflow.inventory.description'),
      icon: Package,
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
      icon: TrendingUp,
    }
  ];

  return (
    <>
      <section className="py-16 lg:py-20 bg-white dark:bg-[#0f0f0f] overflow-hidden relative" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
        {/* Background Decor */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-paymint-green/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-paymint-green/5 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left Side: Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-12"
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-magilio mb-6 leading-[1.2] rtl:leading-[1.3] tracking-tight">
                  <span className="text-gray-900 dark:text-white">{t('landing.workflow.title')} </span>
                  <span className="text-paymint-green">{t('landing.workflow.titleHighlight')}</span>
                </h2>
                <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                  {t('landing.workflow.subtitle')}
                </p>
              </motion.div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                {workflowFeatures.map((feature, index) => (
                  <WorkflowFeatureCard key={index} feature={feature} index={index} t={t} />
                ))}
              </div>
            </motion.div>

            {/* Right Side: Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full lg:w-1/2 relative"
            >
              <div className="relative group w-full flex items-center justify-center">
                <img 
                  src="/phone_notifications_showcase.png" 
                  alt="Workflow and Notifications Showcase" 
                  className="w-full max-w-lg lg:max-w-full h-auto object-contain drop-shadow-2xl transform transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </motion.div>

          </div>
        </div>


      </section>
    </>
  );
};

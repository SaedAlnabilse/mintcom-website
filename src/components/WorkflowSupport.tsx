import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Package,
  Users,
  BarChart3,
  TrendingUp,
  Layers,
} from 'lucide-react';

/* -----------------------------------------------------------
   WorkflowSupport — Apple "feature ribbon" treatment
   - Sticky / parallax phone showcase on one side
   - Concise feature list with icon-numbered items on the other
   - Smooth reveal animations + subtle gradient frames
----------------------------------------------------------- */

type WFItem = {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const WorkflowItem = ({
  feature,
  index,
}: {
  feature: WFItem;
  index: number;
}) => {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ x: 4 }}
      className="group relative flex items-start gap-5 rounded-2xl border border-transparent p-5 transition-all duration-300 hover:border-mintcom-green/20 hover:bg-white/60 dark:hover:bg-white/[0.04]"
    >
      {/* Icon tile */}
      <div className="relative flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-mintcom-green/15 to-mintcom-green/5 ring-1 ring-mintcom-green/25 transition-all duration-500 group-hover:from-mintcom-green group-hover:to-emerald-400 group-hover:ring-mintcom-green/60 group-hover:shadow-[0_8px_24px_-8px_rgba(124,195,159,0.6)]">
          <Icon
            size={20}
            className="text-mintcom-green transition-colors duration-500 group-hover:text-black"
          />
        </div>
        {/* Step number */}
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-gray-900 shadow ring-1 ring-gray-200 dark:bg-mintcom-dark dark:text-white dark:ring-white/10">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-magilio mb-1.5 text-[17px] font-bold leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-mintcom-green dark:text-white">
          {feature.title}
        </h3>
        <p className="text-[14px] font-light leading-relaxed text-gray-600 dark:text-gray-400">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
};

export const WorkflowSupport = () => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const phoneY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  const workflowFeatures: WFItem[] = [
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
    },
  ];

  return (
    <section
      id="workflow"
      ref={sectionRef}
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative overflow-hidden bg-white py-24 dark:bg-[#050505] lg:py-32"
    >
      {/* Background ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-[10%] h-[400px] w-[400px] rounded-full bg-mintcom-green/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-emerald-400/5 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* ---------- Phone showcase (sticky on desktop) ---------- */}
          <motion.div
            style={{ y: phoneY, rotate: phoneRotate }}
            className="relative order-2 flex items-center justify-center lg:order-1 lg:col-span-5"
          >
            {/* Halo */}
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -z-10 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-gradient-to-tr from-mintcom-green/25 via-transparent to-mintcom-green/10 blur-3xl"
            />

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full max-w-md"
            >
              <img
                src="/phone_notifications_showcase.png"
                alt={t('landing.workflow.title')}
                className="w-full select-none drop-shadow-[0_30px_50px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_30px_50px_rgba(0,0,0,0.6)]"
                draggable={false}
              />
            </motion.div>

            {/* Floating labels around the phone */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="absolute left-2 top-12 hidden items-center gap-2 rounded-full border border-white/60 bg-white/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-mintcom-green shadow-lg backdrop-blur-xl sm:inline-flex dark:border-white/10 dark:bg-white/5"
            >
              <Layers size={12} />
              <span>{t('landing.workflow.titleHighlight')}</span>
            </motion.div>
          </motion.div>

          {/* ---------- Content ---------- */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mb-10"
            >
              <h2 className="font-magilio text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-[64px] lg:leading-[1.02]">
                <span className="text-gray-900 dark:text-white">
                  {t('landing.workflow.title')}{' '}
                </span>
                <span className="bg-gradient-to-r from-mintcom-green via-emerald-400 to-mintcom-green bg-clip-text text-transparent">
                  {t('landing.workflow.titleHighlight')}
                </span>
              </h2>
              <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-400 md:text-xl">
                {t('landing.workflow.subtitle')}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {workflowFeatures.map((feature, i) => (
                <WorkflowItem key={i} feature={feature} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

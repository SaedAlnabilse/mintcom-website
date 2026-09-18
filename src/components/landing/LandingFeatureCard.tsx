import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface LandingFeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  index: number;
  readMoreText?: string;
  onOpen: (index: number) => void;
  ariaLabel?: string;
}

export const LandingFeatureCard: React.FC<LandingFeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  index,
  readMoreText = 'Learn more',
  onOpen,
  ariaLabel,
}) => {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || title}
      onClick={() => onOpen(index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(index);
        }
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors duration-200 hover:border-stone-300 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:border-mintcom-green/30 active:outline-none active:ring-0 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
    >
      <div className="relative z-10 mb-4 flex items-center gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
          <Icon
            size={19}
            strokeWidth={1.75}
          />
        </div>
        <h3 className="line-clamp-2 font-barlow text-[17px] font-bold leading-tight tracking-tight text-stone-900 dark:text-zinc-100">
          {title}
        </h3>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-between">
        <p className="line-clamp-3 font-sans text-sm leading-relaxed text-stone-500 dark:text-zinc-400">
          {description}
        </p>

        <div className="mt-4 border-t border-stone-200 pt-3 dark:border-zinc-800">
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-stone-500 transition-colors group-hover:text-stone-900 dark:text-zinc-400 dark:group-hover:text-zinc-100">
            {readMoreText}
            <ArrowUpRight
              size={14}
              className="text-stone-300 transition-all group-hover:text-mintcom-green"
            />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default LandingFeatureCard;

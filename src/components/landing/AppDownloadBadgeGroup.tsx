import React from 'react';
import { motion } from 'framer-motion';
import AppStoreBadge from '../../assets/app-store-badge.svg';
import GooglePlayBadge from '../../assets/google-play-badge.svg';
import {
  OWNER_IOS_DOWNLOAD_URL,
  OWNER_ANDROID_DOWNLOAD_URL,
} from '../../config/downloads';

export interface AppDownloadBadgeGroupProps {
  label: string;
  hasIosDownload?: boolean;
  hasAndroidDownload?: boolean;
  iosAriaLabel: string;
  androidAriaLabel: string;
  iosComingSoonLabel?: string;
  androidComingSoonLabel?: string;
  align?: 'center' | 'start';
}

export const AppDownloadBadgeGroup: React.FC<AppDownloadBadgeGroupProps> = ({
  label,
  hasIosDownload = true,
  hasAndroidDownload = true,
  iosAriaLabel,
  androidAriaLabel,
  iosComingSoonLabel = 'Owner iOS app download coming soon',
  androidComingSoonLabel = 'Owner Android app download coming soon',
  align = 'start',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`mt-5 sm:mt-6 flex flex-col ${
        align === 'center'
          ? 'items-center mx-auto'
          : 'items-center sm:items-start mx-auto sm:mx-0'
      } gap-3 w-fit`}
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {hasIosDownload ? (
          <a
            href={OWNER_IOS_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={iosAriaLabel}
            className="block transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green/60 rounded-[11px]"
          >
            <img
              src={AppStoreBadge}
              alt={iosAriaLabel}
              className="block h-[52px] w-auto object-contain"
              loading="lazy"
              decoding="async"
            />
          </a>
        ) : (
          <button
            type="button"
            disabled
            aria-label={iosComingSoonLabel}
            className="block opacity-50 cursor-not-allowed rounded-[11px]"
          >
            <img
              src={AppStoreBadge}
              alt={iosAriaLabel}
              className="block h-[52px] w-auto object-contain"
              loading="lazy"
              decoding="async"
            />
          </button>
        )}
        {hasAndroidDownload ? (
          <a
            href={OWNER_ANDROID_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={androidAriaLabel}
            className="block transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green/60 rounded-[11px]"
          >
            <img
              src={GooglePlayBadge}
              alt={androidAriaLabel}
              className="block h-[52px] w-auto object-contain"
              loading="lazy"
              decoding="async"
            />
          </a>
        ) : (
          <button
            type="button"
            disabled
            aria-label={androidComingSoonLabel}
            className="block opacity-50 cursor-not-allowed rounded-[11px]"
          >
            <img
              src={GooglePlayBadge}
              alt={androidAriaLabel}
              className="block h-[52px] w-auto object-contain"
              loading="lazy"
              decoding="async"
            />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default AppDownloadBadgeGroup;

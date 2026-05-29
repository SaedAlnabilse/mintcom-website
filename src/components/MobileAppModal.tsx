import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';
import MintcomLeafIcon from '../assets/small-logo.svg';
import AppStoreBadge from '../assets/app-store-badge.svg';
import GooglePlayBadge from '../assets/google-play-badge.svg';
import { isDirectInstallerDownload } from '../config/downloads';

interface MobileAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  androidUrl?: string;
  iosUrl?: string;
}

export function MobileAppModal({ isOpen, onClose, androidUrl = '', iosUrl = '' }: MobileAppModalProps) {
  const { t } = useTranslation();
  const hasAndroidDownload = Boolean(androidUrl);
  const hasIosDownload = Boolean(iosUrl);

  useScrollLock(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden h-[92vh] sm:h-auto sm:max-h-[85vh] flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/5 relative z-10"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {t('dashboard.menu.getMobileApp')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 pt-2 pb-6">
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 mb-4 border border-gray-100 dark:border-white/5">
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-5 py-6 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-mintcom-green/10">
                    <img src={MintcomLeafIcon} alt="Mintcom" className="h-8 w-8 object-contain" />
                  </div>
                  <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {t('brand.name')} {t('common.app')}
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {t('dashboard.menu.getMobileApp')}
                  </p>
                </div>
              </div>

              {/* Text & Badges */}
              <div className="text-center">
                <p className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-4">
                  <span className="text-mintcom-green">{t('brand.name')} {t('common.app')}</span>
                </p>
                <div className="flex flex-row items-center justify-center gap-3">
                  {hasIosDownload ? (
                    <a
                      href={iosUrl}
                      download={isDirectInstallerDownload(iosUrl) ? true : undefined}
                      rel="noopener noreferrer"
                      className="block transition-transform hover:scale-[1.03] active:scale-[0.98] focus:outline-none"
                      aria-label="Download on the App Store"
                    >
                      <img src={AppStoreBadge} alt="App Store" className="block h-[44px] w-[140px] object-contain" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="block opacity-50 cursor-not-allowed"
                      aria-label={t('landing.download.comingSoon')}
                    >
                      <img src={AppStoreBadge} alt="App Store" className="block h-[44px] w-[140px] object-contain" />
                    </button>
                  )}
                  {hasAndroidDownload ? (
                    <a
                      href={androidUrl}
                      download={isDirectInstallerDownload(androidUrl) ? true : undefined}
                      rel="noopener noreferrer"
                      className="block transition-transform hover:scale-[1.03] active:scale-[0.98] focus:outline-none"
                      aria-label="Get it on Google Play"
                    >
                      <img src={GooglePlayBadge} alt="Google Play" className="block h-[44px] w-[140px] object-contain" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="block opacity-50 cursor-not-allowed"
                      aria-label={t('landing.download.comingSoon')}
                    >
                      <img src={GooglePlayBadge} alt="Google Play" className="block h-[44px] w-[140px] object-contain" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}


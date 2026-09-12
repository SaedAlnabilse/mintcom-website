import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useScrollLock } from '../hooks/useScrollLock';
import AppStoreBadge from '../assets/app-store-badge.svg';
import GooglePlayBadge from '../assets/google-play-badge.svg';
import {
  isDirectInstallerDownload,
  getSmartDownloadRedirectUrl,
} from '../config/downloads';

interface MobileAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  androidUrl?: string;
  iosUrl?: string;
  appType?: 'owner' | 'pos';
}

export function MobileAppModal({
  isOpen,
  onClose,
  androidUrl = '',
  iosUrl = '',
  appType = 'owner',
}: MobileAppModalProps) {
  const { t } = useTranslation();
  const hasAndroidDownload = Boolean(androidUrl);
  const hasIosDownload = Boolean(iosUrl);
  // Smart redirect URL: iPhone scanner -> App Store, Android scanner -> Play Store
  const qrTargetUrl = getSmartDownloadRedirectUrl({ appType, androidUrl, iosUrl });

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
            role="dialog"
            aria-modal="true"
            className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[92dvh] sm:max-h-[85vh] flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/5 relative z-10"
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
                aria-label={t('common.close', { defaultValue: 'Close' })}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 pt-2 overflow-y-auto overscroll-contain custom-scrollbar" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 mb-4 border border-gray-100 dark:border-white/5">
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-5 py-6 text-center shadow-sm">
                  {/* Non-clickable QR container for phone camera scanning */}
                  <div
                    className="mx-auto mb-4 flex w-fit flex-col items-center gap-3 rounded-2xl p-2 select-none cursor-default"
                    aria-label={t('landing.download.qrCode', 'Scan QR code to download')}
                  >
                    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 dark:ring-white/10">
                      <QRCodeSVG
                        value={qrTargetUrl}
                        size={168}
                        level="M"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                      />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      {t('landing.download.scanToDownload', 'Scan To Download')}
                    </p>
                  </div>
                  <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {t('dashboard.menu.downloadAdminPortal', 'Download Mintcom Admin Portal')}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="text-center">
                <div className="flex flex-col min-[380px]:flex-row items-center justify-center gap-3">
                  {hasIosDownload ? (
                    <a
                      href={iosUrl}
                      download={isDirectInstallerDownload(iosUrl) ? true : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition-transform hover:scale-[1.03] active:scale-[0.98] focus:outline-none"
                      aria-label={t('common.downloadOnAppStore')}
                    >
                      <img src={AppStoreBadge} alt={t('portal.mobileApp.appStore')} className="block h-[44px] w-[140px] object-contain" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="block opacity-50 cursor-not-allowed"
                      aria-label={t('landing.download.comingSoon')}
                    >
                      <img src={AppStoreBadge} alt={t('portal.mobileApp.appStore')} className="block h-[44px] w-[140px] object-contain" />
                    </button>
                  )}
                  {hasAndroidDownload ? (
                    <a
                      href={androidUrl}
                      download={isDirectInstallerDownload(androidUrl) ? true : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition-transform hover:scale-[1.03] active:scale-[0.98] focus:outline-none"
                      aria-label={t('common.getItOnGooglePlay')}
                    >
                      <img src={GooglePlayBadge} alt={t('portal.mobileApp.playStore')} className="block h-[44px] w-[140px] object-contain" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="block opacity-50 cursor-not-allowed"
                      aria-label={t('landing.download.comingSoon')}
                    >
                      <img src={GooglePlayBadge} alt={t('portal.mobileApp.playStore')} className="block h-[44px] w-[140px] object-contain" />
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

import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';
import MintcomLeafIcon from '../assets/small-logo.svg';
import AppStoreBadge from '../assets/App_Store_(iOS)-Badge-Logo.wine.svg';
import GooglePlayBadge from '../assets/Google_Play-Badge-Logo.wine.svg';

interface MobileAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileAppModal({ isOpen, onClose }: MobileAppModalProps) {
  const { t } = useTranslation();

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
              {/* QR Code Container */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 mb-4 flex items-center justify-center shadow-inner border border-gray-100 dark:border-white/5">
                <div className="w-48 aspect-square bg-white relative overflow-hidden rounded-xl p-2 shadow-sm">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* QR code pattern - simplified fake version */}
                    <rect width="100" height="100" fill="white" />
                    {/* Corner squares */}
                    <rect x="5" y="5" width="25" height="25" fill="black" />
                    <rect x="8" y="8" width="19" height="19" fill="white" />
                    <rect x="11" y="11" width="13" height="13" fill="black" />

                    <rect x="70" y="5" width="25" height="25" fill="black" />
                    <rect x="73" y="8" width="19" height="19" fill="white" />
                    <rect x="76" y="11" width="13" height="13" fill="black" />

                    <rect x="5" y="70" width="25" height="25" fill="black" />
                    <rect x="8" y="73" width="19" height="19" fill="white" />
                    <rect x="11" y="76" width="13" height="13" fill="black" />

                    {/* Random pattern blocks */}
                    <rect x="35" y="5" width="5" height="5" fill="black" />
                    <rect x="45" y="5" width="5" height="5" fill="black" />
                    <rect x="55" y="5" width="5" height="5" fill="black" />
                    <rect x="35" y="15" width="5" height="5" fill="black" />
                    <rect x="50" y="15" width="5" height="5" fill="black" />
                    <rect x="60" y="15" width="5" height="5" fill="black" />
                    <rect x="40" y="25" width="5" height="5" fill="black" />
                    <rect x="55" y="25" width="5" height="5" fill="black" />

                    <rect x="5" y="35" width="5" height="5" fill="black" />
                    <rect x="15" y="35" width="5" height="5" fill="black" />
                    <rect x="25" y="35" width="5" height="5" fill="black" />
                    <rect x="5" y="45" width="5" height="5" fill="black" />
                    <rect x="20" y="45" width="5" height="5" fill="black" />
                    <rect x="5" y="55" width="5" height="5" fill="black" />
                    <rect x="15" y="55" width="5" height="5" fill="black" />
                    <rect x="25" y="55" width="5" height="5" fill="black" />

                    <rect x="35" y="35" width="30" height="30" fill="black" />
                    <rect x="40" y="40" width="20" height="20" fill="white" />
                    <rect x="45" y="45" width="10" height="10" fill="black" />

                    <rect x="70" y="35" width="5" height="5" fill="black" />
                    <rect x="80" y="35" width="5" height="5" fill="black" />
                    <rect x="90" y="35" width="5" height="5" fill="black" />
                    <rect x="75" y="45" width="5" height="5" fill="black" />
                    <rect x="85" y="45" width="5" height="5" fill="black" />
                    <rect x="70" y="55" width="5" height="5" fill="black" />
                    <rect x="80" y="55" width="5" height="5" fill="black" />

                    <rect x="35" y="70" width="5" height="5" fill="black" />
                    <rect x="45" y="70" width="5" height="5" fill="black" />
                    <rect x="55" y="70" width="5" height="5" fill="black" />
                    <rect x="70" y="70" width="5" height="5" fill="black" />
                    <rect x="80" y="70" width="5" height="5" fill="black" />
                    <rect x="90" y="70" width="5" height="5" fill="black" />
                    <rect x="40" y="80" width="5" height="5" fill="black" />
                    <rect x="50" y="80" width="5" height="5" fill="black" />
                    <rect x="75" y="80" width="5" height="5" fill="black" />
                    <rect x="85" y="80" width="5" height="5" fill="black" />
                    <rect x="35" y="90" width="5" height="5" fill="black" />
                    <rect x="55" y="90" width="5" height="5" fill="black" />
                    <rect x="70" y="90" width="5" height="5" fill="black" />
                    <rect x="90" y="90" width="5" height="5" fill="black" />
                  </svg>
                  {/* Center logo placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md border border-gray-100">
                      <img src={MintcomLeafIcon} alt="Mintcom" className="w-6 h-6 object-contain" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Text & Badges */}
              <div className="text-center">
                <p className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-4">
                  {t('dashboard.menu.scanToDownload')} <span className="text-mintcom-green">{t('brand.name')} {t('common.app')}</span>
                </p>
                <div className="flex flex-row items-center justify-center gap-3">
                  <a
                    href="#"
                    className="block transition-transform hover:scale-[1.03] active:scale-[0.98] focus:outline-none"
                    aria-label="Download on the App Store"
                  >
                    <img src={AppStoreBadge} alt="App Store" className="block h-[44px] w-[140px] object-contain" />
                  </a>
                  <a
                    href="#"
                    className="block transition-transform hover:scale-[1.03] active:scale-[0.98] focus:outline-none"
                    aria-label="Get it on Google Play"
                  >
                    <img src={GooglePlayBadge} alt="Google Play" className="block h-[44px] w-[140px] object-contain" />
                  </a>
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


import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Modal, ModalHeader, ModalBody } from './ui';
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader
        title={t('dashboard.menu.getMobileApp')}
        onClose={onClose}
      />

      <ModalBody>
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
      </ModalBody>
    </Modal>
  );
}

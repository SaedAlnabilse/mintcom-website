import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Loader2, ExternalLink, ArrowLeft, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AppStoreBadge from '../assets/app-store-badge.svg';
import GooglePlayBadge from '../assets/google-play-badge.svg';
import {
  detectMobilePlatform,
  isDirectInstallerDownload,
  getSmartDownloadRedirectUrl,
  getPlatformStoreUrl,
} from '../config/downloads';

export default function AppDownloadRedirectPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const appType = (searchParams.get('app') as 'owner' | 'pos') || 'owner';
  const customAndroid = searchParams.get('android');
  const customIos = searchParams.get('ios');

  const iosStore = getPlatformStoreUrl('ios', customIos || undefined, appType);
  const androidStore = getPlatformStoreUrl('android', customAndroid || undefined, appType);

  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [redirecting, setRedirecting] = useState<boolean>(false);
  const [redirectUrl, setRedirectUrl] = useState<string>('');

  useEffect(() => {
    const detected = detectMobilePlatform();
    setPlatform(detected);

    if (detected === 'ios') {
      setRedirecting(true);
      setRedirectUrl(iosStore.webUrl);

      // Launch native App Store first screen / app
      try {
        window.location.assign(iosStore.nativeUrl);
      } catch {
        window.location.replace(iosStore.webUrl);
      }

      // Fallback web redirect if native scheme not handled
      const timer = setTimeout(() => {
        try {
          window.location.replace(iosStore.webUrl);
        } catch {
          // ignore
        }
      }, 600);
      return () => clearTimeout(timer);
    } else if (detected === 'android') {
      setRedirecting(true);
      setRedirectUrl(androidStore.webUrl);

      // Launch native Google Play Store first screen / app
      try {
        window.location.assign(androidStore.nativeUrl);
      } catch {
        window.location.replace(androidStore.webUrl);
      }

      // Fallback web redirect if native scheme not handled
      const timer = setTimeout(() => {
        try {
          window.location.replace(androidStore.webUrl);
        } catch {
          // ignore
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [iosStore.nativeUrl, iosStore.webUrl, androidStore.nativeUrl, androidStore.webUrl]);

  const appName =
    appType === 'pos'
      ? `${t('brand.name', { defaultValue: 'Mintcom' })} POS`
      : `${t('brand.name', { defaultValue: 'Mintcom' })} ${t('common.app', { defaultValue: 'App' })}`;

  const currentUrl = getSmartDownloadRedirectUrl({
    appType,
    androidUrl: customAndroid || undefined,
    iosUrl: customIos || undefined,
  });

  return (
    <div
      dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gradient-to-b from-gray-900 via-[#0B1120] to-[#030712] text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans selection:bg-mintcom-green selection:text-black"
    >
      {/* Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft size={18} />
          <span>{t('common.back', { defaultValue: 'Back to Mintcom' })}</span>
        </Link>
        <span className="text-xs font-bold uppercase tracking-wider text-mintcom-green bg-mintcom-green/10 border border-mintcom-green/20 px-3 py-1 rounded-full">
          {appName}
        </span>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden"
        >
          {/* Subtle glow effect */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-mintcom-green/20 blur-3xl pointer-events-none rounded-full" />

          {redirecting ? (
            <div className="space-y-6 relative z-10 py-4">
              <div className="w-16 h-16 rounded-2xl bg-mintcom-green/10 border border-mintcom-green/30 flex items-center justify-center mx-auto text-mintcom-green">
                <Loader2 size={32} className="animate-spin" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {platform === 'ios'
                    ? t('portal.mobileApp.openingAppStore', {
                        defaultValue: 'Redirecting to App Store...',
                      })
                    : t('portal.mobileApp.openingPlayStore', {
                        defaultValue: 'Redirecting to Google Play Store...',
                      })}
                </h1>
                <p className="text-sm text-gray-400">
                  {t('portal.mobileApp.redirectNote', {
                    defaultValue: 'If you are not automatically redirected in a few seconds, click below:',
                  })}
                </p>
              </div>

              <a
                href={redirectUrl}
                download={isDirectInstallerDownload(redirectUrl) ? true : undefined}
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-lg bg-mintcom-green hover:bg-mintcom-green/90 active:bg-mintcom-green/80 text-black font-semibold text-base transition-colors"
              >
                <span>
                  {platform === 'ios'
                    ? t('common.downloadOnAppStore', { defaultValue: 'Open App Store' })
                    : t('common.getItOnGooglePlay', { defaultValue: 'Open Google Play Store' })}
                </span>
                <ExternalLink size={18} />
              </a>
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-mintcom-green/10 border border-mintcom-green/20 flex items-center justify-center mx-auto text-mintcom-green">
                <Smartphone size={28} />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{appName}</h1>
                <p className="text-sm text-gray-400">
                  {t('portal.mobileApp.downloadDescription', {
                    defaultValue:
                      'Get the Mintcom mobile app on your iPhone, iPad, or Android device.',
                  })}
                </p>
              </div>

              {/* QR Code for scanning with phone when opened on desktop */}
              {currentUrl && (
                <div className="bg-white rounded-2xl p-4 w-fit mx-auto shadow-inner">
                  <QRCodeSVG
                    value={currentUrl}
                    size={160}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                  <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mt-2">
                    {t('landing.download.scanToDownload', { defaultValue: 'Scan to download' })}
                  </p>
                </div>
              )}

              {/* Download Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href={iosStore.webUrl}
                  download={isDirectInstallerDownload(iosStore.webUrl) ? true : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  aria-label={t('common.downloadOnAppStore', {
                    defaultValue: 'Download on the App Store',
                  })}
                >
                  <img
                    src={AppStoreBadge}
                    alt={t('portal.mobileApp.appStore', { defaultValue: 'App Store' })}
                    className="h-[48px] w-auto object-contain"
                  />
                </a>

                <a
                  href={androidStore.webUrl}
                  download={isDirectInstallerDownload(androidStore.webUrl) ? true : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  aria-label={t('common.getItOnGooglePlay', {
                    defaultValue: 'Get it on Google Play',
                  })}
                >
                  <img
                    src={GooglePlayBadge}
                    alt={t('portal.mobileApp.playStore', { defaultValue: 'Google Play' })}
                    className="h-[48px] w-auto object-contain"
                  />
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto text-center py-4 text-xs text-gray-500">
        <p>{t('brand.copyright')}</p>
      </footer>
    </div>
  );
}

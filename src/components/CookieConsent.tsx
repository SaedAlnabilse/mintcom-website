import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, Check, Shield, BarChart3, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { updateConsentState } from '../utils/analytics';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true, // Always true and disabled
  analytics: true,
  marketing: false,
  functional: true,
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [expandedSection, setExpandedSection] = useState<keyof CookiePreferences | null>(null);

  // Lazy initialization of preferences from localStorage
  const [preferences, setPreferences] = useState<CookiePreferences>(() => {
    const savedConsent = localStorage.getItem('paymint-cookie-consent');
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        // Apply side effect (analytics update) immediately during init is risky, 
        // but since it's just a function call, we'll do it in a useEffect to be safe/pure
        return parsed;
      } catch {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });

  useEffect(() => {
    // Check if user has already consented
    const savedConsent = localStorage.getItem('paymint-cookie-consent');
    if (!savedConsent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Ensure analytics are updated on mount if consent exists
      try {
        const parsed = JSON.parse(savedConsent);
        updateConsentState(parsed);
      } catch {
        // Ignore
      }
    }
  }, []);

  // Listen for custom event to open preferences
  useEffect(() => {
    const handleOpenPreferences = () => setShowPreferences(true);
    window.addEventListener('open-cookie-preferences', handleOpenPreferences);
    return () => window.removeEventListener('open-cookie-preferences', handleOpenPreferences);
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true, functional: true };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const allRejected = { essential: true, analytics: false, marketing: false, functional: false };
    savePreferences(allRejected);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('paymint-cookie-consent', JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowPreferences(false);
    
    // Activate the scripts based on the new preferences
    updateConsentState(prefs);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Cannot toggle essential
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* 1. Main Cookie Banner (Bottom Bar) */}
      <AnimatePresence>
        {showBanner && !showPreferences && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
          >
            <div className="max-w-7xl mx-auto bg-white dark:bg-[#0F172A] rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border border-gray-200 dark:border-white/10 p-6 md:flex md:items-center md:justify-between gap-8 ring-1 ring-black/5">
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  🍪 We value your privacy
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                  For more information, please read our{' '}
                  <Link
                    to="/legal/cookie-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-paymint-green hover:underline font-bold inline-flex items-center gap-0.5"
                  >
                    Cookie Policy
                  </Link>.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-0 shrink-0">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  Preferences
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2.5 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 shadow-lg shadow-paymint-green/20 transition-all hover:scale-105"
                >
                  Accept All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Detailed Preferences Modal */}
      <AnimatePresence>
        {showPreferences && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0B1120] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-white/10"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Cookie Policy & Settings</h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">Read our policy and manage your consent</p>
                </div>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                {/* Policy Text Section */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cookie Declaration</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    This website uses cookies to improve user experience. By using our website you consent to all cookies in accordance with our Cookie Policy.
                    Cookies are small text files that can be used by websites to make a user's experience more efficient.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-2">
                    The law states that we can store cookies on your device if they are strictly necessary for the operation of this site. For all other types of cookies we need your permission.
                    This site uses different types of cookies. Some cookies are placed by third party services that appear on our pages.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Manage Consent</h3>

                  {/* Section: Essential */}
                  <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'essential' ? null : 'essential')}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-paymint-green/10 text-paymint-green">
                          <Shield size={20} />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm">Strictly Essential Cookies</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-paymint-green uppercase tracking-wider">Always Active</span>
                        {expandedSection === 'essential' ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedSection === 'essential' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-white dark:bg-[#0B1120] text-sm text-gray-500 border-t border-gray-100 dark:border-white/5 leading-relaxed">
                            These cookies are necessary for the website to function and cannot be switched off in our systems.
                            They are usually only set in response to actions made by you which amount to a request for services,
                            such as setting your privacy preferences, logging in or filling in forms.
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Section: Analytics */}
                  <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02]">
                      <button
                        onClick={() => setExpandedSection(expandedSection === 'analytics' ? null : 'analytics')}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                          <BarChart3 size={20} />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm">Analytics Cookies</span>
                        {expandedSection === 'analytics' ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                      </button>

                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={() => togglePreference('analytics')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 shadow-sm transition-colors"></div>
                      </label>
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'analytics' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-white dark:bg-[#0B1120] text-sm text-gray-500 border-t border-gray-100 dark:border-white/5 leading-relaxed">
                            These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.
                            They help us to know which pages are the most and least popular and see how visitors move around the site.
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Section: Marketing */}
                  <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02]">
                      <button
                        onClick={() => setExpandedSection(expandedSection === 'marketing' ? null : 'marketing')}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                          <Globe size={20} />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm">Marketing Cookies</span>
                        {expandedSection === 'marketing' ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                      </button>

                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={() => togglePreference('marketing')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 shadow-sm transition-colors"></div>
                      </label>
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'marketing' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-white dark:bg-[#0B1120] text-sm text-gray-500 border-t border-gray-100 dark:border-white/5 leading-relaxed">
                            These cookies may be set through our site by our advertising partners.
                            They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/80 dark:bg-[#0B1120] flex items-center justify-end gap-3 backdrop-blur-sm">
                <button
                  onClick={handleRejectAll}
                  className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  Reject All
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-8 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
                >
                  <Check size={16} />
                  Save Preferences
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

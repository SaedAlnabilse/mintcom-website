import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getPolicyChangelog, type PolicyChangelogEntry } from '../services/legalConsent';
import api from '../config/api';

export const ChangelogPage = () => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<PolicyChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const isRtl = t('common.locale') === 'ar';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try authenticated call first (returns full history); fall back to public endpoint.
        const response = await api.get<PolicyChangelogEntry[]>('/api/legal/changelog');
        if (!cancelled) setEntries(response.data || []);
      } catch {
        try {
          const data = await getPolicyChangelog();
          if (!cancelled) setEntries(data);
        } catch {
          // Silent fail — page still renders with empty list.
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white font-sans"
    >
      <Helmet>
        <title>{t('metadata.changelog.title')}</title>
        <meta name="description" content={t('metadata.changelog.description')} />
      </Helmet>
      <Navbar />

      {/* Header */}
      <div className="pt-32 pb-16 px-6 bg-gray-50 dark:bg-black/20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-mintcom-green/10 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-mintcom-green" />
            </div>
            <h1 className="font-magilio text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              {t('legal.changelog.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('legal.changelog.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Entries */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-mintcom-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p>{t('legal.changelog.empty')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0e0e0e] p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-mintcom-green" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-barlow font-bold text-base text-gray-900 dark:text-white">
                        v{entry.policyVersion}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.effectiveDate).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-mintcom-green/10 text-mintcom-green">
                          {t('legal.changelog.current')}
                        </span>
                      )}
                    </div>
                    <div
                      className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: entry.summary }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

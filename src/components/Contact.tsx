import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Send, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

export const Contact = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/api/contact', formData);
      setIsSuccess(true);
      setFormData({ fullName: '', businessName: '', email: '', message: '' });
      toast.success(t('landing.contact.messageSentSuccess'));
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error: any) {
      console.error('Contact form error:', error);
      toast.error(error.response?.data?.message || t('landing.contact.messageSentError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 lg:py-20 bg-white dark:bg-[#0f0f0f] relative overflow-hidden transition-colors duration-300" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full mx-auto">
          <div className="flex flex-col lg:flex-row items-stretch bg-gray-50 dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">

            {/* Contact Info Sidebar — neutral dark to match landing (#0f0f0f / #121212) */}
            <div className="relative flex flex-col justify-between overflow-hidden border-b border-gray-200 bg-gray-100 p-8 sm:p-12 lg:w-2/5 lg:border-b-0 lg:border-e lg:border-gray-200 dark:border-white/10 dark:bg-[#0a0a0a] dark:lg:border-white/10 lg:p-16">
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-magilio mb-6 leading-tight tracking-tight">
                  <span className="text-mintcom-green">{t('landing.contact.title')}</span>
                  {' '}
                  <span className="text-gray-900 dark:text-white">{t('landing.contact.titleHighlight')}</span>
                </h2>
                <p className="mb-10 max-w-2xl text-base font-light leading-relaxed text-gray-600 dark:text-gray-400 xs:text-lg sm:text-xl">
                  {t('landing.contact.subtitle')}
                </p>
                <div className="space-y-8">
                  {[
                    { icon: Mail, label: t('common.email'), value: 'info@mintcompos.com', color: 'text-mintcom-green' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className="flex h-12 w-12 shrink-0 aspect-square items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition-transform duration-500 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
                        <item.icon size={20} className={item.color} />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white" dir="ltr">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:w-3/5 p-8 sm:p-12 lg:p-16 bg-white dark:bg-[#121212]">
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-mintcom-green/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={48} className="text-mintcom-green" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold font-barlow text-gray-900 dark:text-white mb-2">{t('landing.contact.success')}</h3>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">{t('landing.contact.responseTime')}</p>
                    </div>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="text-mintcom-green font-bold tracking-widest text-xs hover:underline"
                    >
                      {t('landing.contact.sendAnother')}
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900 dark:text-white tracking-tight ml-1">{t('landing.contact.fullName')}</label>
                        <input maxLength={255}
                          required
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all"
                          placeholder={t('landing.contact.placeholder.name')}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900 dark:text-white tracking-tight ml-1">{t('landing.contact.businessName')}</label>
                        <input maxLength={255}
                          required
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all"
                          placeholder={t('landing.contact.placeholder.business')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-900 dark:text-white tracking-tight ml-1">{t('landing.contact.emailAddress')}</label>
                      <input maxLength={255}
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all"
                        placeholder={t('landing.contact.placeholder.email')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-900 dark:text-white tracking-tight ml-1">{t('landing.contact.yourMessage')}</label>
                      <textarea maxLength={2000}
                        required
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all resize-none"
                        placeholder={t('landing.contact.placeholder.message')}
                      />
                    </div>

                    <div className="flex items-center gap-3 py-1">
                      <input
                        required
                        id="terms"
                        type="checkbox"
                        className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-mintcom-green focus:ring-mintcom-green/40 focus:ring-offset-0 dark:border-white/25 dark:bg-white/5"
                      />
                      <label
                        htmlFor="terms"
                        className="cursor-pointer text-sm font-medium leading-snug tracking-tight text-gray-500 dark:text-gray-400"
                      >
                        {t('landing.contact.termsAgree')}{' '}
                        <Link
                          to="/legal/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-mintcom-green transition-colors hover:underline"
                        >
                          {t('landing.contact.privacyPolicy')}
                        </Link>{' '}
                        {t('common.and')}{' '}
                        <Link
                          to="/legal/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-mintcom-green transition-colors hover:underline"
                        >
                          {t('landing.contact.termsOfService')}
                        </Link>
                        .
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-mintcom-green py-4 text-base font-semibold tracking-tight text-gray-900 transition-colors hover:bg-mintcom-green/90 active:scale-[0.98] disabled:opacity-50 sm:py-[1.125rem] sm:text-[17px]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin opacity-80" size={20} strokeWidth={2} />
                      ) : (
                        <Send size={18} strokeWidth={2} className="opacity-80" />
                      )}
                      <span className="font-semibold">{t('landing.contact.sendMessage')}</span>
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


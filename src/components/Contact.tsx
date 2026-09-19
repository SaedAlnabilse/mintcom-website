import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Send, Mail, CheckCircle2, Loader2, LifeBuoy, ArrowUpRight } from 'lucide-react';
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
    <section id="contact" className="bg-cream-100 dark:bg-zinc-950" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mb-6 text-start sm:mb-8"
        >
          <p className="mb-3 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">
            {t('landing.contact.badge')}
          </p>
          <h2 className="font-magilio text-4xl font-bold tracking-tight sm:text-5xl">
            <span>{t('landing.contact.title')}</span>{' '}
            <span className="text-mintcom-green">{t('landing.contact.titleHighlight')}</span>
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-500 dark:text-zinc-400">
            {t('landing.contact.subtitle')}
          </p>
        </motion.div>
        <div className="w-full mx-auto">
          <div className="flex flex-col items-stretch gap-3 lg:flex-row">
            {/* Contact Form — first-design width, support-system styling */}
            <div className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-8 lg:w-3/5">
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
                      className="text-mintcom-greenInk dark:text-mintcom-green font-bold tracking-widest text-xs hover:underline"
                    >
                      {t('landing.contact.sendAnother')}
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-stone-700 dark:text-zinc-200">{t('landing.contact.fullName')}</label>
                        <input maxLength={255}
                          required
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border border-stone-200 bg-white py-3 px-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-mintcom-green focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                          placeholder={t('landing.contact.placeholder.name')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-stone-700 dark:text-zinc-200">{t('landing.contact.businessName')}</label>
                        <input maxLength={255}
                          required
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border border-stone-200 bg-white py-3 px-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-mintcom-green focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                          placeholder={t('landing.contact.placeholder.business')}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-stone-700 dark:text-zinc-200">{t('landing.contact.emailAddress')}</label>
                      <input maxLength={255}
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-stone-200 bg-white py-3 px-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-mintcom-green focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                        placeholder={t('landing.contact.placeholder.email')}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-stone-700 dark:text-zinc-200">{t('landing.contact.yourMessage')}</label>
                      <textarea maxLength={2000}
                        required
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full resize-none rounded-xl border border-stone-200 bg-white py-3 px-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-mintcom-green focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
                          className="font-semibold text-mintcom-greenInk transition-colors hover:underline dark:text-mintcom-green"
                        >
                          {t('landing.contact.privacyPolicy')}
                        </Link>{' '}
                        {t('common.and')}{' '}
                        <Link
                          to="/legal/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-mintcom-greenInk transition-colors hover:underline dark:text-mintcom-green"
                        >
                          {t('landing.contact.termsOfService')}
                        </Link>
                        .
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" size={15} strokeWidth={2} />
                      ) : (
                        <Send size={15} strokeWidth={2} />
                      )}
                      <span>{t('landing.contact.sendMessage')}</span>
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Contact info — first-design side column, support-system styling */}
            <aside className="flex min-w-0 flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-8 lg:w-2/5">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <Mail size={19} strokeWidth={1.75} />
                </span>
                <p className="mt-4 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">{t('common.email')}</p>
                <p className="mt-1 font-barlow text-[17px] font-bold tracking-tight text-stone-900 dark:text-zinc-100" dir="ltr">
                  info@mintcompos.com
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-zinc-400">
                  {t('landing.contact.responseTime')}
                </p>
              </div>
              <Link to="/support" className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-stone-500 transition-colors hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                <LifeBuoy size={14} className="shrink-0" />
                {t('footer.helpCenter')}
                <ArrowUpRight size={14} className="text-stone-300" />
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
};


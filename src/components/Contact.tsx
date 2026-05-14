import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Send,
  Mail,
  Phone,
  CheckCircle2,
  Loader2,
  Clock,
  MessageCircle,
} from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import {
  formatInputPlaceholder,
  formatInputLabel,
} from '../utils/textCase';

/* -----------------------------------------------------------
   Contact — Apple-style split panel
   - Left: pitch with contact details + soft gradient panel
   - Right: glass form with floating-label-style inputs
   - Animated success state
----------------------------------------------------------- */

export const Contact = () => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    message: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      toast.error(
        error.response?.data?.message ||
          t('landing.contact.messageSentError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative overflow-hidden bg-white py-24 transition-colors duration-300 dark:bg-[#050505] lg:py-32"
    >
      {/* Background ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-[10%] h-[400px] w-[400px] rounded-full bg-paymint-green/8 blur-[120px]" />
        <div className="absolute -bottom-20 right-[10%] h-[400px] w-[400px] rounded-full bg-emerald-400/5 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          {/* Badge — above the card */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-xl border border-paymint-green/25 bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-paymint-green shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_24px_-12px_rgba(124,195,159,0.5)] backdrop-blur-xl dark:bg-white/5">
              <MessageCircle size={12} />
              <span>{t('landing.contact.titleHighlight')}</span>
            </div>
          </div>

          {/* Gradient halo border */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-px -z-10 rounded-[2.5rem] bg-gradient-to-tr from-paymint-green/30 via-transparent to-paymint-green/30 opacity-50 blur-2xl"
            />

            <div className="relative overflow-hidden rounded-[2.5rem] border border-gray-200/70 bg-white/90 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* ====== Left: Pitch / contact info ====== */}
                <div className="relative overflow-hidden bg-gradient-to-br from-paymint-green/5 via-white to-white p-10 dark:from-paymint-green/10 dark:via-transparent dark:to-transparent lg:col-span-5 lg:p-14">
                  {/* Decorative grid */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.1]"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                      backgroundSize: '40px 40px',
                      color: '#7CC39F',
                      maskImage:
                        'radial-gradient(ellipse at top left, black 30%, transparent 75%)',
                      WebkitMaskImage:
                        'radial-gradient(ellipse at top left, black 30%, transparent 75%)',
                    }}
                  />

                  <div className="relative">

                    <h2 className="font-magilio text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-[56px] lg:leading-[1.02]">
                      <span className="block text-gray-900 dark:text-white">
                        {t('landing.contact.title')}
                      </span>
                      <span className="block bg-gradient-to-r from-paymint-green via-emerald-400 to-paymint-green bg-clip-text text-transparent">
                        {t('landing.contact.titleHighlight')}
                      </span>
                    </h2>

                    <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-gray-600 dark:text-gray-400 md:text-xl">
                      {t('landing.contact.subtitle')}
                    </p>

                    <div className="mt-10 space-y-5">
                      {[
                        {
                          icon: Mail,
                          label: t('common.email'),
                          value: 'hello@paymint.com',
                        },
                        {
                          icon: Phone,
                          label: t('common.phone'),
                          value: '+962 7XXXXXXXX',
                        },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="group flex items-start gap-4"
                        >
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-paymint-green/20 bg-white shadow-sm transition-all group-hover:border-paymint-green/40 group-hover:bg-paymint-green group-hover:shadow-md dark:bg-white/5">
                            <item.icon
                              size={18}
                              className="text-paymint-green transition-colors group-hover:text-black"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                              {item.label}
                            </p>
                            <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
                              {item.value}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Response time tag */}
                    <div className="mt-10 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/70 px-4 py-2 text-xs font-semibold text-gray-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                      <Clock size={12} className="text-paymint-green" />
                      <span>{t('landing.contact.responseTime')}</span>
                    </div>
                  </div>
                </div>

                {/* ====== Right: Form ====== */}
                <div className="relative bg-white p-10 dark:bg-transparent lg:col-span-7 lg:p-14">
                  <AnimatePresence mode="wait">
                    {isSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex h-full flex-col items-center justify-center space-y-6 py-16 text-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 15,
                          }}
                          className="flex h-24 w-24 items-center justify-center rounded-full bg-paymint-green/15 ring-4 ring-paymint-green/20"
                        >
                          <CheckCircle2
                            size={48}
                            strokeWidth={2}
                            className="text-paymint-green"
                          />
                        </motion.div>
                        <div>
                          <h3 className="font-magilio text-3xl font-bold text-gray-900 dark:text-white">
                            {t('landing.contact.success')}
                          </h3>
                          <p className="mt-2 font-light text-gray-600 dark:text-gray-400">
                            {t('landing.contact.responseTime')}
                          </p>
                        </div>
                        <button
                          onClick={() => setIsSuccess(false)}
                          className="text-xs font-bold uppercase tracking-[0.18em] text-paymint-green hover:underline"
                        >
                          {t('landing.contact.sendAnother')}
                        </button>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onSubmit={handleSubmit}
                        className="space-y-5"
                      >
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="ml-1 text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                              {formatInputLabel(
                                t('landing.contact.fullName'),
                                t('common.locale')
                              )}
                            </label>
                            <input
                              maxLength={255}
                              required
                              type="text"
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-5 py-4 text-gray-900 transition-all placeholder:text-gray-400 focus:border-paymint-green/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-paymint-green/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10"
                              placeholder={formatInputPlaceholder(
                                t('landing.contact.placeholder.name'),
                                t('common.locale')
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="ml-1 text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                              {formatInputLabel(
                                t('landing.contact.businessName'),
                                t('common.locale')
                              )}
                            </label>
                            <input
                              maxLength={255}
                              required
                              type="text"
                              name="businessName"
                              value={formData.businessName}
                              onChange={handleInputChange}
                              className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-5 py-4 text-gray-900 transition-all placeholder:text-gray-400 focus:border-paymint-green/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-paymint-green/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10"
                              placeholder={formatInputPlaceholder(
                                t('landing.contact.placeholder.business'),
                                t('common.locale')
                              )}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="ml-1 text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                            {formatInputLabel(
                              t('landing.contact.emailAddress'),
                              t('common.locale')
                            )}
                          </label>
                          <input
                            maxLength={255}
                            required
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-5 py-4 text-gray-900 transition-all placeholder:text-gray-400 focus:border-paymint-green/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-paymint-green/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10"
                            placeholder={formatInputPlaceholder(
                              t('landing.contact.placeholder.email'),
                              t('common.locale')
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="ml-1 text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                            {formatInputLabel(
                              t('landing.contact.yourMessage'),
                              t('common.locale')
                            )}
                          </label>
                          <textarea
                            maxLength={2000}
                            required
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50/70 px-5 py-4 text-gray-900 transition-all placeholder:text-gray-400 focus:border-paymint-green/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-paymint-green/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10"
                            placeholder={formatInputPlaceholder(
                              t('landing.contact.placeholder.message'),
                              t('common.locale')
                            )}
                          />
                        </div>

                        <div className="flex items-start gap-3 py-1">
                          <input
                            required
                            id="terms"
                            type="checkbox"
                            className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-paymint-green focus:ring-paymint-green dark:border-white/20"
                          />
                          <label
                            htmlFor="terms"
                            className="text-sm leading-relaxed text-gray-500 dark:text-gray-400"
                          >
                            {t('landing.contact.termsAgree')}{' '}
                            <Link
                              to="/legal/privacy"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-paymint-green hover:underline"
                            >
                              {t('landing.contact.privacyPolicy')}
                            </Link>{' '}
                            {t('common.and')}{' '}
                            <Link
                              to="/legal/terms"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-paymint-green hover:underline"
                            >
                              {t('landing.contact.termsOfService')}
                            </Link>
                            .
                          </label>
                        </div>

                        <motion.button
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          type="submit"
                          disabled={isSubmitting}
                          className="group relative inline-flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-paymint-green text-base font-black text-black shadow-[0_15px_40px_-12px_rgba(124,195,159,0.7)] transition-shadow hover:shadow-[0_20px_50px_-12px_rgba(124,195,159,0.8)] disabled:opacity-60"
                        >
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                          />
                          {isSubmitting ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <Send size={18} />
                          )}
                          <span className="relative">
                            {isSubmitting
                              ? t('landing.contact.sending')
                              : t('landing.contact.sendMessage')}
                          </span>
                        </motion.button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

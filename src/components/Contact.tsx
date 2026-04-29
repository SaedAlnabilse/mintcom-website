import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Send, Mail, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';

const SplitText = ({ text, className = "" }: { text: string; className?: string }) => {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => {
        const isPaymint = word.toLowerCase().includes('paymint');
        return (
          <span
            key={i}
            className={isPaymint ? 'text-paymint-green' : (i % 2 === 0 ? 'text-gray-900 dark:text-white' : 'text-paymint-green')}
          >
            {word}{' '}
          </span>
        );
      })}
    </span>
  );
};

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
    <section id="contact" className="py-16 lg:py-20 bg-white dark:bg-[#050505] relative overflow-hidden transition-colors duration-300" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-8 md:px-16 lg:px-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-stretch bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl shadow-gray-200/50 dark:shadow-none">

            {/* Contact Info Sidebar */}
            <div className="lg:w-2/5 bg-gray-100 dark:bg-gray-900 p-12 lg:p-16 relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-magilio mb-6 leading-[1.2] rtl:leading-[1.3] tracking-tight">
                  <SplitText text={t('landing.contact.title') + ' ' + t('landing.contact.titleHighlight')} />
                </h2>
                <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-12 font-light">
                  {t('landing.contact.subtitle')}
                </p>
                <div className="space-y-8">
                  {[
                    { icon: Mail, label: t('common.email'), value: 'hello@paymint.com', color: 'text-paymint-green' },
                    { icon: Phone, label: t('common.phone'), value: '+962 7XXXXXXXX', color: 'text-paymint-green' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center transition-transform duration-500 shadow-sm dark:shadow-none shrink-0 aspect-square">
                        <item.icon size={20} className={item.color} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-1">{item.label}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:w-3/5 p-12 lg:p-16 bg-white dark:bg-transparent">
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-paymint-green/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={48} className="text-paymint-green" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold font-magilio text-gray-900 dark:text-white mb-2">{t('landing.contact.success')}</h3>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">{t('landing.contact.responseTime')}</p>
                    </div>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="text-paymint-green font-bold tracking-widest text-xs hover:underline"
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
                        <label className="text-sm font-normal text-gray-900 dark:text-white tracking-tight ml-1">{formatInputLabel(t('landing.contact.fullName'), t('common.locale'))}</label>
                        <input maxLength={255}
                          required
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-xl py-4 px-6 text-gray-900 dark:text-white font-normal focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                          placeholder={formatInputPlaceholder(t('landing.contact.placeholder.name'), t('common.locale'))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-normal text-gray-900 dark:text-white tracking-tight ml-1">{formatInputLabel(t('landing.contact.businessName'), t('common.locale'))}</label>
                        <input maxLength={255}
                          required
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-xl py-4 px-6 text-gray-900 dark:text-white font-normal focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                          placeholder={formatInputPlaceholder(t('landing.contact.placeholder.business'), t('common.locale'))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-normal text-gray-900 dark:text-white tracking-tight ml-1">{formatInputLabel(t('landing.contact.emailAddress'), t('common.locale'))}</label>
                      <input maxLength={255}
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-xl py-4 px-6 text-gray-900 dark:text-white font-normal focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                        placeholder={formatInputPlaceholder(t('landing.contact.placeholder.email'), t('common.locale'))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-normal text-gray-900 dark:text-white tracking-tight ml-1">{formatInputLabel(t('landing.contact.yourMessage'), t('common.locale'))}</label>
                      <textarea maxLength={2000}
                        required
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-xl py-4 px-6 text-gray-900 dark:text-white font-normal focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all resize-none"
                        placeholder={formatInputPlaceholder(t('landing.contact.placeholder.message'), t('common.locale'))}
                      />
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <input
                        required
                        id="terms"
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-paymint-green focus:ring-paymint-green cursor-pointer"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {t('landing.contact.termsAgree')} <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-paymint-green font-bold hover:underline">{t('landing.contact.privacyPolicy')}</Link> {t('common.and')} <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-paymint-green font-bold hover:underline">{t('landing.contact.termsOfService')}</Link>.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-5 bg-paymint-green text-black font-black text-base rounded-xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                      {t('landing.contact.sendMessage')}
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


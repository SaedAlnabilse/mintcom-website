import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Send, Mail, Phone, X, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

export const Contact = () => {
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
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
    <section id="contact" className="py-24 lg:py-32 bg-white dark:bg-[#050505] relative overflow-hidden transition-colors duration-300" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-8 md:px-16 lg:px-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-stretch bg-gray-50 dark:bg-white/5 rounded-[3rem] border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl shadow-gray-200/50 dark:shadow-none">

            {/* Contact Info Sidebar */}
            <div className="lg:w-2/5 bg-gray-900 p-12 lg:p-16 text-white relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <h2 className="text-4xl font-black tracking-tight mb-6">{t('landing.contact.title')} <span className="text-paymint-green">{t('landing.contact.titleHighlight')}</span></h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-12">
                  {t('landing.contact.subtitle')}
                </p>

                <div className="space-y-8">
                  {[
                    { icon: Mail, label: t('common.email'), value: 'hello@paymint.com', color: 'text-paymint-green' },
                    { icon: Phone, label: t('common.phone'), value: '+962 7XXXXXXXX', color: 'text-blue-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-transform duration-500">
                        <item.icon size={20} className={item.color} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 tracking-widest mb-1">{item.label}</p>
                        <p className="text-lg font-bold">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative Blur */}
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-paymint-green/20 rounded-full blur-[80px]" />
              <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-blue-500/20 rounded-full blur-[60px]" />
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
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t('landing.contact.success')}</h3>
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
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest ml-1">{t('landing.contact.fullName')}</label>
                        <input
                          required
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                          placeholder={t('landing.contact.placeholder.name')}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest ml-1">{t('landing.contact.businessName')}</label>
                        <input
                          required
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                          placeholder={t('landing.contact.placeholder.business')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest ml-1">{t('landing.contact.emailAddress')}</label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                        placeholder={t('landing.contact.placeholder.email')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest ml-1">{t('landing.contact.yourMessage')}</label>
                      <textarea
                        required
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all resize-none"
                        placeholder={t('landing.contact.placeholder.message')}
                      />
                    </div>

                    <div className="flex items-start gap-3 py-2">
                      <input
                        required
                        id="terms"
                        type="checkbox"
                        className="mt-1.5 w-4 h-4 rounded border-gray-300 dark:border-white/20 text-paymint-green focus:ring-paymint-green cursor-pointer"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {t('landing.contact.termsAgree')} <button type="button" onClick={() => setActiveModal('privacy')} className="text-paymint-green font-bold hover:underline">{t('landing.contact.privacyPolicy')}</button> {t('common.and')} <button type="button" onClick={() => setActiveModal('terms')} className="text-paymint-green font-bold hover:underline">{t('landing.contact.termsOfService')}</button>.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-5 bg-paymint-green text-black font-black text-xl rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                      {t('landing.contact.sendMessage')}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[2.5rem] max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white capitalize">
                  {activeModal === 'privacy' ? t('landing.contact.privacy') : t('landing.contact.terms')} {t('landing.contact.policy')}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar text-gray-600 dark:text-gray-400 space-y-6 font-medium leading-relaxed">
                <p>{activeModal === 'privacy' ? t('legal.privacy.intro') : t('legal.terms.intro')}</p>
                <p>{activeModal === 'privacy' ? t('legal.privacy.sections.s1_desc') : t('legal.terms.use.u1')}</p>
              </div>
              <div className="p-8 border-t border-gray-100 dark:border-white/10 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-xl transition-all"
                >
                  {t('common.gotIt')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

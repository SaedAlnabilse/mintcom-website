import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mail, Phone, MapPin, X, CheckCircle2, Loader2 } from 'lucide-react';

export const Contact = () => {
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 5000);
  };

  return (
    <section id="contact" className="py-24 lg:py-32 bg-white dark:bg-[#050505] relative overflow-hidden transition-colors duration-300">
      <div className="container mx-auto px-8 md:px-16 lg:px-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-stretch bg-gray-50 dark:bg-white/5 rounded-[3rem] border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl shadow-gray-200/50 dark:shadow-none">

            {/* Contact Info Sidebar */}
            <div className="lg:w-2/5 bg-gray-900 p-12 lg:p-16 text-white relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <h2 className="text-4xl font-black tracking-tight mb-6">Let's <span className="text-paymint-green">Connect.</span></h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-12">
                  Ready to transform your business? Our team is here to help you get started with PayMint.
                </p>

                <div className="space-y-8">
                  {[
                    { icon: Mail, label: 'Email', value: 'hello@paymint.com', color: 'text-paymint-green' },
                    { icon: Phone, label: 'Phone', value: '+962 7XXXXXXXX', color: 'text-blue-400' },
                    { icon: MapPin, label: 'Office', value: 'Amman, Jordan', color: 'text-purple-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <item.icon size={20} className={item.color} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
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
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Message Sent!</h3>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">We'll get back to you within 24 hours.</p>
                    </div>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="text-paymint-green font-bold uppercase tracking-widest text-xs hover:underline"
                    >
                      Send another message
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
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input
                          required
                          type="text"
                          className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Business Name</label>
                        <input
                          required
                          type="text"
                          className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                          placeholder="Acme Corp"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input
                        required
                        type="email"
                        className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Your Message</label>
                      <textarea
                        required
                        rows={4}
                        className="w-full bg-gray-100 dark:bg-black/20 border border-transparent dark:border-white/10 rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all resize-none"
                        placeholder="How can we help you?"
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
                        I agree to the <button type="button" onClick={() => setActiveModal('privacy')} className="text-paymint-green font-bold hover:underline">Privacy Policy</button> and <button type="button" onClick={() => setActiveModal('terms')} className="text-paymint-green font-bold hover:underline">Terms of Service</button>.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-5 bg-paymint-green text-black font-black text-xl rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                      Send Message
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
                  {activeModal} Policy
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar text-gray-600 dark:text-gray-400 space-y-6 font-medium leading-relaxed">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
                <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
              </div>
              <div className="p-8 border-t border-gray-100 dark:border-white/10 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-xl hover:scale-105 transition-all"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

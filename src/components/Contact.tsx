import { Send, Mail, Phone, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ModalType = 'privacy' | 'terms' | null;

export const Contact = () => {
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  return (
    <section id="contact" className="py-24 lg:py-32 bg-gray-50 dark:bg-[#0f0f0f] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-paymint-green/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6 lg:px-20 max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-200 dark:border-white/5"
        >
          {/* Left Side: Info */}
          <div className="p-12 md:w-5/12 bg-gray-900 dark:bg-[#151515] text-white flex flex-col justify-between relative overflow-hidden">
            {/* Abstract Pattern */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-paymint-green/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[60px]" />
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold font-sans text-white mb-6 tracking-tight">Let's Talk</h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-12">
                Ready to transform your business? Fill out the form and our team will get back to you within 24 hours.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-paymint-green/20 group-hover:border-paymint-green/30 transition-colors">
                    <Mail className="w-5 h-5 text-gray-300 group-hover:text-paymint-green transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email us</p>
                    <p className="font-medium text-white text-lg">hello@paymint.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-paymint-green/20 group-hover:border-paymint-green/30 transition-colors">
                    <Phone className="w-5 h-5 text-gray-300 group-hover:text-paymint-green transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Call us</p>
                    <p className="font-medium text-white text-lg">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-paymint-green/20 group-hover:border-paymint-green/30 transition-colors">
                    <MapPin className="w-5 h-5 text-gray-300 group-hover:text-paymint-green transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Visit us</p>
                    <p className="font-medium text-white text-lg">Amman, Jordan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side: Form */}
          <div className="p-12 md:w-7/12 bg-white dark:bg-[#1a1a1a]">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/20 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/20 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600" placeholder="Your Store LLC" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/20 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600" placeholder="john@company.com" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/20 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 resize-none" placeholder="Tell us about your needs..." />
              </div>
              
              <div className="flex items-start gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="policy" 
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-white/20 text-paymint-green focus:ring-paymint-green cursor-pointer"
                />
                <label htmlFor="policy" className="text-sm text-gray-500 dark:text-gray-400 leading-snug cursor-pointer select-none">
                  I agree to the <button type="button" onClick={() => setActiveModal('privacy')} className="text-paymint-green hover:underline font-medium">Privacy Policy</button> and <button type="button" onClick={() => setActiveModal('terms')} className="text-paymint-green hover:underline font-medium">Terms of Service</button>
                </label>
              </div>
              
              <button 
                disabled={!policyAccepted}
                className="w-full bg-paymint-green text-black py-4 rounded-xl font-bold hover:bg-paymint-green/90 transition-all hover:shadow-lg hover:shadow-paymint-green/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                Send Request <Send size={18} />
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setActiveModal(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </h3>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar text-gray-600 dark:text-gray-300 space-y-6 text-sm leading-relaxed">
                {activeModal === 'privacy' ? (
                  <>
                    <p className="text-xs text-gray-400">Last updated: December 11, 2025</p>
                    <section>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">1. Information We Collect</h4>
                      <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include your name, email address, phone number, business name, and payment information.</p>
                    </section>
                    <section>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">2. How We Use Your Information</h4>
                      <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.</p>
                    </section>
                    <section>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">3. Information Sharing</h4>
                      <p>We do not share your personal information with third parties except as described in this policy. We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
                    </section>
                    <section>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">4. Data Security</h4>
                      <p>We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. All data is encrypted using industry-standard SSL technology.</p>
                    </section>
                    <section>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">5. Contact Us</h4>
                      <p>If you have any questions about this Privacy Policy, please contact us at privacy@paymint.com.</p>
                    </section>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-400">Last updated: December 11, 2025</p>
                    <section>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">1. Acceptance of Terms</h4>
                      <p>By accessing and using PayMint's services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.</p>
                    </section>
                    <section>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">2. Description of Service</h4>
                      <p>PayMint provides a point-of-sale (POS) system and related business management tools. Our services include sales processing, inventory management, employee management, and reporting features.</p>
                    </section>
                    <section>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">3. User Responsibilities</h4>
                      <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
                    </section>
                    <section>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">4. Payment Terms</h4>
                      <p>You agree to pay all fees associated with your selected plan. Fees are non-refundable except as expressly set forth in this agreement. We reserve the right to change our pricing with 30 days notice.</p>
                    </section>
                    <section>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">5. Limitation of Liability</h4>
                      <p>PayMint shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
                    </section>
                    <section>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">6. Contact</h4>
                      <p>For any questions regarding these Terms of Service, please contact us at legal@paymint.com.</p>
                    </section>
                  </>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151515]">
                <button 
                  onClick={() => setActiveModal(null)} 
                  className="w-full bg-paymint-green text-black py-3 rounded-xl font-bold hover:bg-paymint-green/90 transition-all shadow-lg shadow-paymint-green/20"
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

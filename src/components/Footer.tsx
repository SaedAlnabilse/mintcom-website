import { Mail, Phone, MapPin, Instagram, Twitter, Linkedin, Facebook } from 'lucide-react';
import { Logo } from './Logo';

export const Footer = () => {
  return (
    <footer className="bg-gray-50 dark:bg-[#050505] border-t border-gray-200 dark:border-white/10 pt-20 pb-10 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand */}
          <div className="space-y-8">
            <Logo size="lg" />
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-xs">
              The modern POS ecosystem built for fast-growing businesses. Simple, secure, and infinitely scalable.
            </p>
            <div className="flex gap-4">
              {[Instagram, Twitter, Linkedin, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-paymint-green hover:text-black hover:border-paymint-green transition-all"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-8">Product</h4>
            <ul className="space-y-4">
              {['Features', 'Pricing', 'Hardware', 'Demo', 'Mobile App'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-600 dark:text-gray-400 font-bold hover:text-paymint-green transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-8">Company</h4>
            <ul className="space-y-4">
              {['About Us', 'Contact', 'Blog', 'Careers', 'Partners'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-600 dark:text-gray-400 font-bold hover:text-paymint-green transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-8">Get in Touch</h4>
            <ul className="space-y-6">
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
                <div className="w-8 h-8 rounded-lg bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                  <Mail size={14} className="text-paymint-green" />
                </div>
                <span>hello@paymint.com</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
                <div className="w-8 h-8 rounded-lg bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                  <Phone size={14} className="text-paymint-green" />
                </div>
                <span>+962 7XXXXXXXX</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
                <div className="w-8 h-8 rounded-lg bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                  <MapPin size={14} className="text-paymint-green" />
                </div>
                <span>Amman, Jordan</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 dark:text-gray-500 text-sm font-bold">
            © 2025 PayMint LLC. All rights reserved.
          </p>
          <div className="flex gap-8">
            {['Privacy Policy', 'Terms of Service', 'Security'].map((link) => (
              <a key={link} href="#" className="text-gray-500 dark:text-gray-500 text-xs font-bold hover:text-paymint-green transition-colors uppercase tracking-widest">{link}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
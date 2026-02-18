import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Laptop } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.features'), href: '/#features' },
    { name: t('nav.pricing'), href: '/#pricing' },
    { name: t('nav.support'), href: '/support' },
    { name: t('nav.community'), href: '/community-hub' },
  ];

  return (
    <nav
      dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
      className={`fixed w-full z-50 transition-all duration-500 ease-in-out ${isScrolled
        ? 'bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl py-4 border-b border-gray-200 dark:border-white/5 shadow-sm'
        : 'bg-transparent py-6'
        }`}
    >
      <div className="container mx-auto px-8 md:px-16 lg:px-24 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <Logo size="lg" className={`transition-transform duration-500 ${t('common.locale') === 'ar' ? 'scale-x-[-1]' : ''}`} />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-10">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                target={link.href.includes('community-hub') ? '_blank' : undefined}
                rel={link.href.includes('community-hub') ? 'noopener noreferrer' : undefined}
                className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-paymint-green dark:hover:text-paymint-green transition-colors"
                onClick={(e) => {
                  // Direct smooth scroll if already on homepage
                  if (link.href.startsWith('/#') && window.location.pathname === '/') {
                    const el = document.getElementById(link.href.slice(2));
                    if (el) {
                      e.preventDefault();
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />

          <div className="flex items-center gap-6">
            <Link
              to="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-gray-900 dark:text-white hover:text-paymint-green dark:hover:text-paymint-green transition-colors"
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all active:scale-95 shadow-lg shadow-gray-900/20 dark:shadow-white/10"
            >
              {t('nav.getStarted')}
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="lg:hidden flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? t('common.aria.closeMenu') : t('common.aria.openMenu')}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="text-gray-900 dark:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            id="mobile-menu"
            role="navigation"
            aria-label={t('common.aria.mobileNav')}
            className="fixed inset-0 z-[40] bg-white dark:bg-[#050505] pt-32 px-6 sm:px-10 lg:hidden flex flex-col items-center overflow-y-auto"
          >
            <div className="w-full max-w-sm space-y-10">
              <div className="flex flex-col items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    target={link.href.includes('community-hub') ? '_blank' : undefined}
                    rel={link.href.includes('community-hub') ? 'noopener noreferrer' : undefined}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      if (link.href.startsWith('/#') && window.location.pathname === '/') {
                        const el = document.getElementById(link.href.slice(2));
                        if (el) {
                          e.preventDefault();
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white hover:text-paymint-green transition-colors tracking-tight"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="h-px w-full bg-gray-100 dark:bg-white/5" />

              <div className="flex flex-col gap-4">
                <Link
                  to="/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-5 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white rounded-[2rem] text-xl font-black tracking-tight text-center"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-5 bg-paymint-green text-black rounded-[2rem] text-xl font-black tracking-tight text-center shadow-xl shadow-paymint-green/20"
                >
                  {t('nav.createAccount')}
                </Link>
              </div>

              {/* Mobile Footer Info */}
              <div className="pt-10 flex flex-col items-center gap-6 opacity-50">
                <div className="flex gap-8">
                  <LanguageSwitcher />
                  <Laptop size={20} className="text-gray-900 dark:text-white" />
                </div>
                <p className="text-xs font-bold tracking-widest text-gray-500">{t('brand.name')} {t('brand.tagline')} {t('brand.version')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

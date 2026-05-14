import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Laptop, LogOut, User, Headset, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useScrollLock } from '../hooks/useScrollLock';

/* -----------------------------------------------------------
   Navbar — Smooth morphing glass header
   - Full-width transparent at rest
   - On scroll: smoothly gains a frosted glass background with
     a thin bottom highlight line (gradient accent)
   - Nav links use an animated underline on hover
   - CTA has a soft glow that pulses subtly
   - All transitions are 500ms cubic-bezier for buttery feel
----------------------------------------------------------- */

export const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isRtl = t('common.locale') === 'ar';

  useScrollLock(isMobileMenuOpen);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = isAuthenticated
    ? []
    : [
        { name: t('nav.features'), href: '/#features' },
        { name: t('nav.pricing'), href: '/#pricing' },
        { name: t('nav.support'), href: '/support' },
      ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      // Ignore errors
    }
  };

  return (
    <nav
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,box-shadow] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isMobileMenuOpen
          ? 'bg-white dark:bg-[#050505]'
          : isScrolled
          ? 'bg-white/70 shadow-[0_1px_0_rgba(0,0,0,0.04),0_4px_20px_-4px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:bg-[#050505]/70 dark:shadow-[0_1px_0_rgba(255,255,255,0.03),0_4px_20px_-4px_rgba(0,0,0,0.4)]'
          : 'bg-transparent'
      }`}
    >
      {/* Gradient accent line at the bottom — fades in on scroll */}
      <div
        aria-hidden
        className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-paymint-green/40 to-transparent transition-opacity duration-[600ms] ${
          isScrolled && !isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`mx-auto flex max-w-[1280px] items-center justify-between px-6 transition-[padding] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:px-10 ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
      >
        {/* Logo */}
        <Link
          to="/"
          className="relative z-[60] flex items-center"
          onClick={() => {
            setIsMobileMenuOpen(false);
            if (window.location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <Logo size="lg" className="transition-transform duration-500" />
        </Link>

        {/* Desktop nav */}
        <div className="relative z-[60] hidden items-center lg:flex">
          {!isAuthenticated && (
            <>
              <div className="flex items-center">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="group relative px-5 py-2 text-[13px] font-semibold text-gray-500 transition-colors duration-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    onClick={(e) => {
                      if (
                        link.href.startsWith('/#') &&
                        window.location.pathname === '/'
                      ) {
                        const el = document.getElementById(link.href.slice(2));
                        if (el) {
                          e.preventDefault();
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                  >
                    {link.name}
                    {/* Animated underline */}
                    <span className="absolute inset-x-3 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-paymint-green transition-transform duration-300 ease-out group-hover:scale-x-100" />
                  </Link>
                ))}
              </div>

              <div className="mx-5 h-4 w-px bg-gray-200 dark:bg-white/10" />
            </>
          )}

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/support"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50 px-4 py-2 text-[13px] font-semibold text-gray-700 transition-all duration-300 hover:border-gray-300 hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
                >
                  <Headset size={14} />
                  {t('nav.support')}
                </Link>
                <Link
                  to="/owner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-paymint-green px-4 py-2 text-[13px] font-bold text-black shadow-[0_2px_12px_-2px_rgba(124,195,159,0.5)] transition-all duration-300 hover:shadow-[0_4px_20px_-4px_rgba(124,195,159,0.7)]"
                >
                  <User size={14} />
                  {t('nav.dashboard', 'Dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-[13px] font-semibold text-rose-500 transition-colors duration-300 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
                >
                  <LogOut size={14} />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="group relative overflow-hidden rounded-xl px-4 py-2 text-[13px] font-semibold text-gray-600 transition-all duration-300 hover:bg-gray-100/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
                >
                  {t('nav.login')}
                  <span className="absolute inset-x-3 bottom-1 h-[2px] origin-left scale-x-0 rounded-full bg-paymint-green/60 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </Link>
                <Link
                  to="/signup"
                  className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-paymint-green px-5 py-2.5 text-[13px] font-bold text-black shadow-[0_2px_12px_-2px_rgba(124,195,159,0.5)] transition-all duration-300 hover:shadow-[0_6px_24px_-4px_rgba(124,195,159,0.7)] active:scale-[0.97]"
                >
                  {/* Shine sweep on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />
                  <span className="relative">{t('nav.getStarted')}</span>
                  <ArrowRight
                    size={14}
                    className={`relative transition-transform duration-300 ${
                      isRtl
                        ? 'rotate-180 group-hover:-translate-x-0.5'
                        : 'group-hover:translate-x-0.5'
                    }`}
                  />
                </Link>
              </>
            )}

            <div className="mx-2 h-4 w-px bg-gray-200 dark:bg-white/10" />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile controls */}
        <div className="relative z-[60] flex items-center gap-2 sm:gap-3 lg:hidden">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={
              isMobileMenuOpen
                ? t('common.aria.closeMenu')
                : t('common.aria.openMenu')
            }
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2 text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-white/5"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={22} />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={22} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            id="mobile-menu"
            role="navigation"
            aria-label={t('common.aria.mobileNav')}
            className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-white px-6 pt-28 dark:bg-[#050505] sm:px-10 lg:hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm space-y-10 pb-20"
            >
              {!isAuthenticated && (
                <>
                  <div className="flex flex-col items-center gap-6">
                    {navLinks.map((link, i) => (
                      <motion.div
                        key={link.name}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.06 }}
                      >
                        <Link
                          to={link.href}
                          onClick={(e) => {
                            setIsMobileMenuOpen(false);
                            if (
                              link.href.startsWith('/#') &&
                              window.location.pathname === '/'
                            ) {
                              const el = document.getElementById(
                                link.href.slice(2)
                              );
                              if (el) {
                                e.preventDefault();
                                el.scrollIntoView({ behavior: 'smooth' });
                              }
                            }
                          }}
                          className="font-magilio text-3xl font-bold tracking-tight text-gray-900 transition-colors hover:text-paymint-green dark:text-white sm:text-4xl"
                        >
                          {link.name}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                  <div className="h-px w-full bg-gray-100 dark:bg-white/5" />
                </>
              )}

              <div className="flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/support"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-5 text-center text-xl font-black tracking-tight text-gray-900 shadow-sm transition-transform active:scale-95 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
                    >
                      <Headset size={20} />
                      {t('nav.support')}
                    </Link>
                    <Link
                      to="/owner"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-paymint-green py-5 text-center text-xl font-black tracking-tight text-black shadow-xl shadow-paymint-green/30 transition-transform hover:scale-[1.02] active:scale-95"
                    >
                      <User size={20} />
                      {t('nav.dashboard', 'Dashboard')}
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-rose-50 py-5 text-center text-xl font-black tracking-tight text-rose-500 transition-colors hover:bg-rose-100 active:scale-95 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
                    >
                      <LogOut size={20} />
                      {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full rounded-2xl border-2 border-gray-900 py-5 text-center text-xl font-black tracking-tight text-gray-900 transition-colors dark:border-white dark:text-white"
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full rounded-2xl bg-paymint-green py-5 text-center text-xl font-black tracking-tight text-black shadow-xl shadow-paymint-green/30"
                    >
                      {t('nav.getStarted')}
                    </Link>
                  </>
                )}
              </div>

              <div className="flex flex-col items-center gap-6 pt-10 opacity-40">
                <div className="flex gap-8">
                  <LanguageSwitcher />
                  <Laptop size={20} className="text-gray-900 dark:text-white" />
                </div>
                <p className="text-xs font-bold tracking-widest text-gray-500">
                  {t('brand.name')} {t('brand.tagline')} {t('brand.version')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

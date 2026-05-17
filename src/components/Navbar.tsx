import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, LogOut, User, Headset, ArrowRight } from 'lucide-react';
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
      className="fixed inset-x-0 top-0 z-50"
    >
      {/* Glass background layer — separate element so backdrop-filter is never animated */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          isMobileMenuOpen
            ? 'opacity-0'
            : isScrolled
            ? 'opacity-100'
            : 'opacity-0'
        }`}
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          backgroundColor: 'rgba(255,255,255,0.72)',
        }}
      />
      {/* Dark mode glass layer */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 hidden transition-opacity duration-500 dark:block ${
          isMobileMenuOpen
            ? 'opacity-0'
            : isScrolled
            ? 'opacity-100'
            : 'opacity-0'
        }`}
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          backgroundColor: 'rgba(5,5,5,0.72)',
        }}
      />
      {/* Solid bg when menu is open */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-200 dark:bg-[#050505] ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Shadow layer */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-mintcom-green/40 to-transparent transition-opacity duration-500 ${
          isScrolled && !isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 -bottom-px h-[20px] transition-opacity duration-500 ${
          isScrolled && !isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.08)',
        }}
      />

      <div
        className={`relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-4 xs:px-6 md:px-10 ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
      >
        {/* Logo */}
        <Link
          to="/"
          className="relative z-[60] flex min-w-0 items-center"
          onClick={() => {
            setIsMobileMenuOpen(false);
            if (window.location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <span className="navbar-logo-full min-w-0">
            <Logo size="lg" className="transition-transform duration-500" />
          </span>
          <span className="navbar-logo-icon">
            <Logo variant="icon" size="lg" className="transition-transform duration-500" />
          </span>
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
                    <span className="absolute inset-x-3 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-mintcom-green transition-transform duration-300 ease-out group-hover:scale-x-100" />
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
                  className="inline-flex items-center gap-2 rounded-xl bg-mintcom-green px-4 py-2 text-[13px] font-bold text-black shadow-[0_2px_12px_-2px_rgba(124,195,159,0.5)] transition-all duration-300 hover:shadow-[0_4px_20px_-4px_rgba(124,195,159,0.7)]"
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
                  <span className="absolute inset-x-3 bottom-1 h-[2px] origin-left scale-x-0 rounded-full bg-mintcom-green/60 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </Link>
                <Link
                  to="/signup"
                  className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-mintcom-green px-5 py-2.5 text-[13px] font-bold text-black shadow-[0_2px_12px_-2px_rgba(124,195,159,0.5)] transition-all duration-300 hover:shadow-[0_6px_24px_-4px_rgba(124,195,159,0.7)] active:scale-[0.97]"
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
        <div className="relative z-[60] flex shrink-0 items-center gap-1.5 xs:gap-2 sm:gap-3 lg:hidden">
          <LanguageSwitcher compact showGlobeIcon={false} buttonClassName="min-h-10 px-3" />
          <ThemeToggle
            iconSize={18}
            className="h-10 w-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:text-mintcom-green dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-mintcom-green"
          />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={
              isMobileMenuOpen
                ? t('common.aria.closeMenu')
                : t('common.aria.openMenu')
            }
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="flex min-h-10 min-w-10 items-center justify-center rounded-xl p-2 text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-white/5"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            id="mobile-menu"
            role="navigation"
            aria-label={t('common.aria.mobileNav')}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-50 bg-white dark:bg-[#050505] lg:hidden will-change-[opacity,transform]"
          >
            {/* Content — stopPropagation so clicks inside don't close the menu */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center px-6 pt-6 sm:px-10"
            >
              {/* Top bar: logo centered, X on the right */}
              <div className="flex w-full max-w-sm items-center justify-between mb-12">
                <div className="w-11" /> {/* Spacer to center logo */}
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <Logo size="lg" />
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 dark:bg-white/10 dark:text-white"
                  aria-label={t('common.aria.closeMenu')}
                >
                  <X size={22} />
                </button>
              </div>

              <div className="w-full max-w-sm space-y-10 pb-20">
              {!isAuthenticated && (
                <>
                  <div className="flex flex-col items-center gap-6">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.href}
                        onClick={(e) => {
                          setIsMobileMenuOpen(false);
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
                        className="font-barlow text-3xl font-bold tracking-tight text-gray-900 transition-colors hover:text-mintcom-green dark:text-white sm:text-4xl"
                      >
                        {link.name}
                      </Link>
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
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-mintcom-green py-5 text-center text-xl font-black tracking-tight text-black shadow-xl shadow-mintcom-green/30 transition-transform hover:scale-[1.02] active:scale-95"
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
                      className="w-full rounded-2xl bg-mintcom-green py-5 text-center text-xl font-black tracking-tight text-black shadow-xl shadow-mintcom-green/30"
                    >
                      {t('nav.getStarted')}
                    </Link>
                  </>
                )}
              </div>

            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

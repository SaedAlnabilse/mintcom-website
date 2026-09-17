import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, LogOut, User, Headset, ArrowRight, Play } from 'lucide-react';
import MintcomLeafIcon from '../assets/small-logo.svg';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useScrollLock } from '../hooks/useScrollLock';
import { ONBOARDING_START_PATH } from '../utils/onboardingLaunch';

/* -----------------------------------------------------------
   Navbar — plain flat bar.
   - Full-width bar with a hairline bottom border, no capsule,
     no glow, no shimmer. Same logo, same system green.
----------------------------------------------------------- */

export const Navbar = ({ hideCommercialLinks = false }: { hideCommercialLinks?: boolean }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, needsOnboarding } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isRtl = t('common.locale') === 'ar';

  useScrollLock(isMobileMenuOpen);

  const navLinks = isAuthenticated
    ? []
    : [
        { name: t('nav.features'), href: '/#features', id: 'features' },
        ...(hideCommercialLinks ? [] : [{ name: t('nav.pricing'), href: '/#pricing', id: 'pricing' }]),
        ...(hideCommercialLinks ? [] : [{ name: t('nav.tryDesktop'), href: '/try-pos', id: 'try-pos', target: '_blank', rel: 'noopener noreferrer' }]),
        { name: t('nav.support'), href: '/support', id: 'support' },
      ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      // Ignore errors
    }
  };

  const scrollToSection = (e: React.MouseEvent, href: string) => {
    if (href.startsWith('/#') && window.location.pathname === '/') {
      const el = document.getElementById(href.slice(2));
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white dark:border-white/10 dark:bg-[#0a0a0a]"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center"
          onClick={() => {
            setIsMobileMenuOpen(false);
            if (window.location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <span className="navbar-logo-full min-w-0">
            <Logo size="lg" />
          </span>
          <span className="navbar-logo-icon">
            <Logo variant="icon" size="lg" />
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 lg:flex">
          {!isAuthenticated && navLinks.map((link) => (
            <Link
              key={link.id}
              to={link.href}
              target={link.target}
              rel={link.rel}
              onClick={(e) => scrollToSection(e, link.href)}
              className="text-sm font-semibold text-gray-600 hover:text-mintcom-green dark:text-gray-300 dark:hover:text-mintcom-green"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/support"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 hover:border-mintcom-green/40 hover:text-mintcom-green dark:border-white/10 dark:text-gray-300"
              >
                <Headset size={14} />
                {t('nav.support')}
              </Link>
              {needsOnboarding ? (
                <Link
                  to={ONBOARDING_START_PATH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-mintcom-green px-5 py-2.5 text-[13px] font-bold text-black hover:bg-mintcom-green/90"
                >
                  <img src={MintcomLeafIcon} alt="" style={{ width: 14, height: 14 }} className="scale-x-[-1] object-contain brightness-0" />
                  {t('nav.continueOnboarding', { defaultValue: 'Continue Onboarding' })}
                </Link>
              ) : (
                <Link
                  to="/owner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-mintcom-green px-5 py-2.5 text-[13px] font-bold text-black hover:bg-mintcom-green/90"
                >
                  <User size={14} />
                  {t('nav.dashboard', 'Dashboard')}
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-[13px] font-semibold text-rose-500 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
              >
                <LogOut size={14} />
                {t('nav.logout')}
              </button>
            </>
          ) : !hideCommercialLinks ? (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-[13px] font-semibold text-gray-600 hover:text-mintcom-green dark:text-gray-300 dark:hover:text-mintcom-green"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-mintcom-green px-5 py-2.5 text-[13px] font-bold text-black hover:bg-mintcom-green/90"
              >
                {t('nav.getStarted')}
                <ArrowRight size={13} className={isRtl ? 'rotate-180' : ''} />
              </Link>
            </>
          ) : null}

          <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-white/10" />

          <LanguageSwitcher
            dropdownDirection="down"
            buttonClassName="rounded-lg bg-transparent border-0 hover:bg-gray-100 dark:hover:bg-white/[0.06] px-3 py-2"
          />
          <ThemeToggle
            dropdownDirection="down"
            iconSize={17}
            className="h-9 w-9 rounded-lg border-0 bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
          />
        </div>

        {/* Mobile controls */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:hidden">
          <LanguageSwitcher compact buttonClassName="min-h-9 px-2.5 xs:px-3 rounded-lg text-sm" iconSize={15} />
          <ThemeToggle
            iconSize={17}
            className="h-9 w-9 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:text-mintcom-green dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-mintcom-green"
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
            className="flex h-9 w-9 items-center justify-center rounded-lg p-1.5 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-white/5"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — plain dropdown panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            id="mobile-menu"
            role="navigation"
            aria-label={t('common.aria.mobileNav')}
            className="overflow-hidden border-t border-gray-200 bg-white dark:border-white/10 dark:bg-[#0a0a0a] lg:hidden"
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
              {!isAuthenticated && navLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.href}
                  target={link.target}
                  rel={link.rel}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (link.target === '_blank') return;
                    scrollToSection(e, link.href);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-base font-bold text-gray-900 dark:text-white ${
                    link.id === 'try-pos'
                      ? 'bg-mintcom-green text-black'
                      : 'border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5'
                  }`}
                >
                  <span className="min-w-0 truncate">{link.name}</span>
                  {link.id === 'try-pos' ? (
                    <Play size={17} fill="currentColor" className="shrink-0" />
                  ) : (
                    <ArrowRight size={18} className={isRtl ? 'rotate-180' : ''} />
                  )}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <Link
                    to="/support"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-base font-bold text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <Headset size={18} />
                    {t('nav.support')}
                  </Link>
                  {needsOnboarding ? (
                    <Link
                      to={ONBOARDING_START_PATH}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-mintcom-green px-4 py-3 text-center text-base font-bold text-black"
                    >
                      <img src={MintcomLeafIcon} alt="" style={{ width: 18, height: 18 }} className="scale-x-[-1] object-contain brightness-0" />
                      {t('nav.continueOnboarding', { defaultValue: 'Continue Onboarding' })}
                    </Link>
                  ) : (
                    <Link
                      to="/owner"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-mintcom-green px-4 py-3 text-center text-base font-bold text-black"
                    >
                      <User size={18} />
                      {t('nav.dashboard', 'Dashboard')}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-center text-base font-bold text-rose-500 dark:bg-rose-500/10"
                  >
                    <LogOut size={18} />
                    {t('nav.logout')}
                  </button>
                </>
              ) : !hideCommercialLinks ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-base font-bold text-gray-900 dark:border-white/20 dark:text-white"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full rounded-lg bg-mintcom-green px-4 py-3 text-center text-base font-bold text-black"
                  >
                    {t('nav.getStarted')}
                  </Link>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, User, Headset, ArrowRight, Play } from 'lucide-react';
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
  const { isAuthenticated, needsOnboarding } = useAuth();
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
      className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/70 bg-cream-100/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90"
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
              className="text-sm font-semibold text-stone-600 hover:text-mintcom-green dark:text-zinc-300 dark:hover:text-mintcom-green"
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
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-2.5 text-[13px] font-semibold text-stone-600 hover:border-mintcom-green/40 hover:text-mintcom-green dark:border-zinc-800 dark:text-zinc-300"
              >
                <Headset size={14} />
                {t('nav.support')}
              </Link>
              {needsOnboarding ? (
                <Link
                  to={ONBOARDING_START_PATH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-mintcom-green px-5 py-2.5 text-[13px] font-bold text-black hover:bg-mintcom-green/90"
                >
                  <img src={MintcomLeafIcon} alt="" style={{ width: 14, height: 14 }} className="scale-x-[-1] object-contain brightness-0" />
                  {t('nav.continueOnboarding', { defaultValue: 'Continue Onboarding' })}
                </Link>
              ) : (
                <Link
                  to="/owner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-mintcom-green px-5 py-2.5 text-[13px] font-bold text-black hover:bg-mintcom-green/90"
                >
                  <User size={14} />
                  {t('nav.dashboard', 'Dashboard')}
                </Link>
              )}
            </>
          ) : !hideCommercialLinks ? (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-[13px] font-semibold text-stone-600 hover:text-mintcom-green dark:text-zinc-300 dark:hover:text-mintcom-green"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-mintcom-green px-5 py-2.5 text-[13px] font-bold text-black hover:bg-mintcom-green/90"
              >
                    {t('nav.startTrial', { defaultValue: 'Start 14-Day Free Trial' })}
                <ArrowRight size={13} className={isRtl ? 'rotate-180' : ''} />
              </Link>
            </>
          ) : null}

          <div className="mx-2 h-6 w-px bg-stone-200 dark:bg-zinc-800" />

          <LanguageSwitcher
            dropdownDirection="down"
            buttonClassName="rounded-xl bg-transparent border-0 hover:bg-stone-100 dark:hover:bg-zinc-800 px-3 py-2"
          />
          <ThemeToggle
            dropdownDirection="down"
            iconSize={17}
            className="h-9 w-9 rounded-xl border-0 bg-transparent text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          />
        </div>

        {/* Mobile controls */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:hidden">
          <LanguageSwitcher compact buttonClassName="min-h-9 px-2.5 xs:px-3 rounded-xl text-sm" iconSize={15} />
          <ThemeToggle
            iconSize={17}
            className="h-9 w-9 rounded-xl border border-stone-200 bg-stone-100 text-stone-600 hover:text-mintcom-green dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-400 dark:hover:text-mintcom-green"
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
            className="flex h-9 w-9 items-center justify-center rounded-xl p-1.5 text-stone-900 hover:bg-stone-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
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
            className="overflow-hidden border-t border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:hidden"
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
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-base font-bold text-stone-900 dark:text-zinc-100 ${
                    link.id === 'try-pos'
                      ? 'bg-mintcom-green text-black'
                      : 'border border-stone-200 bg-stone-100 dark:border-zinc-800 dark:bg-zinc-900'
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-center text-base font-bold text-stone-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
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
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green px-4 py-3 text-center text-base font-bold text-black"
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
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green px-4 py-3 text-center text-base font-bold text-black"
                    >
                      <User size={18} />
                      {t('nav.dashboard', 'Dashboard')}
                    </Link>
                  )}
                </>
              ) : !hideCommercialLinks ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full rounded-xl border border-stone-300 px-4 py-3 text-center text-base font-bold text-stone-900 dark:border-zinc-700 dark:text-zinc-100"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full rounded-xl bg-mintcom-green px-4 py-3 text-center text-base font-bold text-black"
                  >
                {t('nav.startTrial', { defaultValue: 'Start 14-Day Free Trial' })}
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

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
   Navbar — Floating Capsule Design
   - Centered floating pill that hovers above content
   - Splits into distinct zones: brand | navigation | actions
   - Magnetic hover effects on nav items
   - Gradient border glow on scroll
   - Micro-interactions with spring physics
   - Dark mode: inverted luminance with neon accents
----------------------------------------------------------- */

export const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const isRtl = t('common.locale') === 'ar';

  useScrollLock(isMobileMenuOpen);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = isAuthenticated
    ? []
    : [
        { name: t('nav.features'), href: '/#features', id: 'features' },
        { name: t('nav.pricing'), href: '/#pricing', id: 'pricing' },
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

  return (
    <nav
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-x-0 top-0 z-50 flex items-start justify-center"
    >
      {/* Floating capsule container */}
      <motion.div
        initial={false}
        animate={{
          marginTop: isScrolled ? 12 : 16,
          width: isScrolled ? '92%' : '95%',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative max-w-[1200px] w-full"
      >
        {/* Animated gradient border */}
        <div
          aria-hidden
          className={`absolute -inset-[1px] rounded-[20px] transition-opacity duration-700 ${
            isScrolled ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(135deg, #7dc6a2 0%, transparent 40%, transparent 60%, #7dc6a2 100%)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
            borderRadius: '20px',
          }}
        />

        {/* Main navbar body */}
        <div
          className={`relative rounded-[20px] transition-all duration-500 ${
            isScrolled
              ? 'bg-white/80 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] dark:bg-[#0a0a0a]/80 dark:shadow-[0_8px_40px_-12px_rgba(125,198,162,0.08)]'
              : 'bg-white/40 dark:bg-[#0a0a0a]/40'
          }`}
          style={{
            backdropFilter: 'blur(20px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          }}
        >
          {/* Inner content */}
          <div className="relative z-10 flex items-center justify-between px-5 py-3 md:px-7">
            {/* Left zone: Logo */}
            <Link
              to="/"
              className="relative z-[60] flex shrink-0 items-center"
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (window.location.pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <span className="navbar-logo-full min-w-0">
                  <Logo size="lg" className="transition-transform duration-500" />
                </span>
                <span className="navbar-logo-icon">
                  <Logo variant="icon" size="lg" className="transition-transform duration-500" />
                </span>
              </motion.div>
            </Link>

            {/* Center zone: Navigation links */}
            <div className="relative z-[60] hidden items-center lg:flex">
              {!isAuthenticated && navLinks.length > 0 && (
                <div className="relative flex items-center rounded-xl bg-gray-100/70 px-1.5 py-1.5 dark:bg-white/[0.06]">
                  {/* Animated highlight pill */}
                  <AnimatePresence>
                    {hoveredLink && (
                      <motion.div
                        layoutId="nav-highlight"
                        className="absolute inset-y-1.5 rounded-lg bg-white shadow-sm dark:bg-white/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      />
                    )}
                  </AnimatePresence>

                  {navLinks.map((link) => (
                    <Link
                      key={link.id}
                      to={link.href}
                      onMouseEnter={() => setHoveredLink(link.id)}
                      onMouseLeave={() => setHoveredLink(null)}
                      className="relative z-10 px-5 py-2 text-[13px] font-semibold text-gray-600 transition-colors duration-200 hover:text-mintcom-green dark:text-gray-400 dark:hover:text-mintcom-green"
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
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right zone: Actions */}
            <div className="relative z-[60] hidden items-center gap-2 lg:flex">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/support"
                    className="group inline-flex items-center gap-2 rounded-full border border-gray-200/80 px-4 py-2 text-[13px] font-semibold text-gray-600 transition-all duration-300 hover:border-mintcom-green/30 hover:text-mintcom-green dark:border-white/10 dark:text-gray-300 dark:hover:border-mintcom-green/30 dark:hover:text-mintcom-green"
                  >
                    <Headset size={14} className="transition-transform duration-300 group-hover:scale-110" />
                    {t('nav.support')}
                  </Link>
                  <Link
                    to="/owner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-mintcom-green to-emerald-400 px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_16px_-4px_rgba(124,195,159,0.5)] transition-all duration-300 hover:shadow-[0_6px_24px_-4px_rgba(124,195,159,0.7)] active:scale-[0.97] dark:from-mintcom-green dark:to-emerald-500"
                  >
                    <User size={14} />
                    {t('nav.dashboard', 'Dashboard')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-[13px] font-semibold text-rose-500 transition-all duration-300 hover:bg-rose-100 hover:shadow-sm active:scale-[0.97] dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
                  >
                    <LogOut size={14} />
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="group relative overflow-hidden rounded-full px-4 py-2 text-[13px] font-semibold text-gray-600 transition-all duration-300 hover:text-mintcom-green dark:text-gray-400 dark:hover:text-mintcom-green"
                  >
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      {t('nav.login')}
                      <ArrowRight
                        size={12}
                        className={`opacity-0 transition-all duration-300 group-hover:opacity-100 ${
                          isRtl
                            ? 'translate-x-1 rotate-180 group-hover:translate-x-0'
                            : '-translate-x-1 group-hover:translate-x-0'
                        }`}
                      />
                    </span>
                    {/* Subtle underline that grows on hover */}
                    <span className="absolute inset-x-4 bottom-1.5 h-[2px] origin-left scale-x-0 rounded-full bg-mintcom-green/50 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                  </Link>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Link
                      to="/signup"
                      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-mintcom-green px-5 py-2.5 text-[13px] font-bold text-black shadow-[0_2px_12px_-2px_rgba(124,195,159,0.5)] transition-all duration-300 hover:shadow-[0_6px_24px_-4px_rgba(124,195,159,0.7)]"
                    >
                      {/* Shimmer effect */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full"
                      />
                      <span className="relative">{t('nav.getStarted')}</span>
                      <ArrowRight
                        size={13}
                        className={`relative transition-transform duration-300 ${
                          isRtl
                            ? 'rotate-180 group-hover:-translate-x-0.5'
                            : 'group-hover:translate-x-0.5'
                        }`}
                      />
                    </Link>
                  </motion.div>
                </>
              )}

              {/* Divider */}
              <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-white/10" />

              {/* Utilities */}
              <LanguageSwitcher
                dropdownDirection="down"
                buttonClassName="rounded-full bg-transparent border-0 hover:bg-gray-100 dark:hover:bg-white/[0.06] px-3 py-2"
              />
              <ThemeToggle
                dropdownDirection="down"
                iconSize={17}
                className="h-9 w-9 rounded-full border-0 bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              />
            </div>

            {/* Mobile controls */}
            <div className="relative z-[60] flex shrink-0 items-center gap-1.5 xs:gap-2 sm:gap-3 lg:hidden">
              <LanguageSwitcher compact showGlobeIcon={false} buttonClassName="min-h-10 px-3 rounded-full" />
              <ThemeToggle
                iconSize={18}
                className="h-10 w-10 rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:text-mintcom-green dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-mintcom-green"
              />
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={
                  isMobileMenuOpen
                    ? t('common.aria.closeMenu')
                    : t('common.aria.openMenu')
                }
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                whileTap={{ scale: 0.9 }}
                className="flex min-h-10 min-w-10 items-center justify-center rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-white/5"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X size={22} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu size={22} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile menu — full screen overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 40px) 40px)' }}
            animate={{ opacity: 1, clipPath: 'circle(150% at calc(100% - 40px) 40px)' }}
            exit={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 40px) 40px)' }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            id="mobile-menu"
            role="navigation"
            aria-label={t('common.aria.mobileNav')}
            className="fixed inset-0 z-40 bg-white dark:bg-[#050505] lg:hidden"
          >
            <div className="flex h-full flex-col items-center justify-center px-8">
              {/* Nav links */}
              <div className="flex flex-col items-center gap-8">
                {!isAuthenticated && navLinks.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.08, duration: 0.4, ease: 'easeOut' }}
                  >
                    <Link
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
                      className="font-barlow text-4xl font-black tracking-tight text-gray-900 transition-colors hover:text-mintcom-green dark:text-white sm:text-5xl"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Divider */}
              {!isAuthenticated && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  className="my-10 h-px w-32 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-white/20"
                />
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex w-full max-w-xs flex-col gap-3"
              >
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/support"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-5 text-center text-lg font-black tracking-tight text-gray-900 shadow-sm transition-transform active:scale-95 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
                    >
                      <Headset size={20} />
                      {t('nav.support')}
                    </Link>
                    <Link
                      to="/owner"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-mintcom-green to-emerald-400 py-5 text-center text-lg font-black tracking-tight text-white shadow-xl shadow-mintcom-green/30 transition-transform hover:scale-[1.02] active:scale-95"
                    >
                      <User size={20} />
                      {t('nav.dashboard', 'Dashboard')}
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-rose-50 py-5 text-center text-lg font-black tracking-tight text-rose-500 transition-colors hover:bg-rose-100 active:scale-95 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
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
                      className="w-full rounded-2xl border-2 border-gray-900 py-4 text-center text-lg font-black tracking-tight text-gray-900 transition-all active:scale-95 dark:border-white dark:text-white"
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-mintcom-green py-4 text-center text-lg font-black tracking-tight text-black shadow-xl shadow-mintcom-green/30 transition-all active:scale-95"
                    >
                      {t('nav.getStarted')}
                    </Link>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

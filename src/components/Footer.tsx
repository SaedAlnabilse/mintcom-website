import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  Instagram,
  Youtube,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  HelpCircle,
  Ticket,
} from 'lucide-react';
import { Logo } from './Logo';

/* -----------------------------------------------------------
   Footer — Redesigned: Clean, well-aligned, organized
   - 4-column balanced grid on desktop
   - Clear visual hierarchy with consistent spacing
   - CTA section for help center
   - Separated contact strip above bottom bar
----------------------------------------------------------- */

export const Footer = ({ minimal = false }: { minimal?: boolean }) => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';

  type FooterLink = {
    name: string;
    href?: string;
    target?: string;
    action?: () => void;
  };

  const productLinks: FooterLink[] = [
    { name: t('nav.features'), href: '/#features' },
    { name: t('nav.pricing'), href: '/#pricing' },
    { name: t('nav.support'), href: '/support' },
  ];

  const companyLinks: FooterLink[] = [
    { name: t('footer.aboutUs'), href: '/about' },
    { name: t('contact.title'), href: '/#contact' },
  ];

  const resourceLinks: FooterLink[] = [
    { name: t('footer.privacyPolicy'), href: '/legal/privacy' },
    { name: t('footer.termsOfService'), href: '/legal/terms' },
  ];

  const FooterLinkItem = ({ link }: { link: FooterLink }) => {
    if (link.href) {
      return (
        <Link
          to={link.href}
          {...(link.target ? { target: link.target, rel: 'noopener noreferrer' } : {})}
          onClick={(e) => {
            if (link.href?.startsWith('/#') && window.location.pathname === '/') {
              const el = document.getElementById(link.href.slice(2));
              if (el) {
                e.preventDefault();
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }}
          className="group inline-flex items-center gap-1.5 text-[13px] text-gray-500 transition-colors duration-200 hover:text-mintcom-green dark:text-gray-400 dark:hover:text-mintcom-green"
        >
          {link.name}
          <ArrowUpRight
            size={11}
            className="text-mintcom-green opacity-0 transition-opacity group-hover:opacity-100"
          />
        </Link>
      );
    }
    return (
      <button
        onClick={link.action}
        className="text-[13px] text-gray-500 transition-colors duration-200 hover:text-mintcom-green dark:text-gray-400 dark:hover:text-mintcom-green"
      >
        {link.name}
      </button>
    );
  };

  return (
    <footer
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`relative bg-gray-50 transition-colors duration-300 dark:bg-[#0a0a0a] ${
        minimal ? 'pb-6 pt-10' : 'pb-8 pt-16 lg:pt-20'
      }`}
    >
      {/* Top accent border */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-mintcom-green/50 to-transparent"
      />

      <div className="container mx-auto max-w-[1200px] px-6 md:px-10">
        {minimal ? (
          /* ===== Minimal footer ===== */
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Logo size="lg" />
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Mail size={14} className="text-mintcom-green" />
                <span dir="ltr">support@mintcompos.com</span>
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Phone size={14} className="text-mintcom-green" />
                <span dir="ltr">+962 79X XXX XXX</span>
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* ===== Main footer grid ===== */}
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
              {/* Brand column — spans 4 cols */}
              <div className="space-y-5 lg:col-span-4">
                <Logo size="lg" />
                <p className="max-w-[280px] text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                  {t('brand.description')}
                </p>
                <div className="flex gap-2.5">
                  {[
                    { Icon: Instagram, href: 'https://www.instagram.com', label: 'Instagram' },
                    { Icon: Youtube, href: 'https://www.youtube.com', label: 'YouTube' },
                  ].map((social, i) => (
                    <a
                      key={i}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition-all duration-200 hover:border-mintcom-green hover:bg-mintcom-green hover:text-white dark:border-white/10 dark:text-gray-500 dark:hover:border-mintcom-green dark:hover:bg-mintcom-green dark:hover:text-white"
                    >
                      <social.Icon size={15} />
                    </a>
                  ))}
                </div>

                {/* Contact info below social icons */}
                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href="mailto:support@mintcompos.com"
                    className="group flex items-center gap-2 text-[13px] text-gray-500 transition-colors hover:text-mintcom-green dark:text-gray-400"
                  >
                    <Mail size={13} className="shrink-0 text-mintcom-green" />
                    <span dir="ltr">support@mintcompos.com</span>
                  </a>
                  <a
                    href="tel:+96279XXXXXXX"
                    className="group flex items-center gap-2 text-[13px] text-gray-500 transition-colors hover:text-mintcom-green dark:text-gray-400"
                  >
                    <Phone size={13} className="shrink-0 text-mintcom-green" />
                    <span dir="ltr">+962 79X XXX XXX</span>
                  </a>
                </div>
              </div>

              {/* Product links — spans 2 cols */}
              <div className="lg:col-span-2">
                <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-900 dark:text-gray-200">
                  {t('footer.product')}
                </h4>
                <ul className="space-y-2.5">
                  {productLinks.map((link) => (
                    <li key={link.name}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company links — spans 2 cols */}
              <div className="lg:col-span-2">
                <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-900 dark:text-gray-200">
                  {t('footer.company')}
                </h4>
                <ul className="space-y-2.5">
                  {companyLinks.map((link) => (
                    <li key={link.name}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>

                {/* Legal links under company */}
                <h4 className="mb-4 mt-8 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-900 dark:text-gray-200">
                  Legal
                </h4>
                <ul className="space-y-2.5">
                  {resourceLinks.map((link) => (
                    <li key={link.name}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Help & Support — spans 4 cols */}
              <div className="lg:col-span-4">
                <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-900 dark:text-gray-200">
                  {t('footer.resources')}
                </h4>

                {/* Help Center card */}
                <Link
                  to="/support"
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-mintcom-green/40 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-mintcom-green/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green transition-colors group-hover:bg-mintcom-green group-hover:text-white">
                    <HelpCircle size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {t('footer.helpCenter')}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                      {t('footer.helpCenterDesc')}
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    className={`shrink-0 text-gray-300 transition-all duration-200 group-hover:text-mintcom-green ${
                      isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'
                    } dark:text-gray-600`}
                  />
                </Link>

                {/* Action buttons */}
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <Link
                    to="/support/articles"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 transition-all duration-200 hover:border-mintcom-green/40 hover:text-mintcom-green dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-mintcom-green/30 dark:hover:text-mintcom-green"
                  >
                    <BookOpen size={13} />
                    <span>{t('footer.browseArticles')}</span>
                  </Link>
                  <Link
                    to="/support/tickets/new"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-mintcom-green px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-mintcom-green/85 hover:shadow-md"
                  >
                    <Ticket size={13} />
                    <span>{t('footer.submitTicket')}</span>
                  </Link>
                </div>
              </div>
            </div>

          </>
        )}

        {/* ===== Bottom bar ===== */}
        <div className="mt-8 border-t border-gray-200/70 pt-6 dark:border-white/5">
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 sm:text-start">
            {t('brand.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

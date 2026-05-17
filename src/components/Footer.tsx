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
   Footer — Apple-style minimal footer
   - Clean 5-column grid on desktop
   - Subtle top border with gradient accent
   - Compact, functional, cohesive with the rest of the redesign
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
    { name: t('footer.privacyPolicy'), href: '/legal/privacy', target: '_blank' },
    { name: t('footer.termsOfService'), href: '/legal/terms', target: '_blank' },
  ];

  const FooterLinkItem = ({ link }: { link: FooterLink }) => {
    if (link.href) {
      return (
        <Link
          to={link.href}
          target={link.target}
          rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
          onClick={(e) => {
            if (link.href?.startsWith('/#') && window.location.pathname === '/') {
              const el = document.getElementById(link.href.slice(2));
              if (el) {
                e.preventDefault();
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }}
          className="group inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-mintcom-green dark:text-gray-400 dark:hover:text-mintcom-green"
        >
          {link.name}
          {link.target === '_blank' && (
            <ArrowUpRight
              size={11}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            />
          )}
        </Link>
      );
    }
    return (
      <button
        onClick={link.action}
        className="text-sm font-medium text-gray-500 transition-colors hover:text-mintcom-green dark:text-gray-400 dark:hover:text-mintcom-green"
      >
        {link.name}
      </button>
    );
  };

  return (
    <footer
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`relative border-t border-gray-200/70 bg-white transition-colors duration-300 dark:border-white/5 dark:bg-[#050505] ${
        minimal ? 'pb-6 pt-10' : 'pb-10 pt-16 lg:pt-20'
      }`}
    >
      {/* Gradient accent line at the top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mintcom-green/40 to-transparent"
      />

      <div className="container mx-auto max-w-[1280px] px-6 md:px-10">
        {minimal ? (
          /* ===== Minimal footer ===== */
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
            <Logo size="lg" />
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Mail size={14} className="text-mintcom-green" />
                <span dir="ltr">support@mintcompos.com</span>
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Phone size={14} className="text-mintcom-green" />
                <span dir="ltr">+962 790 000 000</span>
              </span>
            </div>
          </div>
        ) : (
          /* ===== Full footer ===== */
          <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
            {/* Brand column */}
            <div className="space-y-6 lg:col-span-2">
              <Logo size="lg" />
              <p className="max-w-xs text-sm font-light leading-relaxed text-gray-500 dark:text-gray-400">
                {t('brand.description')}
              </p>
              <div className="flex gap-3">
                {[
                  { Icon: Instagram, href: 'https://www.instagram.com' },
                  { Icon: Youtube, href: 'https://www.youtube.com' },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all hover:border-mintcom-green hover:bg-mintcom-green hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-gray-400"
                  >
                    <social.Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                {t('footer.product')}
              </h4>
              <ul className="space-y-3">
                {productLinks.map((link) => (
                  <li key={link.name}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                {t('footer.company')}
              </h4>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.name}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources + Contact */}
            <div>
              <h4 className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                {t('footer.resources')}
              </h4>

              <Link
                to="/support"
                className="group flex items-start gap-3 rounded-lg border border-mintcom-green/20 bg-mintcom-green/5 p-3 transition-all hover:border-mintcom-green/40 hover:bg-mintcom-green/10 dark:border-mintcom-green/20 dark:bg-mintcom-green/10 dark:hover:bg-mintcom-green/15"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mintcom-green/15 text-mintcom-green transition-colors group-hover:bg-mintcom-green group-hover:text-black">
                  <HelpCircle size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-sm font-bold text-gray-800 transition-colors group-hover:text-mintcom-green dark:text-gray-100">
                    {t('footer.helpCenter')}
                    <ChevronRight
                      size={14}
                      className={`shrink-0 text-mintcom-green transition-transform ${
                        isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
                      }`}
                    />
                  </span>
                  <span className="mt-1 block text-xs font-medium leading-5 text-gray-500 dark:text-gray-400">
                    {t('footer.helpCenterDesc')}
                  </span>
                </span>
              </Link>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/support/articles"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:border-mintcom-green/40 hover:text-mintcom-green dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-mintcom-green/40 dark:hover:text-mintcom-green"
                >
                  <BookOpen size={13} />
                  <span>{t('footer.browseArticles')}</span>
                </Link>
                <Link
                  to="/support/tickets/new"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-mintcom-green px-3 py-2 text-xs font-bold text-black transition-all hover:bg-mintcom-green/90"
                >
                  <Ticket size={13} />
                  <span>{t('footer.submitTicket')}</span>
                </Link>
              </div>

              <ul className="mt-5 space-y-3">
                {resourceLinks.map((link) => (
                  <li key={link.name}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-mintcom-green/10">
                    <Mail size={12} className="text-mintcom-green" />
                  </div>
                  <span dir="ltr">support@mintcompos.com</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-mintcom-green/10">
                    <Phone size={12} className="text-mintcom-green" />
                  </div>
                  <span dir="ltr">+962 790 000 000</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div
          className={`flex flex-col items-center justify-between gap-5 border-t border-gray-200/70 dark:border-white/5 md:flex-row ${
            minimal ? 'pt-6' : 'pt-8'
          }`}
        >
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t('brand.copyright')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-end">
            <Link
              to="/about"
              className="text-sm text-gray-400 transition-colors hover:text-mintcom-green dark:text-gray-500"
            >
              {t('footer.aboutUs')}
            </Link>
            <a
              href="/legal/privacy"
              target="_blank"
              className="text-sm text-gray-400 transition-colors hover:text-mintcom-green dark:text-gray-500"
            >
              {t('footer.privacyPolicy')}
            </a>
            <a
              href="/legal/terms"
              target="_blank"
              className="text-sm text-gray-400 transition-colors hover:text-mintcom-green dark:text-gray-500"
            >
              {t('footer.termsOfService')}
            </a>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent('open-feedback'))
              }
              className="text-sm text-gray-400 transition-colors hover:text-mintcom-green dark:text-gray-500"
            >
              Feedback
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

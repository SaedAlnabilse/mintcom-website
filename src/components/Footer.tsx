import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram, Youtube } from 'lucide-react';
import { Logo } from './Logo';

export const Footer = ({ minimal = false }: { minimal?: boolean }) => {
  const { t } = useTranslation();
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
    { name: t('footer.helpCenter'), href: '/support' },
    { name: t('footer.privacyPolicy'), href: '/legal/privacy', target: '_blank' },
    { name: t('footer.termsOfService'), href: '/legal/terms', target: '_blank' },
  ];

  return (
    <>
      <footer className={`bg-gray-50 dark:bg-[#050505] border-t border-gray-200 dark:border-white/10 ${minimal ? 'pt-10 pb-6' : 'pt-16 lg:pt-20 pb-10'} transition-colors duration-300`} dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className={minimal ? "flex flex-col sm:flex-row justify-between items-center gap-8 mb-8" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20 items-start"}>
            {/* Brand */}
            <div className={minimal ? "space-y-4" : "space-y-8 flex flex-col"} dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
              <div className="-mt-1.5 h-10 flex items-center">
                <Logo size="lg" />
              </div>
              {!minimal && (
                <div className="pt-1.5">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 max-w-xs leading-6">
                    {t('brand.description')}
                  </p>
                  <div className="flex gap-4 mt-8">
                    {[
                      { Icon: Instagram, href: 'https://www.instagram.com' },
                      { Icon: Youtube, href: 'https://www.youtube.com' }
                    ].map((social, i) => (
                      <a
                        key={i}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-paymint-green hover:text-black hover:border-paymint-green transition-all"
                      >
                        <social.Icon size={18} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product */}
            {!minimal && (
              <div>
                <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-8 transition-colors">{t('footer.product')}</div>
                <ul className="space-y-4">
                  {productLinks.map((link) => (
                    <li key={link.name}>
                      {link.href ? (
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
                          className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-paymint-green transition-colors"
                        >
                          {link.name}
                        </Link>
                      ) : (
                        <button
                          onClick={link.action}
                          className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-paymint-green transition-colors"
                        >
                          {link.name}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Company */}
            {!minimal && (
              <div>
                <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-8 transition-colors">{t('footer.company')}</div>
                <ul className="space-y-4">
                  {companyLinks.map((link) => (
                    <li key={link.name}>
                      {link.href ? (
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
                          className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-paymint-green transition-colors"
                        >
                          {link.name}
                        </Link>
                      ) : (
                        <button
                          onClick={link.action}
                          className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-paymint-green transition-colors"
                        >
                          {link.name}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resources */}
            {!minimal && (
              <div>
                <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-8 transition-colors">{t('footer.resources')}</div>
                <ul className="space-y-4">
                  {resourceLinks.map((link) => (
                    <li key={link.name}>
                      {link.href ? (
                        <Link
                          to={link.href}
                          target={link.target}
                          rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                          className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-paymint-green transition-colors"
                        >
                          {link.name}
                        </Link>
                      ) : (
                        <button
                          onClick={link.action}
                          className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-paymint-green transition-colors"
                        >
                          {link.name}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact */}
            <div className={minimal ? "flex items-center" : ""}>
              {!minimal && <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-8 transition-colors">{t('footer.getInTouch')}</div>}
              <ul className={minimal ? "flex flex-col sm:flex-row items-center gap-6" : "space-y-6"}>
                <li className="flex items-center gap-3 text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">
                  <div className={`${minimal ? 'w-8 h-8' : 'w-8 h-8'} rounded-lg bg-gray-200/50 dark:bg-white/5 flex items-center justify-center shrink-0 aspect-square`}>
                    <Mail size={14} className="text-paymint-green" />
                  </div>
                  <span dir="ltr">hello@paymint.com</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">
                  <div className={`${minimal ? 'w-8 h-8' : 'w-8 h-8'} rounded-lg bg-gray-200/50 dark:bg-white/5 flex items-center justify-center shrink-0 aspect-square`}>
                    <Phone size={14} className="text-paymint-green" />
                  </div>
                  <span dir="ltr">+962 790 000 000</span>
                </li>
              </ul>
            </div>
          </div>

          <div className={`border-t border-gray-200 dark:border-white/5 ${minimal ? 'pt-6' : 'pt-10'} flex flex-col md:flex-row justify-between items-center gap-6`}>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">
              {t('brand.copyright')}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-8 gap-y-4">
              <Link to="/about" className="text-gray-500 dark:text-gray-400 text-sm font-bold hover:text-paymint-green transition-colors">{t('footer.aboutUs')}</Link>
              <a href="/legal/privacy" target="_blank" className="text-gray-500 dark:text-gray-400 text-sm font-bold hover:text-paymint-green transition-colors">{t('footer.privacyPolicy')}</a>
              <a href="/legal/terms" target="_blank" className="text-gray-500 dark:text-gray-400 text-sm font-bold hover:text-paymint-green transition-colors">{t('footer.termsOfService')}</a>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-feedback'))}
                className="text-gray-500 dark:text-gray-400 text-sm font-bold hover:text-paymint-green transition-colors"
              >
                Feedback
              </button>
            </div>
          </div>
        </div>
      </footer>


    </>
  );
};


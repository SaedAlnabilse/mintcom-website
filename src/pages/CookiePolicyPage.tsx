import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Globe, BarChart3, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CookiePolicyPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] font-sans text-gray-900 dark:text-white pb-20">
      {/* Header / Hero */}
      <div className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 text-paymint-green mb-4">
              <Shield size={24} />
              <span className="text-xs font-black tracking-widest uppercase">Legal Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
              Cookie Statement
            </h1>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              We believe in being transparent about how we use your data. This policy explains how we use cookies and similar technologies to recognize you when you visit our website.
            </p>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 pt-4">
              <span className="flex items-center gap-2">
                <Clock size={16} />
                Last Updated: February 2, 2026
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-[250px_1fr] gap-12">
        {/* Sidebar Navigation (Sticky) */}
        <aside className="hidden md:block">
          <div className="sticky top-24 space-y-1">
            {[
              { id: 'what-are-cookies', label: 'What are cookies?' },
              { id: 'why-use', label: 'Why do we use them?' },
              { id: 'types-of-cookies', label: 'Types of Cookies' },
              { id: 'third-party', label: 'Third-Party Cookies' },
              { id: 'control', label: 'How to control cookies' },
              { id: 'updates', label: 'Updates to this policy' },
            ].map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="block py-2 px-4 rounded-lg text-xs font-bold text-gray-500 hover:text-paymint-green hover:bg-paymint-green/5 transition-all"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-8">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-black tracking-widest shadow-lg hover:opacity-90 transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        </aside>

        {/* Article Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-paymint-green">
          
          <section id="what-are-cookies" className="scroll-mt-28">
            <h2>What are cookies?</h2>
            <p>
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
            </p>
            <p>
              Cookies set by the website owner (in this case, Paymint) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g. like advertising, interactive content and analytics). The parties that set these third-party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.
            </p>
          </section>

          <section id="why-use" className="scroll-mt-28 pt-8">
            <h2>Why do we use cookies?</h2>
            <p>
              We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Websites to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties. Third parties serve cookies through our Websites for advertising, analytics and other purposes.
            </p>
          </section>

          <section id="types-of-cookies" className="scroll-mt-28 pt-8">
            <h2>Types of Cookies We Use</h2>
            
            <div className="not-prose grid gap-6 mt-6 mb-8">
              <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-lg">
                    <Lock size={20} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white m-0">Essential Cookies</h3>
                </div>
                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                  These cookies are strictly necessary to provide you with services available through our Websites and to use some of its features, such as access to secure areas.
                </p>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                    <BarChart3 size={20} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white m-0">Analytics & Customization</h3>
                </div>
                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                  These cookies collect information that is used either in aggregate form to help us understand how our Websites are being used or how effective our marketing campaigns are, or to help us customize our Websites for you.
                </p>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                    <Globe size={20} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white m-0">Advertising (Targeting)</h3>
                </div>
                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                  These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests.
                </p>
              </div>
            </div>
          </section>

          <section id="third-party" className="scroll-mt-28 pt-8">
            <h2>Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we may also use various third-parties cookies to report usage statistics of the Service, deliver advertisements on and through the Service, and so on.
            </p>
            <ul>
              <li><strong>Google Analytics:</strong> We use Google Analytics to understand how our website is being used in order to improve the user experience. User data is all anonymous.</li>
              <li><strong>Facebook Pixel:</strong> We use Facebook Pixel to measure, optimize and build audiences for our advertising campaigns.</li>
            </ul>
          </section>

          <section id="control" className="scroll-mt-28 pt-8">
            <h2>How can I control cookies?</h2>
            <p>
              You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
            </p>
            <div className="bg-paymint-green/10 border border-paymint-green/20 rounded-xl p-6 my-6">
              <h4 className="text-paymint-green font-bold text-base mb-2 not-prose">Preference Center</h4>
              <p className="text-gray-700 dark:text-gray-300 text-xs font-bold mb-4">
                You can change your settings at any time by clicking the button below.
              </p>
              <button 
                onClick={() => {
                   window.dispatchEvent(new Event('open-cookie-preferences'));
                }}
                className="px-6 py-2.5 bg-paymint-green text-black text-xs font-black tracking-widest rounded-lg hover:bg-emerald-400 transition-colors shadow-sm"
              >
                OPEN COOKIE SETTINGS
              </button>
            </div>
            <p>
              In addition to the Cookie Consent Manager, most advertising networks offer you a way to opt out of targeted advertising. If you would like to find out more information, please visit <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">http://www.aboutads.info/choices/</a> or <a href="http://www.youronlinechoices.com" target="_blank" rel="noopener noreferrer">http://www.youronlinechoices.com</a>.
            </p>
          </section>

          <section id="updates" className="scroll-mt-28 pt-8">
            <h2>Updates to this Policy</h2>
            <p>
              We may update this Cookie Statement from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Statement regularly to stay informed about our use of cookies and related technologies.
            </p>
            <p>
              The date at the top of this Cookie Statement indicates when it was last updated.
            </p>
          </section>

          <section className="scroll-mt-28 pt-8 border-t border-gray-200 dark:border-white/10 mt-12">
            <h3>Questions?</h3>
            <p>
              If you have any questions about our use of cookies or other technologies, please email us at <a href="mailto:privacy@paymint.com">privacy@paymint.com</a>.
            </p>
          </section>

        </article>
      </div>
    </div>
  );
}

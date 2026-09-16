import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Wifi, Store, BarChart3 } from 'lucide-react';

interface AuthShowcasePanelProps {
  /** Grid column classes, so each auth page can set its own split. */
  className?: string;
}

/**
 * Product showcase shown beside the sign-up and log-in forms. Both auth pages
 * render the same panel, so the copy and layout only live here.
 */
export function AuthShowcasePanel({ className = '' }: AuthShowcasePanelProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => [
    { label: t('auth.signup.showcaseStatOrders', 'Orders'), value: '142' },
    { label: t('auth.signup.showcaseStatNetSales', 'Net Sales'), value: '$3,842' },
    { label: t('auth.signup.showcaseStatAvgTicket', 'Avg Ticket'), value: '$27.05' },
  ], [t]);

  const features = useMemo(() => [
    {
      icon: Wifi,
      title: t('auth.signup.showcaseOfflineTitle', 'Zero-Downtime Offline'),
      description: t('auth.signup.showcaseOfflineDesc', 'Keep ringing up orders without internet. Auto-syncs on reconnect.'),
    },
    {
      icon: Store,
      title: t('auth.signup.showcaseBranchesTitle', 'Multi-Branch Control'),
      description: t('auth.signup.showcaseBranchesDesc', 'Manage all branches, menus, pricing, and staff from one dashboard.'),
    },
    {
      icon: BarChart3,
      title: t('auth.signup.showcaseAnalyticsTitle', 'Advanced Analytics & Reports'),
      description: t('auth.signup.showcaseAnalyticsDesc', 'Real-time sales, shift hours, profit margins, and payment breakdown.'),
    },
    {
      icon: ShieldCheck,
      title: t('auth.signup.showcaseRolesTitle', 'Custom Roles & Passwords'),
      description: t('auth.signup.showcaseRolesDesc', 'Manage team access, custom permissions, and secure staff password logins.'),
    },
  ], [t]);

  return (
    <div className={`relative hidden h-full flex-col justify-between overflow-hidden rounded-[24px] border border-gray-200/90 bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95 p-7 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:from-[#0E1424]/90 dark:via-[#090D18]/80 dark:to-[#0E1424]/90 sm:p-8 lg:flex 2xl:p-10 ${className}`}>
      <div aria-hidden className="pointer-events-none absolute -start-20 -top-20 h-64 w-64 rounded-full bg-mintcom-green/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -end-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative z-10 mb-5">
          <h2 className="font-magilio text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl 2xl:text-4xl">
            {t('auth.signup.showcaseTitle', 'Simple Is Superior')}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm 2xl:text-base font-medium leading-relaxed text-gray-600 dark:text-gray-300">
            {t('auth.signup.showcaseSubtitle', 'Offline-first terminal, kitchen display, multi-establishment control, and live sync.')}
          </p>
        </div>

        <div className="relative z-10 mb-6 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="border-b border-gray-100 pb-3 dark:border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('auth.signup.showcaseRevenueLabel', "Today's Revenue")}
            </p>
            <p className="font-magilio text-2xl font-bold text-gray-900 dark:text-white">$3,842.50</p>
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-3 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-gray-50 p-2.5 dark:bg-white/[0.03]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 grid flex-1 auto-rows-fr gap-3.5 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-gray-100 bg-white/70 p-4 transition-all duration-300 hover:border-mintcom-green/40 hover:bg-white dark:border-white/5 dark:bg-white/[0.03] dark:hover:border-mintcom-green/30 dark:hover:bg-white/[0.06]"
            >
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green transition-transform group-hover:scale-110">
                <Icon size={17} />
              </div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">{title}</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-6 flex items-center justify-between border-t border-gray-100/80 pt-4 text-xs font-semibold text-gray-600 dark:border-white/10 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-mintcom-green" />
          <span>{t('auth.signup.showcaseSyncBadge', 'Instant Cloud Sync & Auto-Backup')}</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-mintcom-greenInk dark:text-mintcom-green">
          <ShieldCheck size={14} />
          <span>{t('auth.signup.showcaseSecurityBadge', 'PCI-DSS Secured')}</span>
        </div>
      </div>
    </div>
  );
}

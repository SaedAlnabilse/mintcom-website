import { useState, type KeyboardEvent } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Bell,
  CreditCard,
  LifeBuoy,
  Package,
  Plus,
  RotateCcw,
  Shield,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BackofficeAlert } from '../../services/backofficeAlertsApi';
import { formatCurrencyCode } from '../../utils/currency';
import { formatInEstablishmentTimezone } from '../../utils/establishmentTime';
import { useAuth } from '../../context/AuthContext';
import {
  getAlertPresentation,
  isCashAlertKind,
  isTrialAlert,
  type AlertIconName,
  type AlertSeverity,
} from './alertPresentation';

const ICONS: Record<AlertIconName, LucideIcon> = {
  'alert-triangle': AlertTriangle,
  plus: Plus,
  'alert-circle': AlertCircle,
  'alert-octagon': AlertOctagon,
  package: Package,
  'rotate-ccw': RotateCcw,
  'credit-card': CreditCard,
  'life-buoy': LifeBuoy,
  shield: Shield,
  bell: Bell,
};

const TONE_STYLES: Record<
  AlertSeverity,
  { icon: string; iconBackground: string; pill: string }
> = {
  critical: {
    icon: 'text-red-600 dark:text-red-400',
    iconBackground: 'bg-red-50 dark:bg-red-500/10',
    pill: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  },
  warning: {
    icon: 'text-amber-600 dark:text-amber-400',
    iconBackground: 'bg-amber-50 dark:bg-amber-500/10',
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  },
  info: {
    icon: 'text-emerald-700 dark:text-mintcom-green',
    iconBackground: 'bg-emerald-50 dark:bg-mintcom-green/10',
    pill: 'bg-emerald-50 text-emerald-700 dark:bg-mintcom-green/10 dark:text-mintcom-green',
  },
};

const toFiniteNumber = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const getEmployeeName = (alert: BackofficeAlert): string => {
  if (alert.employeeName) return alert.employeeName;

  const fullName = [alert.employee?.firstName, alert.employee?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || alert.employee?.username || '';
};

interface AlertRowProps {
  alert: BackofficeAlert;
  onActivate?: (alert: BackofficeAlert) => void;
  onDismiss?: (alert: BackofficeAlert) => void;
  compact?: boolean;
  showDismiss?: boolean;
}

export function AlertRow({
  alert,
  onActivate,
  onDismiss,
  compact = false,
  showDismiss = true,
}: AlertRowProps) {
  const { t, i18n } = useTranslation();
  const { currentEstablishment } = useAuth();
  const presentation = getAlertPresentation(alert);
  const tone = TONE_STYLES[presentation.tone];
  const Icon = ICONS[presentation.icon];
  const trialAlert = isTrialAlert(alert);
  const dismissible = showDismiss && !trialAlert && alert.isDismissible !== false;
  const interactive = Boolean(onActivate);
  const [renderedAt] = useState(Date.now);
  const employeeName = getEmployeeName(alert);
  const currency = alert.establishment?.currency;
  const locale = i18n.resolvedLanguage || i18n.language || 'en';

  const relativeTime = (() => {
    const timestamp = new Date(alert.createdAt).getTime();
    if (!Number.isFinite(timestamp)) return '';

    const elapsedMinutes = Math.max(
      0,
      Math.floor((renderedAt - timestamp) / 60_000),
    );
    if (elapsedMinutes < 1) return t('notifications.time.justNow');
    if (elapsedMinutes < 60) {
      return t('notifications.time.minutesAgo', { count: elapsedMinutes });
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
      return t('notifications.time.hoursAgo', { count: elapsedHours });
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays < 7) {
      return t('notifications.time.daysAgo', { count: elapsedDays });
    }

    return formatInEstablishmentTimezone(timestamp, locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }, currentEstablishment);
  })();

  const description = (() => {
    if (alert.messageKey) {
      const params = alert.params ? { ...alert.params } : undefined;
      if (params?.statusKey) {
        params.status = t(
          `notifications.generated.supportStatusLabel.${params.statusKey}`,
        );
      }
      return t(alert.messageKey, params);
    }

    if (isCashAlertKind(alert.alertKind)) {
      const expected = toFiniteNumber(alert.expectedAmount);
      const actual = toFiniteNumber(alert.actualAmount);
      if (expected !== null && actual !== null) {
        return t('notifications.details.expectedCounted', {
          expected: formatCurrencyCode(expected, currency, locale),
          actual: formatCurrencyCode(actual, currency, locale),
        });
      }
    }

    if (alert.item) {
      const stock = toFiniteNumber(alert.item.availableStock);
      return stock === null
        ? alert.item.name
        : t('notifications.details.itemRemaining', {
            item: alert.item.name,
            count: stock,
          });
    }

    if (alert.rawMaterial) {
      const quantity = toFiniteNumber(alert.rawMaterial.quantity);
      return quantity === null
        ? alert.rawMaterial.name
        : t('notifications.details.materialRemaining', {
            material: alert.rawMaterial.name,
            count: quantity,
            unit: alert.rawMaterial.unit || '',
          });
    }

    return alert.message;
  })();

  const footerPill = (() => {
    if (isCashAlertKind(alert.alertKind)) {
      const discrepancy = toFiniteNumber(alert.discrepancy);
      const amount = toFiniteNumber(alert.amount) ?? Math.abs(discrepancy ?? 0);
      if (amount > 0) {
        const sign = alert.alertKind === 'cash_shortage' ? '-' : '+';
        return `${sign}${formatCurrencyCode(amount, currency, locale)}`;
      }
    }

    if (alert.item?.availableStock !== undefined) {
      return t('notifications.details.stockLeft', {
        count: alert.item.availableStock,
      });
    }

    return t(presentation.labelKey);
  })();

  const title = alert.titleKey
    ? t(alert.titleKey, alert.params ?? undefined)
    : isCashAlertKind(alert.alertKind) && employeeName
      ? t('notifications.details.kindByEmployee', {
          kind: t(presentation.labelKey),
          employee: employeeName,
        })
      : alert.title || t(presentation.labelKey);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onActivate || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onActivate(alert);
  };

  return (
    <div
      role={interactive ? 'link' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onActivate?.(alert) : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      aria-label={interactive ? t('notifications.accessibility.openAlert', { title }) : undefined}
      className={`group relative flex gap-3 border-b border-gray-100 px-4 py-4 text-start last:border-b-0 dark:border-white/5 ${
        alert.isRead
          ? 'bg-white dark:bg-[#0D0D0D]'
          : 'bg-mintcom-green/[0.06] dark:bg-mintcom-green/[0.04]'
      } ${interactive ? 'cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-mintcom-green dark:hover:bg-white/[0.04]' : ''} ${
        compact ? 'py-3' : ''
      }`}
    >
      {!alert.isRead && <span className="sr-only">{t('notifications.stats.unread')}</span>}

      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.iconBackground} ${tone.icon}`}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2.25} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-bold text-gray-900 dark:text-white">
              {title}
            </p>
            {!compact && (
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-start gap-2">
            <time className="pt-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">
              {relativeTime}
            </time>
            {dismissible && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDismiss?.(alert);
                }}
                className="rounded-lg p-1 text-gray-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                aria-label={t('notifications.actions.dismiss')}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {!compact && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone.pill}`}>
                {footerPill}
              </span>
              {trialAlert && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  {t('notifications.trial.persistent')}
                </span>
              )}
            </div>

            {alert.establishment?.name && (
              <span className="max-w-full truncate text-xs font-semibold text-emerald-700 dark:text-mintcom-green">
                {alert.establishment.name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { Scale, Percent, FileEdit, History, Trash2, CheckCircle2, AlertCircle, Info, Receipt, Ban } from 'lucide-react';
import { BiIcon } from '../../../ui/BiIcon';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { SalesSummary } from '../../../../types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AnalyticsEmptyState } from '../AnalyticsEmptyState';
import { StatValue } from '../../../../components/ui/StatValue';

interface TaxesViewProps {
  salesData: SalesSummary;
}

const toNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

/**
 * Report buckets (`taxBreakdown[].rate`, `currentTaxRate`) arrive
 * PERCENT-scale from the server aggregation (`rate * 100`), so they are used
 * as-is. The old `rate > 1 ? rate : rate * 100` guess read a 0.5% bucket as
 * 50%.
 */
const reportRateToPercent = (rate: number) => {
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return rate;
};

type TaxRowType = 'current' | 'changed' | 'previous' | 'standard' | 'deleted';

export const TaxesView = React.memo(function TaxesView({ salesData }: TaxesViewProps) {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  const taxBreakdown = React.useMemo(() => {
    const currentTaxRate = reportRateToPercent(
      toNumber(salesData.currentTaxRate ?? salesData.currentTaxRatePercent),
    );
    const isCurrentRate = (rate: number) =>
      currentTaxRate > 0 && Math.abs(rate - currentTaxRate) < 0.01;
    const taxTypeSortRank: Record<TaxRowType, number> =
      currentTaxRate > 0
        ? { current: 0, changed: 1, previous: 2, standard: 3, deleted: 4 }
        : { current: 0, standard: 0, changed: 1, previous: 2, deleted: 3 };
    const getTaxType = (tax: any, isChanged: boolean, rate: number): TaxRowType => {
      const explicitType = String(tax?.taxType ?? '').toLowerCase();
      if (
        explicitType === 'current' ||
        explicitType === 'changed' ||
        explicitType === 'previous' ||
        explicitType === 'standard' ||
        explicitType === 'deleted'
      ) {
        return explicitType as TaxRowType;
      }
      if (tax?.isDeleted) return 'deleted';
      if (isChanged) return 'changed';
      if (currentTaxRate > 0) return isCurrentRate(rate) ? 'current' : 'previous';
      return 'standard';
    };
    const getTaxTypeLabel = (taxType: TaxRowType) => {
      switch (taxType) {
        case 'deleted':
          return t('orders.reports.taxes.deletedTaxRate', { defaultValue: 'Deleted tax rate' });
        case 'current':
        case 'standard':
          return t('orders.reports.taxes.standardTaxRate', { defaultValue: 'Standard tax rate' });
        case 'changed':
          return t('orders.reports.taxes.changedTaxRate', { defaultValue: 'Changed order tax rate' });
        case 'previous':
          return t('orders.reports.taxes.previousTaxRate', { defaultValue: 'Previous tax rate' });
        default:
          return t('orders.reports.taxes.standardTaxRate', { defaultValue: 'Standard tax rate' });
      }
    };
    const getTaxTypeDescription = (taxType: TaxRowType) => {
      switch (taxType) {
        case 'deleted':
          return t('orders.reports.taxes.deletedTaxDescription', { defaultValue: 'This tax rate was deleted but historical records are preserved' });
        case 'current':
        case 'standard':
          return t('orders.reports.taxes.currentTaxDescription', { defaultValue: 'Used the current location tax setting' });
        case 'changed':
          return t('orders.reports.taxes.changedTaxDescription', { defaultValue: 'Edited in the order before payment' });
        case 'previous':
          return t('orders.reports.taxes.previousTaxDescription', { defaultValue: 'Used a location tax setting before it changed' });
        default:
          return t('orders.reports.taxes.standardTaxDescription', { defaultValue: 'Used the location tax setting' });
      }
    };

    return (salesData.taxBreakdown || []).map((tax: any) => {
      const rawRate = reportRateToPercent(toNumber(tax.rate ?? tax.taxRate));
      const rateLabel = tax.rateLabel || (rawRate > 0 ? `${Number(rawRate.toFixed(2))}%` : '');
      const isChanged = Boolean(tax.isChanged);
      const isDeleted = Boolean(tax.isDeleted || String(tax.taxType).toLowerCase() === 'deleted');
      const taxType = getTaxType(tax, isChanged, rawRate);
      const baseName = getTaxTypeLabel(taxType);
      // Service/other-charge tax rides its own bucket (SERVICE_CHARGE) — never
      // bundled into the item rows, even at the same rate.
      const isServiceCharge = String(tax.category ?? '').toUpperCase() === 'SERVICE_CHARGE';
      const isExemptRow = Boolean(tax.isExempt) || (isServiceCharge && rawRate === 0);
      const scLabel = t('orders.reports.taxes.serviceCharge', { defaultValue: 'Service Charge' });
      const name = isServiceCharge
        ? isExemptRow
          ? `${scLabel} (${t('orders.reports.taxes.exempt', { defaultValue: 'Exempt' })})`
          : rateLabel ? `${scLabel} ${rateLabel}` : scLabel
        : tax.name || tax.taxName || baseName;
      const description = isServiceCharge
        ? isExemptRow
          ? t('orders.reports.taxes.serviceChargeExemptDesc', { defaultValue: 'Service/other charges exempt from tax.' })
          : t('orders.reports.taxes.serviceChargeDesc', { defaultValue: 'Tax on order service/other charges.' })
        : tax.description || getTaxTypeDescription(taxType);

      return {
        ...tax,
        name,
        description,
        taxType,
        isServiceCharge,
        isExemptRow,
        isDeleted,
        sortRank: taxTypeSortRank[taxType],
        ratePercent: rawRate,
        rateLabel,
        isChanged,
        taxableAmount: toNumber(tax.taxableAmount ?? tax.taxable),
        collected: toNumber(tax.collected ?? tax.taxAmount ?? tax.amount),
        transactions: toNumber(tax.transactions ?? tax.orderCount),
        refundCount: toNumber(tax.refundCount),
      };
    }).sort((a, b) => a.sortRank - b.sortRank || Math.abs(b.collected) - Math.abs(a.collected));
  }, [salesData.currentTaxRate, salesData.currentTaxRatePercent, salesData.taxBreakdown, t]);

  const totalTax = toNumber(salesData.taxCollected);
  const taxableFromRows = taxBreakdown.reduce((sum, tax) => sum + tax.taxableAmount, 0);
  const grossSales = toNumber(salesData.totalRevenue);
  // Items-only taxable base (excl. tax AND service charge), matching the receipt
  // model. grossSales carries both, so subtract the service charge when the
  // backend did not supply an explicit base figure.
  const serviceChargeTotal = toNumber(
    salesData.netServiceChargeCollected ??
      (salesData as any).netOtherChargesCollected ??
      salesData.serviceChargeCollected ??
      (salesData as any).otherChargesCollected ??
      0,
  );
  const taxableSales = Math.max(
    taxableFromRows || toNumber(salesData.netSalesBeforeTaxAndServiceCharge) || grossSales - totalTax - serviceChargeTotal,
    0,
  );
  const averageTaxRate = taxableSales > 0 ? totalTax / taxableSales : 0;
  const hasTaxBreakdown = taxBreakdown.length > 0;
  const changedRows = taxBreakdown.filter((tax) => tax.isChanged);
  const changedOrders = changedRows.reduce((sum, tax) => sum + tax.transactions, 0);
  const changedRefunds = changedRows.reduce((sum, tax) => sum + tax.refundCount, 0);
  const hasTaxActivity =
    taxBreakdown.some((tax) =>
      tax.collected !== 0 ||
      tax.taxableAmount !== 0 ||
      tax.transactions > 0 ||
      tax.refundCount > 0
    ) ||
    totalTax !== 0 ||
    grossSales > 0 ||
    toNumber(salesData.totalOrders) > 0;

  const formatCurrency = (value: number) => (
    <StatValue
      value={value}
      currency={currencySymbol}
      className="text-sm font-bold"
      containerClassName="justify-end w-full"
    />
  );

  return (
    <div className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.taxes.totalTax')}</p>
            <StatValue 
              value={totalTax} 
              currency={currencySymbol} 
              className="text-2xl"
            />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.taxes.totalTaxDesc')}</p>
          </div>
          <div className="absolute end-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -me-10 -mt-10 pointer-events-none" />
        </div>

        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.taxes.taxableSales')}</p>
            <StatValue 
              value={taxableSales} 
              currency={currencySymbol} 
              className="text-2xl"
            />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.taxes.taxableSalesDesc')}</p>
          </div>
          <div className="absolute end-0 top-0 w-32 h-32 bg-mintcom-green/10 rounded-full blur-3xl -me-10 -mt-10 pointer-events-none" />
        </div>

        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.taxes.avgRate')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              <StatValue value={taxableSales > 0 ? averageTaxRate : 0} isPercentage={true} className="text-2xl" />
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.taxes.avgRateDesc')}</p>
          </div>
          <div className="absolute end-0 top-0 w-32 h-32 bg-mintcom-green/10 rounded-full blur-3xl -me-10 -mt-10 pointer-events-none" />
        </div>

        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.taxes.changedTaxOrders', { defaultValue: 'Changed-Tax Orders' })}</p>
            <StatValue value={changedOrders} isInteger={true} className="text-2xl" />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
              {changedRefunds > 0
                ? t('orders.reports.taxes.changedTaxRefundsDesc', {
                    defaultValue: '{{count}} Refunds Also Affected Changed-Tax Rows',
                    count: changedRefunds,
                  })
                : t('orders.reports.taxes.changedTaxOrdersDesc', {
                    defaultValue: 'POS Tax Edits in This Period',
                  })}
            </p>
          </div>
          <div className="absolute end-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -me-10 -mt-10 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 lg:items-start gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <BiIcon icon="bi-receipt" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('orders.reports.taxes.details')}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{t('orders.reports.taxes.detailsDesc', { defaultValue: 'Net tax grouped by applied rate and POS tax changes' })}</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4 text-start label-strong font-sans whitespace-nowrap">{t('orders.reports.taxes.type')}</th>
                  <th className="px-6 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.taxes.rate')}</th>
                  <th className="px-6 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.taxes.taxable')}</th>
                  <th className="px-6 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.taxes.netTax', { defaultValue: 'Net tax' })}</th>
                  <th className="px-6 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.taxes.share')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {hasTaxBreakdown ? (
                  taxBreakdown.map((tax, i: number) => {
                    const contribution = totalTax > 0 ? (tax.collected / totalTax) * 100 : 0;
                    const contributionWidth = Math.max(0, Math.min(100, contribution));
                    const markerClass = tax.isDeleted || tax.taxType === 'deleted'
                      ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400'
                      : tax.isServiceCharge
                        ? tax.isExemptRow
                          ? 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400'
                          : 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400'
                        : tax.taxType === 'changed'
                          ? 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400'
                          : tax.taxType === 'previous'
                            ? 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400'
                            : 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400';
                    const markerIcon = tax.isDeleted || tax.taxType === 'deleted'
                      ? <Trash2 size={16} />
                      : tax.isServiceCharge
                        ? tax.isExemptRow ? <Ban size={16} /> : <Receipt size={16} />
                        : tax.taxType === 'changed'
                          ? <FileEdit size={16} />
                          : tax.taxType === 'previous'
                            ? <History size={16} />
                            : <Percent size={16} />;
                    return (
                      <motion.tr 
                        key={tax.name || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4 text-start">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${markerClass}`}>
                              {markerIcon}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-900 dark:text-white">{tax.name}</span>
                                {(tax.isDeleted || tax.taxType === 'deleted') && (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30">
                                    {t('common.deleted', 'Deleted')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium flex-wrap mt-0.5">
                                <span>{tax.description}</span>
                                <span className="text-gray-300 dark:text-gray-600">·</span>
                                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                  <StatValue value={tax.transactions} isInteger={true} className="text-xs text-gray-500 dark:text-gray-400 font-bold inline-flex" />
                                  {t('orders.reports.taxes.txns')}
                                </span>
                                {tax.refundCount > 0 && (
                                  <>
                                    <span className="text-gray-300 dark:text-gray-600">·</span>
                                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-amber-600 dark:text-amber-400">
                                      <StatValue value={tax.refundCount} isInteger={true} className="text-xs font-bold inline-flex" />
                                      {t('orders.reports.taxes.refunds', { defaultValue: 'refunds' })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-end">
                          {tax.ratePercent > 0 ? (
                            <StatValue value={tax.ratePercent / 100} isPercentage={true} className="text-sm" containerClassName="justify-end w-full" />
                          ) : (
                            <span className="text-sm font-bold text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-end font-bold text-gray-900 dark:text-white">
                          {formatCurrency(tax.taxableAmount)}
                        </td>
                        <td className="px-6 py-4 text-end font-black text-orange-500">
                          {formatCurrency(tax.collected)}
                        </td>
                        <td className="px-6 py-4 text-end">
                          <div className="inline-flex items-center gap-2 w-[120px] justify-end">
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${contributionWidth}%` }} />
                            </div>
                            <StatValue
                              value={contribution}
                              isPercentage={true}
                              isAlreadyPercent={true}
                              className="text-xs font-bold text-gray-500 min-w-[40px] text-end"
                            />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : hasTaxActivity ? (
                  // Default Fallback Row if no granular data
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400 shrink-0 font-bold">
                          <Percent size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-gray-900 dark:text-white">{t('orders.reports.taxes.standardTax')}</span>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <StatValue value={salesData.totalOrders ?? 0} isInteger={true} className="text-xs text-gray-500 dark:text-gray-400 font-bold inline-flex" />
                              {t('orders.reports.taxes.txns')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-end font-bold text-gray-500">
                      <StatValue value={taxableSales > 0 ? averageTaxRate : 0} isPercentage={true} className="text-sm" containerClassName="justify-end w-full" />
                    </td>
                    <td className="px-6 py-4 text-end font-bold text-gray-900 dark:text-white">
                      {formatCurrency(taxableSales)}
                    </td>
                    <td className="px-6 py-4 text-end font-bold text-orange-500">
                      {formatCurrency(totalTax)}
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="inline-flex items-center gap-2 w-[120px] justify-end">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `100%` }} />
                        </div>
                        <StatValue
                          value={100}
                          isPercentage={true}
                          isAlreadyPercent={true}
                          className="text-xs font-bold text-gray-500 min-w-[40px] text-end"
                        />
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-14">
                      <AnalyticsEmptyState
                        icon={Scale}
                        title={t('orders.reports.taxes.noData')}
                        description={t('orders.reports.taxes.noDataDesc')}
                        compact
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tax Audit Summary Card with Full In-Card Explanation */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm p-5 sm:p-6 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('orders.reports.taxes.auditSummary', { defaultValue: 'Tax Audit Summary' })}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-mintcom-green/10 text-mintcom-green border border-mintcom-green/20">
                {t('orders.reports.taxes.auditTag', { defaultValue: 'Compliance' })}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('orders.reports.taxes.auditSummaryDesc', {
                defaultValue: 'Quick checks for tax-free sales and compliance',
              })}
            </p>
          </div>

          {/* Primary Metric Tile */}
          <div className="rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200/60 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-white/40">
                <BiIcon icon="bi-receipt" size={18} />
              </div>
              {toNumber(salesData.taxExemptSales) === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={12} />
                  {t('orders.reports.taxes.allSalesTaxed', { defaultValue: '100% Taxed' })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
                  <AlertCircle size={12} />
                  {t('orders.reports.taxes.hasExemptSales', { defaultValue: 'Exempt Sales' })}
                </span>
              )}
            </div>

            <StatValue
              value={toNumber(salesData.taxExemptSales)}
              currency={currencySymbol}
              className="text-2xl font-bold"
            />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mt-1">
              {t('orders.reports.taxes.taxFreeSales', { defaultValue: 'Tax-Free Sales' })}
            </p>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              {t('orders.reports.taxes.taxFreeSalesDesc', {
                defaultValue: 'Completed sales where no tax was collected after refunds are netted out.',
              })}
            </p>
          </div>

          {/* Explanation / Audit Guide Box */}
          <div className="rounded-2xl border border-mintcom-green/20 bg-mintcom-green/[0.03] dark:bg-mintcom-green/[0.05] p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
              <Info size={14} className="text-mintcom-green shrink-0" />
              <span>{t('orders.reports.taxes.auditGuideTitle', { defaultValue: 'How to use this audit check' })}</span>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-mintcom-green font-bold shrink-0">•</span>
                <p>{t('orders.reports.taxes.auditGuideWhat', { defaultValue: 'Tracks zero-tax items, tax-exempt customers (e.g. charities, diplomats), and manual 0% POS tax edits.' })}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-mintcom-green font-bold shrink-0">•</span>
                <p>{t('orders.reports.taxes.auditGuideWhy', { defaultValue: 'Use this figure for your tax declaration (Exempt Sales) and to ensure staff did not accidentally sell taxable items with zero tax.' })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
